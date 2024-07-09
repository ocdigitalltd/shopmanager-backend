import { QueryBuilder, Transaction } from "knex";
import { stdLogError } from "../../utils/logger";
import doWarehouseSetup from "./doWarehouseSetup";
import MdWarehouseSetup from "./mdWarehouseSetup";
import doParsingConditions from "../parsingConditions/doParsingConditions";
import { tpFilterQuery } from "../orderMail/tpMailOrders";
import MdParsingConditions from "../parsingConditions/mdParsingConditions";
import knex from "../../base/database/cfgKnex";
import { SHOPIFY_SETTING_ID } from "../../base/database/knex/seeds/seed";
import doMessage from "../message/doMessage";
import { MESSAGE_WAREHOUSE_LANDING_FLOW } from "../../data/dtMessages";

type tpWarehouseSetup = {
  name: string, email: string, parsingName: string, useLandingFlow: boolean,
  channelType: "relink" | "shopify",
  phone?: string
}

export const srAddWarehouse = async (
  trx: Transaction, data: tpWarehouseSetup
) => {
  const { name, email, parsingName, useLandingFlow, channelType, phone } = data
  try {
    const [added] = await doWarehouseSetup.insertOne(trx, {
      name, email, parsingName, useLandingFlow, channelType, phone
    })
    await doMessage.upsertOne(trx, { key: added.id, value: MESSAGE_WAREHOUSE_LANDING_FLOW, scope: "relink" }, ["key"])
  } catch (e) {
    stdLogError(e)
    throw new Error("Error in srAddWarehouse")
  }
}

export const srUpdateWarehouse = async (
  trx: Transaction, id: string, data: tpWarehouseSetup
) => {
  try {
    const existing = await doWarehouseSetup.findOneByCol(trx, "id", id)
    if (!existing) throw new Error("Invalid data, warehouse not found")
    await doWarehouseSetup.updateOneByColName(trx, {
      ...existing, ...data
    }, "id", existing.id)
  } catch (e) {
    stdLogError(e)
    throw new Error("Error in srUpdateWarehouse")
  }
}

type tpWarehouseParsingCond = {
  condType: "address" | "mail-subject" | "body", condValue: string, warehouseId: string,
}

export const srAddParsingCondition = async (
  trx: Transaction, data: tpWarehouseParsingCond
) => {
  const { condType, condValue, warehouseId } = data
  try {
    const existing = await doWarehouseSetup.findOneByCol(trx, "id", warehouseId)
    if (!existing) throw new Error("Invalid data, warehouse not found")
    await doParsingConditions.insertOne(trx, {
      condType, condValue, warehouseId
    })
  } catch (e) {
    stdLogError(e)
    throw new Error("Error in srAddParsingCondition")
  }
}

export type WarehouseSetting = {
  id: string,
  name: string,
  email: string,
  phone?: string,
  parsingName: string,
  useLandingFlow: boolean,
  isDefault: boolean,
  channelType: "relink" | "shopify",
  conditions: {
    [key: string]: string[]
  }
}
export const srGetAllWarehousesData = async (id?: string) => {
  let settings: WarehouseSetting[];
  try {
    await knex.transaction(async (trx: Transaction) => {
      const getAllWarehousesData = async () => {
        const qb = trx(MdWarehouseSetup.TABLE_NAME)
          .select('warehouse_setup.id', 'channelType', 'name', 'email', 'phone', 'parsingName', 'isDefault', 'useLandingFlow', 'condType', 'condValue')
          .leftJoin('parsing_conditions', 'warehouse_setup.id', 'parsing_conditions.warehouseId');

        if (id) qb.where(MdWarehouseSetup.col("id"), id)
        const results = await qb;
        const warehousesData = {};

        results.forEach(row => {
          const { id, name, email, phone, parsingName, useLandingFlow, isDefault, condType, condValue, channelType } = row;

          if (!warehousesData[name]) {
            warehousesData[name] = {
              id,
              name,
              email,
              phone,
              parsingName,
              useLandingFlow,
              isDefault,
              channelType,
              conditions: {}
            };
          }

          const warehouseData = warehousesData[name];

          if (!warehouseData.conditions[condType]) {
            warehouseData.conditions[condType] = [];
          }

          if (condValue) {
            warehouseData.conditions[condType].push(condValue);
          }
        });

        return Object.values(warehousesData);
      };


      // Example usage:
      settings = await getAllWarehousesData() as WarehouseSetting[];
      // console.log(JSON.stringify(allWarehousesData, null, 2));
    })

  } catch (e) {
    stdLogError(e)
    throw new Error("Error in srGetAllWarehousesData")
  }
  return settings
}

export const srGetWarehousesList = async (trx: Transaction, query: tpFilterQuery) => {
  try {
    const { page, pageSize, column, sort, searchText } = query;
    let qb: QueryBuilder<unknown[], unknown[]>;
    qb = doWarehouseSetup.getAll(trx).whereNot(MdWarehouseSetup.col("id"), SHOPIFY_SETTING_ID);
    if (column && column !== "") {
      qb.orderBy(column, sort ?? "desc");
    } else qb.orderBy("created_at", "desc");

    // added search on sku or name
    if (searchText) {
      qb = qb.where((builder) => {
        builder.where("name", "ilike", `%${searchText}%`);
      });
    }

    const list = pageSize ? await qb.limit(pageSize).offset(page * pageSize) : await qb
    const total = await qb.clearSelect()
      .clearOrder()
      .clearGroup()
      .offset(0)
      .limit(10)
      .count()
      .first()
      .then((c: { count?: number }) => +(c?.count || 0));
    return { list, total }
  } catch (e) {
    console.log("Error getting all warehouses:", e)
    throw new Error("Error getting warehouses");
  }
};

export const srGetWhConditions = async (trx: Transaction, id: string, query: tpFilterQuery) => {
  try {
    const { page, pageSize, column, sort } = query
    let qb: QueryBuilder<unknown[], unknown[]>;
    qb = doParsingConditions.getAll(trx).where(MdParsingConditions.col("warehouseId"), id);
    if (column && column !== "") {
      qb.orderBy(column, sort ?? "desc");
    } else qb.orderBy("created_at", "desc");
    const list = await qb.limit(pageSize).offset(page * pageSize)
    const total = await qb.clearSelect()
      .clearOrder()
      .clearGroup()
      .offset(0)
      .limit(10)
      .count()
      .first()
      .then((c: { count?: number }) => +(c?.count || 0));
    return { list, total }
  } catch (e) {
    console.log("Error getting srGetWhConditions:", e)
    throw new Error("Error getting srGetWhConditions");
  }
};