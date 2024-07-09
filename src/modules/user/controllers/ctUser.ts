import { NextFunction, Request, Response } from "express";
import doUser from "../doUser";
import knex from "../../../base/database/cfgKnex";
import { Transaction } from "knex";
import doCustomers from "../../customers/doCustomers";
import doRelinkOrders from "../../relinkOrders/doRelinkOrders";
import doCustomerProducts from "../../customerProducts/doCustomerProducts";

export const ctLogin = async (req: Request, res: Response) => {
  try {
    knex.transaction(async (trx) => {
      const { email, password } = req.body;
      const user = await doUser.findOneByPredicate(trx, { email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.password !== password) {
        return res.status(400).json({ error: "Invalid password" });
      }
      const findCustomer = await doCustomers.findOneByCol(trx, "userId", user.id)
      return user?.role === 'admin' ? res.status(200).json({ ...user }) :
        res.status(200).json({ ...findCustomer, ...user, source: findCustomer && findCustomer?.addedBy })
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const ctGetUserDataById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    if (!id) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        const user = await doUser.findOneByCol(trx, "id", id);
        if (!user) res.status(404).send({ message: "Invalid data provided" });
        else {
          const findCustomer = await doCustomers.findOneByCol(trx, "userId", id)
          const customer = await doCustomers.getAllCustomers(trx, findCustomer?.id).first()
          return user?.role === 'admin' ?
            res.send(user) :
            res.send({ ...customer, customerId: findCustomer?.id, ...user, source: findCustomer ? findCustomer?.addedBy : undefined })
        }
      });
    }
  } catch (e) {
    next(e);
  }
};

export const ctUpdateUserDataById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    if (!id || !req.body.password) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        const user = await doUser.findOneByCol(trx, "id", id);
        if (!user) res.status(404).send({ message: "Invalid data provided" });
        else {
          const findCustomer = await doCustomers.findOneByCol(trx, "userId", id)
          await doUser.updateOneByColName(trx, {
            username: req.body.name ?? findCustomer?.name,
            email: req.body.email ?? findCustomer?.email,
            phone: req.body.phone ?? findCustomer?.phone,
            password: req.body.password
          }, "id", id)
          await doCustomers.updateOneByColName(trx, {
            name: req.body.name ?? findCustomer?.name,
            email: req.body.email ?? findCustomer?.email,
          }, "userId", id)
          return res.send({ message: "User data updated successfully" });
        }
      });
    }
  } catch (e) {
    next(e);
  }
};

export const getAllUserProductsById = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params
    if (!id) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        const user = await doUser.findOneByCol(trx, "id", id);
        if (!user) res.status(404).send({ message: "Invalid data provided" });
        else {
          let list: any[] = []
          const findCustomer = await doCustomers.findOneByCol(trx, "userId", id)
          if (findCustomer && findCustomer?.addedBy === 'parsing') {
            const orders = await doRelinkOrders.getAllOrdersWithProducts(trx, undefined, findCustomer.id)
            if (orders && orders?.length > 0 && orders[0]?.products) {
              list = orders[0]?.products
            }
          } else if (findCustomer && findCustomer?.addedBy === 'user') {
            const products = await doCustomerProducts.getCustomerProductsById(trx, findCustomer?.id)
            list = products
          }
          res.send({ list, total: list?.length });
        }
      });
    }
  } catch (e) {
    next(e);
  }
};