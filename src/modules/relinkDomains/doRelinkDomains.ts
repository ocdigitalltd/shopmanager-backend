import { Transaction } from "knex";
import BaseDao from "../../base/dao/doBase";
import MdRelinkDomains from "./mdRelinkDomains";

class DoRelinkDomains extends BaseDao<MdRelinkDomains> {
  constructor() {
    super(MdRelinkDomains.TABLE_NAME);
  }

  getAllUserCreatedDomains(trx:Transaction, query?: string){
    const qb= trx(this.tableName).where(this.getColumn("createdBy", false), "user")
    if(query && query?.length>3) qb.where(this.getColumn("sku", false), "ilike", `%${query}%`)
    return qb
  }
}

export default new DoRelinkDomains();
