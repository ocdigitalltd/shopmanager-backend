import { Transaction } from "knex";
import knex from "../../base/database/cfgKnex";
import { srAddParsingCondition, srAddWarehouse, srGetAllWarehousesData, srGetWarehousesList, srGetWhConditions, srUpdateWarehouse } from "./srWarehouseSetup";
import doWarehouseSetup from "./doWarehouseSetup";
import doParsingConditions from "../parsingConditions/doParsingConditions";
import doMessage from "../message/doMessage";

export const addNewWarehouse = async (req, res, next)
  : Promise<void> => {
  try {
    if (req.body && req.body.name && req.body.email) {
      await knex.transaction(async (trx: Transaction) => {
        await srAddWarehouse(trx, req.body);
        return res.send({ message: "Warehouse added successfully" });
      })
    } else res.status(404).send({ message: "Invalid data provided" });
  } catch (err) {
    next(err)
  }
};

export const deleteWarehouseSetup = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params
    if (!id) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        await doMessage.deleteOneByCol(trx, "key", id)
        await doWarehouseSetup.deleteOneByCol(trx, "id", id);
        return res.send({ message: "Warehouse setup removed successfully" });
      })
    }
  } catch (err) {
    next(err)
  }
};

export const updateWarehouseSetup = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params
    if (!id || !req.body.email) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        await srUpdateWarehouse(trx, id, req.body)
        return res.send({ message: "Data updated successfully" });
      })
    }
  } catch (err) {
    next(err)
  }
};

export const addConditionForWarehouse = async (req, res, next)
  : Promise<void> => {
  try {
    if (!req.body.warehouseId) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        await srAddParsingCondition(trx, req.body)
        return res.send({ message: "Data added successfully" });
      })
    }
  } catch (err) {
    next(err)
  }
};

export const deleteParsingCondition = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params
    if (!id) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        await doParsingConditions.deleteOneByCol(trx, "id", id);
        return res.send({ message: "Parsing condition removed successfully" });
      })
    }
  } catch (err) {
    next(err)
  }
};

export const getAllWarehouses = async (req, res, next)
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const { list, total } = await srGetWarehousesList(trx, req.query);
      if (list) {
        return res.send({ list, total });
      }
      return res.send({ list: [], total: 0 });
    });
  } catch (e) {
    next(e);
  }
};

export const getWarehousesData = async (req, res, next)
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      await srGetAllWarehousesData();
    });
    res.send("Data retrieved")
  } catch (e) {
    next(e);
  }
};

export const getConditionsByWarehouse = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params
    if (!id) res.status(404).send({ message: "Invalid data provided" });
    await knex.transaction(async (trx: Transaction) => {
      const { list, total } = await srGetWhConditions(trx, id, req.query);
      if (list) {
        return res.send({ list, total });
      }
      return res.send({ list: [], total: 0 });
    });
  } catch (e) {
    next(e);
  }
};