import { Transaction } from "knex";
import BaseDao from "../../base/dao/doBase";
import MdCustomers from "./mdCustomers";
import MdCustomerProducts from "../customerProducts/mdCustomerProducts";
import MdRelinkDomains from "../relinkDomains/mdRelinkDomains";

class DoCustomers extends BaseDao<MdCustomers> {
  constructor() {
    super(MdCustomers.TABLE_NAME);
  }

  getAllCustomers(trx: Transaction, customerId?: string) {
    let qb = trx(this.tableName).select(
      'customers.incrementalId',
      'customers.id as id',
      'customers.name',
      'customers.phone',
      'customers.email',
      'customers.alternateEmail as aemail',
      'customers.billingAddress',
      'customers.shippingAddress',
      'customers.created_at',
      'customers.updated_at',
      'thirdLvlDomain',
      'productName',
      'productSku',
      'surfaceType',
      'redirectUrl',
      'businessUrlType', 'addedBy')
      .leftJoin(MdCustomerProducts.TABLE_NAME, MdCustomerProducts.col("customerId"), MdCustomers.col("id"))
      .leftJoin(MdRelinkDomains.TABLE_NAME, MdRelinkDomains.col("id"), MdCustomerProducts.col("thirdLvlDomainId"))

    if (!customerId) qb.where((innerQ) => {
      innerQ.where(MdCustomerProducts.col("isPrimary"), true)
      .whereNot(MdCustomers.col("addedBy"), 'parsing')
        .whereNotNull(MdCustomerProducts.col("customerId"))
    }).orWhere(MdCustomers.col("addedBy"), 'parsing')

    if (customerId) qb.where(MdCustomers.col("id"), customerId)

    return qb
  }
}

export default new DoCustomers();
