import { Transaction } from "knex";
import knex from "../../base/database/cfgKnex";
import { createDomainForCustomer, createNewCustomer, srDeleteCustomer, srGetAllCustomers, srUpdateCustomerData } from "./srCustomer";
import { srDeleteCustomerProduct, srGetCustomerProductsById } from "../customerProducts/srCustomerProducts";
import doCustomers from "./doCustomers";

export const addNewCustomer = async (req, res, next)
  : Promise<void> => {
  try {
    if (req.body && req.body.redirectUrl && req.body.thirdLvlDomain && req.body.email) {
      await createNewCustomer(req.body);
      return res.send({ message: "Customer created successfully" });
    } else res.status(404).send({ message: "Invalid data provided" });
  } catch (err) {
    next(err)
  }
};

export const getAllCustomers = async (req, res, next)
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const { list, total } = await srGetAllCustomers(trx, req.query);
      if (list) {
        return res.send({ list, total });
      }
      return res.send({ list: [], total: 0 });
    });
  } catch (e) {
    next(e);
  }
};

export const updateCustomer = async (req, res, next)
  : Promise<void> => {
  try {
    if (req.body && req.body.id && req.body.redirectUrl && req.body.thirdLvlDomain && req.body.email) {
      await knex.transaction(async (trx: Transaction) => {
        const existingCustomer = await doCustomers.findOneByCol(trx, "id", req.body.id)
        if (existingCustomer && existingCustomer.id) {
          await srUpdateCustomerData(trx, existingCustomer, req.body);
          return res.send({ message: "Customer data updated successfully" });
        } else res.status(404).send({ message: "Invalid data provided" });
      })
    } else res.status(404).send({ message: "Invalid data provided" });
  } catch (err) {
    next(err)
  }
};

export const getCustomerProductsById = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params
    if (!id) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        const { list, total } = await srGetCustomerProductsById(trx, id, req.query);
        if (list) {
          return res.send({ list, total });
        }
        return res.send({ list: [], total: 0 });
      });
    }
  } catch (e) {
    next(e);
  }
};

export const addOtherDomainForCustomer = async (req, res, next)
  : Promise<void> => {
  try {
    if (req.body && req.body.redirectUrl && req.body.thirdLvlDomain && req.body.customerId) {
      await knex.transaction(async (trx: Transaction) => {
        await createDomainForCustomer(trx, req.body.customerId, req.body, false);
      })
      return res.send({ message: "Domain created successfully" });
    } else res.status(404).send({ message: "Invalid data provided" });
  } catch (err) {
    next(err)
  }
};

export const deleteCustomerProductById = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params
    if (!id) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        const deleteProduct = await srDeleteCustomerProduct(trx, id)
        if (deleteProduct) res.send({ message: "Domain deleted successfully" });
        else res.status(404).send({ message: "Invalid data provided" })
      });
    }
  } catch (e) {
    next(e);
  }
};

export const deleteCustomerById = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params
    if (!id) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        const findCustomer = await doCustomers.findOneByCol(trx, "id", id)
        if (findCustomer && findCustomer.userId) {
          await srDeleteCustomer(trx, findCustomer)
          res.send({ message: "Customer deleted successfully" });
        } else res.status(404).send({ message: "Invalid data provided" });
      });
    }
  } catch (e) {
    next(e);
  }
};