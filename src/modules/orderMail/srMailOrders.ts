import { QueryBuilder, Transaction } from "knex";
import knex from "../../base/database/cfgKnex";
import doMailOrders from "./doMailOrders";
import { enumOrderStatus, tpFilterQuery, tpOrder } from "./tpMailOrders";

const srAddNewOrder = async (orderData: tpOrder) => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const {
        gmailMsgId,
        mailSubject,
        name,
        orderNumber,
        phone,
        address,
        isValidAddress,
        orderDetails,
        shopId
      } = orderData;

      const orderExists = await doMailOrders.findOneByPredicate(trx, {
        gmailMsgId,
        orderNumber,
      });

      if (orderExists) {
        return;
      } else {
        await doMailOrders.insertOne(trx, {
          shopId,
          gmailMsgId,
          mailSubject,
          name,
          orderNumber,
          phone,
          address,
          isValidAddress,
          orderDetails: JSON.stringify(orderDetails),
        });
        console.log(orderNumber, " added to database");
      }
    });
  } catch (error) {
    console.error("Error adding new order:", error);
  }
};

export const srGetMessageForUnProcessOrder = async () => {
  return await knex.transaction(async (trx: Transaction) => {
    const unprocessedOrders = await doMailOrders.findAllByPredicate(trx, {
      isProcessed: false,
      orderStatus: "new"
    });

    if (unprocessedOrders.length > 0) {
      return unprocessedOrders as tpOrder[];
    } else {
      return [];
    }
  });
};

export const srProcessOrder = async (orderData: tpOrder): Promise<void> => {
  try {
    await srAddNewOrder(orderData);
  } catch (e) {
    console.error("Error processing order:", e);
  }
};
export const other = "";

export const srMarkOrderStatus = async (gmailMsgId: string, status: enumOrderStatus) => {
  return await knex.transaction(async (trx: Transaction) => {
    await doMailOrders.updateOneByPredicate(
      trx,
      {
        orderStatus: status,
        isProcessed: true,
      },
      { gmailMsgId: gmailMsgId }
    );
  });
};

export const srMarkOrderAsPending = async (gmailMsgId: string) => {
  return await knex.transaction(async (trx: Transaction) => {
    await doMailOrders.updateOneByPredicate(
      trx,
      {
        orderStatus: "pending",
      },
      { gmailMsgId: gmailMsgId }
    );
  });
};

export const srGetAllOrders = async (trx: Transaction, query: tpFilterQuery) => {
  try {
    const status = query.q as enumOrderStatus
    const { page, pageSize, column, sort, searchText } = query;
    let qb: QueryBuilder<unknown[], unknown[]> = doMailOrders.getAllOrders(trx, status);
  
    // added search on customerName or orderId
    if (searchText) {
      qb = qb.where((builder) => {
        builder.where("name", "ilike", `%${searchText}%`);
        builder.orWhere("orderNumber", "ilike", `%${searchText}%`);
      });
    }

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
    console.log("Error getting all orders:", e)
    throw new Error("Error getting orders");
  }
};
