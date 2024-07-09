import { Transaction } from "knex";
import BaseDao from "../../../base/dao/doBase";
import MdOrderProducts from "./mdOrderProducts";
import MdRelinkDomains from "../../relinkDomains/mdRelinkDomains";
import MdRelinkOrders from "../mdRelinkOrders";

class DoOrderProducts extends BaseDao<MdOrderProducts> {
  constructor() {
    super(MdOrderProducts.TABLE_NAME);
  }

  getOrderProductsByCustomerId(trx: Transaction, id: string) {
    let qb = trx(this.tableName).select(
      'order_products.id',
      'thirdLvlDomain',
      'redirectUrl',
      'businessUrlType',
      'order_products.created_at',
      'order_products.updated_at',
      'productName',
      'surfaceType',
      'sku',
      'isActive',
      trx.raw("'parsing' as ??", ["source"])
      )
      .innerJoin(MdRelinkDomains.TABLE_NAME, MdRelinkDomains.col("id"), MdOrderProducts.col("thirdLvlDomainId"))
      .innerJoin(MdRelinkOrders.TABLE_NAME, MdRelinkOrders.col("id"), MdOrderProducts.col("relinkOrderId"))
      .where(MdOrderProducts.col("isDomainCreated"), true)
      .andWhere(MdRelinkOrders.col("customerId"), id)
      .andWhere(MdRelinkDomains.col("isActive"), true)

    return qb
  }
}

export default new DoOrderProducts();
