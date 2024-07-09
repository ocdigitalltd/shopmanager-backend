import { Transaction } from "knex";
import BaseDao from "../../base/dao/doBase";
import MdCustomerProducts from "./mdCustomerProducts";
import MdCustomers from "../customers/mdCustomers";
import MdRelinkDomains from "../relinkDomains/mdRelinkDomains";

class DoCustomerProducts extends BaseDao<MdCustomerProducts> {
  constructor() {
    super(MdCustomerProducts.TABLE_NAME);
  }

  getCustomerProductsById(trx: Transaction, id: string) {
    let qb = trx(this.tableName).select(
      'customer_products.id',
      'thirdLvlDomain',
      'redirectUrl',
      'businessUrlType',
      'customer_products.created_at',
      'customer_products.updated_at',
      'productName',
      'surfaceType',
      'sku',
      'isActive',
      trx.raw("'admin-panel'  as ??", ["source"])
    )
      .innerJoin(MdRelinkDomains.TABLE_NAME, MdRelinkDomains.col("id"), MdCustomerProducts.col("thirdLvlDomainId"))
      .innerJoin(MdCustomers.TABLE_NAME, MdCustomerProducts.col("customerId"), MdCustomers.col("id"))
      .where(MdCustomerProducts.col("isPrimary"), false)
      .andWhere(MdCustomerProducts.col("customerId"), id)

    return qb
  }
}

export default new DoCustomerProducts();
