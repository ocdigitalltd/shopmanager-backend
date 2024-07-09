import { Transaction } from "knex";
import BaseDao from "../../base/dao/doBase";
import MdOrders from "./mdMailOrders";
import MdWarehouseSetup from "../warehouseSetup/mdWarehouseSetup";

class DoOrders extends BaseDao<MdOrders> {
  constructor() {
    super(MdOrders.TABLE_NAME);
  }

  getAllOrders(trx: Transaction, status: string) {
    const qb = trx(this.tableName).select(
      `${this.tableName}.*`, `warehouse_setup.name as shopName`
    ).innerJoin(MdWarehouseSetup.TABLE_NAME, MdWarehouseSetup.col("id"), MdOrders.col("shopId"))
    if (status && status !== "") return qb.where(MdOrders.col("orderStatus", false), status)
    else return qb
  }
}

export default new DoOrders();
