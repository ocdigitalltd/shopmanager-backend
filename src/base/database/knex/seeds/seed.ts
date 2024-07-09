import Knex, { QueryBuilder, Transaction } from "knex";
import doUser from "../../../../modules/user/doUser";
import doWarehouseSetup from "../../../../modules/warehouseSetup/doWarehouseSetup";
import doParsingConditions from "../../../../modules/parsingConditions/doParsingConditions";
import doCronSettings from "../../../../modules/cronSettings/doCronSettings";
import { MESSAGE_USER_CREDENTIALS_UPDATED, MESSAGE_USER_LOGIN_CREDENTIALS, MESSAGE_WAREHOUSE_LANDING_FLOW, MESSAGE_WAREHOUSE_NON_LANDING_FLOW } from "../../../../data/dtMessages";
import doMessage from "../../../../modules/message/doMessage";

export const SHOPIFY_SETTING_ID = '717de5a2-dde2-4321-8cac-f66c13b14789'
// *********************** // to insert messages seed

// import {
//   MESSAGE_1_NON_VALID_ADDRESS,
//   MESSAGE_1_VALID_ADDRESS,
//   MESSAGE_2_NON_VALID_ADDRESS,
//   MESSAGE_2_VALID_ADDRESS,
//   MESSAGE_3_NON_VALID_ADDRESS,
//   MESSAGE_3_VALID_ADDRESS,
// } from "../../../../data/dtMessages";

const srInsertMessages = async (trx: Transaction): Promise<QueryBuilder> => {
  await doMessage.insertMany(trx, [
    // {
    //   key: "MESSAGE_1_NON_VALID_ADDRESS",
    //   value: MESSAGE_1_NON_VALID_ADDRESS,
    // },
    // {
    //   key: "MESSAGE_2_NON_VALID_ADDRESS",
    //   value: MESSAGE_2_NON_VALID_ADDRESS,
    // },
    // {
    //   key: "MESSAGE_3_NON_VALID_ADDRESS",
    //   value: MESSAGE_3_NON_VALID_ADDRESS,
    // },
    // { key: "MESSAGE_1_VALID_ADDRESS", value: MESSAGE_1_VALID_ADDRESS },
    // { key: "MESSAGE_2_VALID_ADDRESS", value: MESSAGE_2_VALID_ADDRESS },
    // { key: "MESSAGE_3_VALID_ADDRESS", value: MESSAGE_3_VALID_ADDRESS },
    { key: "MESSAGE_USER_CREDENTIALS_CREATED", value: MESSAGE_USER_LOGIN_CREDENTIALS, scope: "user-login" },
    { key: "MESSAGE_USER_CREDENTIALS_UPDATED", value: MESSAGE_USER_CREDENTIALS_UPDATED, scope: "user-login" },
    { key: "MESSAGE_WAREHOUSE_NON_LANDING_FLOW", value: MESSAGE_WAREHOUSE_NON_LANDING_FLOW, scope: "relink" },
    { key: "MESSAGE_WAREHOUSE_LANDING_FLOW", value: MESSAGE_WAREHOUSE_LANDING_FLOW, scope: "relink" },
  ]);
};

// *********************** //

const srInsertAdminUser = async (trx: Transaction): Promise<QueryBuilder> => {
  await doUser.upsertOne(trx, {
    email: "admin@admin.com",
    password: "admin123",
    role: "admin",
  }, ["email"]);
};

const srInsertCronSettings = async (trx: Transaction): Promise<QueryBuilder> => {
  // await doCronSettings.upsertOne(trx, {
  //   processType: "shopify",
  //   scheduleIntervalInMins: 60,
  //   startCron: false,
  //   delayAfterMessageFetchInMins: 30,
  // }, ["processType"]);
  // await doCronSettings.upsertOne(trx, {
  //   processType: "relink",
  //   scheduleIntervalInMins: 60,
  //   startCron: false,
  //   delayAfterMessageFetchInMins: 0,
  // }, ["processType"])
  await doCronSettings.upsertOne(trx, {
    processType: "domain-creation",
    scheduleIntervalInMins: 0,
    startCron: true,
    isRunning: true,
    delayAfterMessageFetchInMins: 0,
    useGoogleSheets: true
  }, ["processType"])
};

const srInsertParsingSetup = async (trx: Transaction) => {
  const [italianWh] = await doWarehouseSetup.insertOne(trx, {
    name: "Italian Warehouse",
    email: "italy-wh@gmail.com",
    parsingName: "Italian Parsing flow",
    useLandingFlow: true
  })
  if (italianWh && italianWh.id) {
    await doParsingConditions.insertMany(trx, [
      { condType: "address", condValue: "Italy", warehouseId: italianWh.id },
      { condType: "address", condValue: "Italia", warehouseId: italianWh.id },
      { condType: "mail-subject", condValue: "[Relink]", warehouseId: italianWh.id },
      { condType: "mail-subject", condValue: "New order", warehouseId: italianWh.id },
    ])
  }
  const [germanWh] = await doWarehouseSetup.insertOne(trx, {
    name: "German Warehouse",
    email: "german-wh@gmail.com",
    parsingName: "Germany Parsing flow",
    useLandingFlow: false,
    isDefault: true
  })
  if (germanWh && germanWh.id) {
    await doParsingConditions.insertMany(trx, [
      { condType: "mail-subject", condValue: "[Relink]", warehouseId: germanWh.id },
      { condType: "mail-subject", condValue: "New order", warehouseId: germanWh.id },
    ])
  }
  const [shopify] = await doWarehouseSetup.insertOne(trx, {
    id: SHOPIFY_SETTING_ID,
    name: "Shopify Golden",
    email: "NA",
    parsingName: "Shopify Parsing",
    useLandingFlow: false
  })
  if (shopify && shopify.id) {
    await doParsingConditions.insertMany(trx, [
      { condType: "mail-subject", condValue: "[Golden®]", warehouseId: shopify.id },
      { condType: "mail-subject", condValue: "[Golden(R)]", warehouseId: shopify.id },
    ])
  }
}

export const seed = async function seed(knex: Knex): Promise<QueryBuilder> {
  await knex.transaction(async (trx: Transaction) => {
    await srInsertMessages(trx); // to insert messages seed
    await srInsertAdminUser(trx);
    // await srInsertParsingSetup(trx);
    await srInsertCronSettings(trx);
  });
};
