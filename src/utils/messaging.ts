import knex from "../base/database/cfgKnex";
import { Env } from "../base/loaders/appLoader";
import doMessage from "../modules/message/doMessage";
import MdMessage from "../modules/message/mdMessage";
import { srMarkOrderStatus } from "../modules/orderMail/srMailOrders";
import { tpOrder } from "../modules/orderMail/tpMailOrders";
import { sendSmsMessage } from "./sms";
import { isPhoneNumberOnWhatsApp, sendWhatsappMessageViaWatVerifyApi } from "./whatspp";

export const sendMessageToNumber = async (
  number: string,
  message: string[],
  msgId?: string
): Promise<boolean> => {
  // check if number is on whatsapp
  try {
    // add delay for 20 seconds as suggested by API provider
    await new Promise((resolve) => setTimeout(resolve, 20000));
    const isNumberOnWhatsApp = await isPhoneNumberOnWhatsApp(number, msgId);
    if (isNumberOnWhatsApp) {
      // send message to number via WhatsApp
      for (let i = 0; i < message.length; i++) {
        await sendWhatsappMessageViaWatVerifyApi(number, message[i], msgId);
        console.log("Message sent to number via WhatsApp", number);
        // add delay for 20 seconds as suggested by API provider
        await new Promise((resolve) => setTimeout(resolve, 20000));
      }
      return true;
    } else {
      // send message to number via SMS
      for (let i = 0; i < message.length; i++) {
        await sendSmsMessage(number, message[i], msgId);
        console.log("Message sent to number via SMS", number);
        // add delay for 20 seconds as suggested by API provider
        await new Promise((resolve) => setTimeout(resolve, 20000));
      }
      return true;
    }
  } catch (error) {
    console.error("Error sending message:", error);
    if(msgId) await srMarkOrderStatus(msgId, "failed")
    return false;
  }
};

export const srFillPlaceholdersInMsg = (inputMsg: string, order: tpOrder) => {
  return inputMsg
    .replace(/\$ORDERNAME\$/g, order.name)
    .replace(/\$ORDERDETAILSNAME\$/g, order.orderDetails.name)
    .replace(
      /\$ORDERDETAILSVALUE\$/g,
      order.orderDetails.orderInfo.find((item) => item.title === "Totale")
        ?.value || order.orderDetails.price
    )
    .replace(/\$ORDERNUMBER\$/g, order.orderNumber)
    .replace(/\$ORDERADDRESS\$/g, order.address)
    .replace(/\$ORDERPHONE\$/g, order.phone);
}

export const srMessagingForNonValidAddress = async (order: tpOrder) => {
  let { message1, message2, message3 } = await srGetMessagesForNonValidAddress(order);

  const isProcessed = await sendMessageToNumber(order.phone, [
    message1,
    message2,
    message3,
  ], order.gmailMsgId);
  // const isProcessed = true; // to remove after uncommenting above line
  if (isProcessed) {
    return true;
  }
  return false;
};

export const srMessagingForValidAddress = async (order: tpOrder) => {
  let { message1, message2, message3 } = await srGetMessagesForValidAddress(order);

  const isProcessed = await sendMessageToNumber(order.phone, [
    message1,
    message2,
    message3,
  ], order.gmailMsgId);
  // const isProcessed = true; // to remove after uncommenting above line
  if (isProcessed) {
    return true;
  }
  return false;
};

export async function srGetMessagesForNonValidAddress(order: tpOrder) {
  let allValidAddressMessage;
  await knex.transaction(async (trx) => {
    allValidAddressMessage = await doMessage.getAll(trx);
    await trx.commit();
  });

  const validAddressMessages = allValidAddressMessage.filter((item) => {
    return (
      item.key === "MESSAGE_1_NON_VALID_ADDRESS" ||
      item.key === "MESSAGE_2_NON_VALID_ADDRESS" ||
      item.key === "MESSAGE_3_NON_VALID_ADDRESS"
    );
  });
  let message1 = validAddressMessages.find(
    (item) => item.key === "MESSAGE_1_NON_VALID_ADDRESS"
  )?.value || "";
  let message2 = validAddressMessages.find(
    (item) => item.key === "MESSAGE_2_NON_VALID_ADDRESS"
  )?.value || "";
  let message3 = validAddressMessages.find(
    (item) => item.key === "MESSAGE_3_NON_VALID_ADDRESS"
  )?.value || "";

  message1 = srFillPlaceholdersInMsg(message1, order);
  message2 = srFillPlaceholdersInMsg(message2, order);
  message3 = srFillPlaceholdersInMsg(message3, order);
  return { message1, message2, message3 };
}

export async function srGetMessagesForValidAddress(order: tpOrder) {
  let allValidAddressMessage;
  await knex.transaction(async (trx) => {
    allValidAddressMessage = await doMessage.getAll(trx);
    await trx.commit();
  });

  const validAddressMessages = allValidAddressMessage.filter((item) => {
    return (
      item.key === "MESSAGE_1_VALID_ADDRESS" ||
      item.key === "MESSAGE_2_VALID_ADDRESS" ||
      item.key === "MESSAGE_3_VALID_ADDRESS"
    );
  });
  let message1 = validAddressMessages.find((item) => item.key === "MESSAGE_1_VALID_ADDRESS")
    ?.value || "";
  let message2 = validAddressMessages.find((item) => item.key === "MESSAGE_2_VALID_ADDRESS")
    ?.value || "";
  let message3 = validAddressMessages.find((item) => item.key === "MESSAGE_3_VALID_ADDRESS")
    ?.value || "";

  message1 = srFillPlaceholdersInMsg(message1, order);
  message2 = srFillPlaceholdersInMsg(message2, order);
  message3 = srFillPlaceholdersInMsg(message3, order);
  return { message1, message2, message3 };
}


export async function srGetMessagesForAllTemplates(order: tpOrder) {
  try {
    let allValidAddressMessage: MdMessage[];
    await knex.transaction(async (trx) => {
      allValidAddressMessage = await doMessage.getAll(trx);
      await trx.commit();
    });
    let allMessages: { messageId: string, messageTitle: string, messageBody: string }[] = []
    allMessages = allValidAddressMessage.map((item) => {
      const message = srFillPlaceholdersInMsg(item.value, order);
      return { messageId: item.id as unknown as string, messageTitle: item.key, messageBody: message };
    });
    return allMessages
  } catch (e) {
    console.error("~~~srGetMessagesForAllTemplates", e)
    throw new Error("Error in getting/compiling template messages")
  }
}