// controllers/emailController.ts
import { scrapeShopifyEmailHtml } from "../../../utils/shopifyEmailHtml";
import { gmailApi } from "../../gmail";
import cron from "node-cron"; // Import the node-cron library
import {
  srMarkOrderAsPending,
  srMarkOrderStatus,
  srProcessOrder,
  srGetMessageForUnProcessOrder,
} from "../srMailOrders";
import { tpOrder } from "../tpMailOrders";
import {
  srMessagingForNonValidAddress,
  srMessagingForValidAddress,
} from "../../../utils/messaging";
import { formatDate as srFormatDate } from "../../../utils/date";
// A function to process emails and send a response
import { scrapeRelinkEmailHtml } from "../../../utils/relinkEmailHtml";
import { srAddNewRelinkOrder, srProcessOrdersForDomainCreation, srProcessRelinkOrders } from "../../relinkOrders/srRelinkOrders";
import { WarehouseSetting, srGetAllWarehousesData } from "../../warehouseSetup/srWarehouseSetup";
import { srGetCronSettingsByName } from "../../cronSettings/ctCronSettings";
import AppConfigs from "../../../base/configs/appConfigs";
import { stdLog } from "../../../utils/logger";
import { fetchRelinkOrdersDataFromSheets, writeToGoogleSheets } from "../../gmail/sheetsApi";
import MdCronSettings from "../../cronSettings/mdCronSettings";
import { Env } from "../../../base/loaders/appLoader";
import { isWhatsAppServiceActive } from "../../../utils/whatspp";
import { getTransport, sendEmail } from "../../shared/srEmailSender";

export const processShopifyEmails = async () => {
  try {
    const settings = (await srGetAllWarehousesData()).filter((set) => set.channelType === "shopify")
    const subjectConds = settings[0].conditions["mail-subject"]
    const today = new Date(); // Get the current date
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 2);
    today.setDate(today.getDate() + 1);
    const dateAfter = srFormatDate(yesterday);
    const dateBefore = srFormatDate(today);
    console.log({ dateAfter, dateBefore });
    // Fetch Gmail messages using gmailApi
    const messages = await gmailApi(
      10,
      "all",
      { dateAfter, dateBefore },
      { format: "full" }
    );

    // Process each message and extract data
    if (Array.isArray(messages)) {
      for (let i = 0; i < messages.length; i++) {
        try {
          const msg = messages[i];
          console.log("subject", msg.mailSubject);
          const findShop = settings.filter((wh) =>
            (wh.conditions["mail-subject"].every((sub) => msg.mailSubject.includes(sub)))
          )
          if (
            findShop && findShop.length > 0
            // subjectConds.every((sub: string) => msg.mailSubject.includes(sub))
            // msg.mailSubject.includes("[Golden®]") ||
            // msg.mailSubject.includes("[Golden(R)]")
          ) {
            const data = await scrapeShopifyEmailHtml(msg.msgFullHtml);
            await srProcessOrder({
              gmailMsgId: msg.gmailMsgId,
              mailSubject: msg.mailSubject,
              shopId: findShop[0].id,
              ...data,
            });
          }
        } catch (error) {
          console.error("Error processing messages:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error processing messages:", error);
  }
};

export const fetchRelinkEmailsAndAddToDb = async (warehouses: WarehouseSetting[]) => {
  try {
    // console.log({ warehouses })
    const today = new Date(); // Get the current date
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 2);
    today.setDate(today.getDate() + 1);
    const dateAfter = srFormatDate(yesterday);
    const dateBefore = srFormatDate(today);
    console.log({ dateAfter, dateBefore });
    // Fetch Gmail messages using gmailApi
    const messages = await gmailApi(
      10,
      "all",
      { dateAfter, dateBefore },
      { format: "full" }
    );

    // Process each message and extract data
    if (Array.isArray(messages)) {
      for (let i = 0; i < messages.length; i++) {
        try {
          const msg = messages[i];
          console.log("subject", msg.mailSubject);
          if (
            warehouses.some((wh) =>
              (wh.conditions["mail-subject"].every((sub) => msg.mailSubject.includes(sub)))
            )
            // msg.mailSubject.includes("[Relink]") &&
            // msg.mailSubject.includes("New order")
          ) {
            const data = await scrapeRelinkEmailHtml(msg.msgFullHtml, msg.gmailMsgId, warehouses);
            await srAddNewRelinkOrder(data)
          }
        } catch (error) {
          console.error("Error processing messages:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error processing messages:", error);
  }
};

const sendMessageForOrder = async (order: tpOrder) => {
  if (order.isValidAddress) {
    const isProcessed = await srMessagingForValidAddress(order);
    if (isProcessed) {
      return true;
    }
    return false;
  } else {
    const isProcessed = await srMessagingForNonValidAddress(order);
    if (isProcessed) {
      return true;
    }
    return false;
  }
};

const processMessageSending = async () => {
  try {
    const allUnProcessedOrders = await srGetMessageForUnProcessOrder();
    for (let i = 0; i < allUnProcessedOrders.length; i++) {
      const order = allUnProcessedOrders[i];
      await srMarkOrderAsPending(order.gmailMsgId);
      const isMessageSent = await sendMessageForOrder(order);
      if (isMessageSent) {
        await srMarkOrderStatus(order.gmailMsgId, "sent");
      } else {
        console.log("Message sending process failed for ", order.orderNumber);
      }
    }
    console.log("Message sending process completed");
  } catch (error) {
    console.error("Error processing messages:", error);
    // AppConfigs.isShopifyRunning = false;
  }
};

// Define a cron job to run the processShopifyEmails function every 6 hours
// cron.schedule(`*/${Env.CRON_TIME_IN_MIN_ORDER} * * * *`, () => {
//   if (Env.START_MSG_FETCH_CRON) {
//     console.log("Starting message fetch cron job")
//     processShopifyEmails();
//   }
// });

// // Define a cron job to run the triggerMessageSendingProcessing function every 7 hours
// cron.schedule(`*/${Env.CRON_TIME_IN_MIN_MESSAGE} * * * *`, () => {
//   if (Env.START_MSG_SEND_CRON) {
//     console.log("Starting message sending cron job")
//     processMessageSending();
//   }
// });

const delay = (minutes) => new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));

cron.schedule(`*/1 * * * *`, () => {
  try {
    srGetCronSettingsByName("shopify").then((settings) => {
      const { scheduleIntervalInMins, startCron, delayAfterMessageFetchInMins } = settings
      const timeDifference: number = new Date().getTime() - new Date(AppConfigs.shopifyTimeStart).getTime()
      // console.log('shopify - diff in min', timeDifference / (1000 * 60))
      if (startCron && !AppConfigs.isShopifyRunning && ((timeDifference / (1000 * 60)) >= scheduleIntervalInMins)) {
        AppConfigs.shopifyTimeStart = new Date();
        AppConfigs.isShopifyRunning = true;
        console.log("Starting message fetch cron job")
        processShopifyEmails();
        delay(delayAfterMessageFetchInMins).then(() => {
          console.log("Starting message sending cron job")
          processMessageSending().then(() => {
            AppConfigs.isShopifyRunning = false;
          });
        })
      }
    })
  } catch (e) {
    console.error("Error in shopify cron", e)
    AppConfigs.isShopifyRunning = false;
  }
});


const relinkProcess = async (settings: MdCronSettings) => {
  try {
    const { useGoogleSheets, sheetsUrl, sheetName } = settings
    const warehouses = (await srGetAllWarehousesData()).filter((set) => set.channelType !== "shopify")
    if (useGoogleSheets && sheetsUrl) {
      stdLog("~ Starting relink orders processing by google sheets", "info")
      const orders = await fetchRelinkOrdersDataFromSheets(sheetsUrl, warehouses, sheetName)
      for (let i = 0; i < orders.length; i += 1) {
        await srAddNewRelinkOrder(orders[i], true)
      }
      stdLog("1. Relink orders ~~ fetch process completed", "success")
    } else {
      stdLog("~ Starting relink email processing", "info")
      await fetchRelinkEmailsAndAddToDb(warehouses);
      stdLog("1. Relink emails ~~ fetch process completed", "success")
    }
  } catch (err) {
    console.error("Error in relink cron", err)
    AppConfigs.isRelinkRunning = false;
    throw (err)
  }
}

cron.schedule(`*/1 * * * *`, () => {
  try {
    srGetCronSettingsByName("relink").then((settings) => {
      const { scheduleIntervalInMins, startCron, delayAfterMessageFetchInMins } = settings
      const timeDifference: number = new Date().getTime() - new Date(AppConfigs.relinkTimeStart).getTime()
      // console.log('relink -diff in min', timeDifference / (1000 * 60))
      if (startCron && !AppConfigs.isRelinkRunning && ((timeDifference / (1000 * 60)) >= scheduleIntervalInMins)) {
        AppConfigs.relinkTimeStart = new Date();
        AppConfigs.isRelinkRunning = true;
        relinkProcess(settings).then(() => {
          delay(delayAfterMessageFetchInMins).then(() => {
            srProcessOrdersForDomainCreation().then(() => {
              srProcessRelinkOrders().then(() => {
                AppConfigs.isRelinkRunning = false;
              });
            })
          })
        })
      }
    })
  } catch (e) {
    console.error("Error in relink cron", e)
    AppConfigs.isRelinkRunning = false;
  }
});

// cron.schedule(`*/${Env.CRON_TIME_IN_MIN_SHEET_RELINK} * * * *`, () => {
//   try {
//     const testData = [{ id: '4', domain: 'example4.com', url: 'https://example.com' },
//     { id: '5', domain: 'example5.org', url: 'https://example.org' }]
//     writeToGoogleSheets(testData).then(() => {
//       console.log("completed writing data")
//     })
//     // fetchDataFromSheetFromLink().then((data) => {
//     //   console.log("Data fetched from sheet",
//     //     JSON.stringify(data, null, 2)
//     //   )
//     //   // save to db

//     // })
//   } catch (e) {
//     console.error("Error in sheet cron", e)
//     AppConfigs.isRelinkSheetCronRunning = false;
//   }
// });

cron.schedule(`*/${Env.CRON_TIME_CHECK_WHATSAPP_SERVICE_IN_MIN} * * * *`, () => {
  try {
    isWhatsAppServiceActive().then((resp) => {
      if (!resp) {
        stdLog("Whatsapp service needs to be reconnected", "warning")
        const nodeMailTransport = getTransport();
        sendEmail(nodeMailTransport, Env.ADMIN_EMAIL_ADDRESS,
          "WatVerify API service is offline",
          "Please reconnect whatsapp via this reset link: https://phone.watverifyapi.live/reset-connected-phone/scan?api_key=API-X-809817721977385403946866809-P-API&user_id=%2Bf1YkvBW8Xw%3D"
        ).then((resp) => {
          if (resp.status === 200) stdLog("Email sent for reconnection", "info")
        })
      }
    })
  } catch (e) {
    console.error("Error in checking whatsapp connection cron", e)
  }
});

// Export a function to manually trigger the email processing if needed
export const triggerEmailProcessing = async (req, res) => {
  await processShopifyEmails();
  res.send("Email fetch processing completed");
};

export const triggerMessageSendingProcessing = async (req, res) => {
  await processMessageSending();
  res.send("Message sending process completed");
};
