import { Transaction } from "knex";
import BaseDao from "../../base/dao/doBase";
import MdRelinkOrders from "./mdRelinkOrders";
import { tpRelinkOrderStatus } from "./tpRelinkOrders";

class DoRelinkOrders extends BaseDao<MdRelinkOrders> {
  constructor() {
    super(MdRelinkOrders.TABLE_NAME);
  }

  getAllOrdersWithProducts(trx: Transaction, status?: tpRelinkOrderStatus, customerId?: string) {
    let qb = trx.select(
      'ro.id as id',
      'ro.orderNum',
      'cu.name as customerName',
      'ro.orderTotal',
      'cu.phone',
      'cu.email',
      'cu.billingAddress',
      'cu.shippingAddress',
      'ro.isItalian',
      'ro.orderStatus',
      'ro.created_at',
      'ro.updated_at',
      'ro.warehouseEmail as whEmail',
      'ws.phone as whPhone',
      'ro.warehouseId as whId',
      trx.raw(`json_agg(json_build_object(
        'productId', "op"."id", 
        'productName', op."productName", 
        'productSize', op."productSize", 
        'surfaceType', op."surfaceType", 
        'productQuantity', op."productQuantity", 
        'productPrice', op."productPrice", 
        'redirectUrlType', op."businessUrlType", 
        'redirectUrl', op."businessUrl", 
        'thirdLvlDomain', rd."thirdLvlDomain",
        'isActive', rd."isActive",
        'isDomainCreated', op."isDomainCreated",
        'sku', op."productSku"
      )) as products`))
      .from('relink_orders as ro')
      .leftJoin('order_products as op', 'ro.id', 'op.relinkOrderId')
      .leftJoin('relink_domains as rd', 'op.thirdLvlDomainId', 'rd.id')
      .leftJoin('customers as cu', 'cu.id', 'ro.customerId')
      .leftJoin('warehouse_setup as ws', 'ws.id', 'ro.warehouseId')

    if (status) qb.where('ro.orderStatus', '=', status)
    if (customerId) qb.where('cu.id', '=', customerId)
    return qb.groupBy(
      "ro.id",
      "cu.name",
      "cu.phone",
      "cu.email",
      "cu.billingAddress",
      "cu.shippingAddress",
      "ws.phone"
    );
  }
}

export default new DoRelinkOrders();
