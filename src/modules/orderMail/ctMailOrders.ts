import { Transaction } from "knex";
import { Env } from "../../base/loaders/appLoader";
import {
  srGetMessagesForValidAddress, srGetMessagesForNonValidAddress, sendMessageToNumber,
  srGetMessagesForAllTemplates, srFillPlaceholdersInMsg
} from "../../utils/messaging";
import doMailOrders from "./doMailOrders";
import MdOrders from "./mdMailOrders";
import { srGetAllOrders } from "./srMailOrders";
import knex from "../../base/database/cfgKnex";
import doMessage from "../message/doMessage";
import MdMessage from "../message/mdMessage";
import { tpOrder } from "./tpMailOrders";

export const getAllOrders = async (req, res, next)
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const { list, total } = await srGetAllOrders(trx, req.query);
      if (list) {
        const addMessagesToOrders = list.map(async (item) => {
          const messages = await srGetMessagesForAllTemplates(item)
          return {
            ...item,
            messages,
          };
        });
        const orders = await Promise.all(addMessagesToOrders);
        return res.send({ list: orders, total });
      }
      return res.send({ list: [], total: 0 });
    });
  } catch (e) {
    next(e);
  }
};

export const deleteOrderByOrderNumber = async (req, res, next)
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const { orderId } = req.body;
      const order = orderId ? await doMailOrders.findOneByPredicate(trx, { id: orderId }) : undefined;
      if (order && order.id) {
        await doMailOrders.deleteOneByCol(trx, "id", orderId);
        return res.send({ message: "Order deleted successfully" });
      }
      return res.status(404).send({ message: "Order not found" });
    });
  } catch (e) {
    next(e);
  }
};


export const sendTestMessageForOrder = async (req, res) => {
  try {
    const order = req.body;
    if (order && order.orderStatus !== "sent") {
      let message1, message2, message3;

      if (order.isValidAddress) {
        ({ message1, message2, message3 } = await srGetMessagesForValidAddress(
          order
        ));
      } else {
        ({ message1, message2, message3 } =
          await srGetMessagesForNonValidAddress(order));
      }

      const TEST_RECEIVER_NUMBER = Env.TEST_RECEIVER_NUMBER;

      await sendMessageToNumber(TEST_RECEIVER_NUMBER, [
        message1,
        message2,
        message3,
      ], order.gmailMsgId);

      return res.send("Msg sent successfully");
    }
    return res.send("Order not found");
  } catch (error) {
    console.error("Error sending test message:", error);
    return res.send("Error sending test message");
  }
};

export const sendTestMessageForOrderByMsgId = async (req, res, next) => {
  try {
    const order = req.body;
    if (order && order.orderId && order.msgId) {
      let message;
      await knex.transaction(async (trx) => {
        const msgTemplate: MdMessage = await doMessage.findOneByCol(trx, "id", order.msgId);
        const orderMd: tpOrder = await doMailOrders.findOneByCol(trx, "gmailMsgId", order.orderId);
        if (msgTemplate && msgTemplate.value && orderMd) {
          message = srFillPlaceholdersInMsg(msgTemplate.value, orderMd)
        }
        await trx.commit();
      });

      const TEST_RECEIVER_NUMBER = Env.TEST_RECEIVER_NUMBER;

      if (message && message !== "") {
        const isSent = await sendMessageToNumber(TEST_RECEIVER_NUMBER, [
          message
        ])
        if (isSent) res.send({ message: "Message sent successfully" });
        else res.send({ message: "Could not send message" })
      }
      else res.send({ message: "Could not send message" })
    }
    else throw new Error("Invalid data provided");
  } catch (error) {
    console.error("Error sending test message:", error);
    return res.status(500).send({ message: "Error sending test message" });
  }
};


export const updateStatusForOrders = async (req, res) => {
  try {
    const { orderIds, status } = req.body;
    if (orderIds && status) {
      await knex.transaction(async (trx) => {
        await Promise.all(orderIds.map(async (order: string) => {
          const orderMd: tpOrder = await doMailOrders.findOneByCol(trx, "id", order);
          if (orderMd) {
            await doMailOrders.updateOneByPredicate(
              trx,
              {
                orderStatus: status,
              },
              { id: order }
            );
          }
        }))
        await trx.commit();
      });
      res.send({ message: "Status updated successfully" })
    }
    else throw new Error("Invalid data provided");
  } catch (error) {
    console.error("Error sending test message:", error);
    return res.status(500).send({ message: "Error updating status" });
  }
};