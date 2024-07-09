import { Transaction } from "knex";
import doMessage from "./doMessage";
import knex from "../../base/database/cfgKnex";
import MdMessage from "./mdMessage";
import { stdLogError } from "../../utils/logger";
import { tpRelinkOrderData } from "../relinkOrders/tpRelinkOrders";
import { srMarkRelinkOrderStatus } from "../relinkOrders/srRelinkOrders";

export const srGetMessageTemplateByKey = async (msgKey: string) => {
  let message = ""
  try {
    await knex.transaction(async (trx: Transaction) => {
      const messageMd: MdMessage = await doMessage.findOneByPredicate(trx, { key: msgKey });
      message = messageMd?.value
    });
  } catch (e) {
    stdLogError("Error in srGetMessageTemplateByKey", e)
  }
  return message
}

export const generateItalianWarehouseMsgTemplate = async (order: tpRelinkOrderData) => {
  let finalMsg = ""
  try {
    const message = await srGetMessageTemplateByKey(order.whId)
    if (message && message !== "") {
      const prodList = order.products.map((prod, idx) => `${idx + 1}. ${prod.productName} (${prod.surfaceType}) - ${prod.sku}
      `).join('')
      finalMsg = message.replace(/\$ORDERNUM\$/g, order.orderNum as unknown as string)
        .replace(/\$CUSTOMERNAME\$/g, order.customerName)
        .replace(/\$SHIPPINGADDRESS\$/g, order.shippingAddress)
        .replace(/\$PRODUCTLIST\$/g, prodList)
    } else await srMarkRelinkOrderStatus(order.id, "whatsapp-send-fail")
  } catch (e) {
    stdLogError("Error in generateItalianWarehouseMsgTemplate", e)
    await srMarkRelinkOrderStatus(order.id, "whatsapp-send-fail")
  }
  return finalMsg
}

export const generateNonItalianWarehouseMsgTemplate = async (order: tpRelinkOrderData) => {
  let finalMsg = ""
  try {
    const message = await srGetMessageTemplateByKey(order.whId)
    if (message && message !== "") {
      const prodList = order.products.map((prod, idx) => `${idx + 1}. ${prod.productName} (${prod.surfaceType}) - ${prod.sku} : ${prod.thirdLvlDomain}.ocdbiz.cloud
      `).join('')
      finalMsg = message.replace(/\$ORDERNUM\$/g, order.orderNum as unknown as string)
        .replace(/\$CUSTOMERNAME\$/g, order.customerName)
        .replace(/\$SHIPPINGADDRESS\$/g, order.shippingAddress)
        .replace(/\$PRODUCTLIST\$/g, prodList)
    } else await srMarkRelinkOrderStatus(order.id, "whatsapp-send-fail")
  } catch (e) {
    stdLogError("Error in generateNonItalianWarehouseMsgTemplate", e)
    await srMarkRelinkOrderStatus(order.id, "whatsapp-send-fail")
  }
  return finalMsg
}