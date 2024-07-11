import CfgDevelopmentEnv from "./developmentEnv";
abstract class prodEnv extends CfgDevelopmentEnv {
  static host = "node186817-email-parsing.de-fra1.cloudjiffy.net";
  static port = "4000";
  static fullUrl = "https://email-parsing.de-fra1.cloudjiffy.net/";
  static allowedOrigins = [
    "http://shop-manager.schedy.app/",
    "https://shop-manager.schedy.app/",
    "https://shop-manager.schedy.app",
    "https://shopmanager.in1.cloudjiffy.net/",
    "https://shopmanager.in1.cloudjiffy.net"
  ];

  static MAP_API_TOKEN = "651d156bca96aa7a167c5b3a";
  static SMS_BEARER_TOKEN = "6516c046af9f7943bd2f8b18"
  static SMS_SENDER_NUMBER = "123"
  static WHATSAPP_SENDING_API_KEY = "b8c33fa94f63f40cd0a5b839fe0278d8";
  static WHATSAPP_SENDING_NUMBER = "390859943500";
  static TEST_RECEIVER_NUMBER = "393389277001";

  static WHATSAPP_CHECKING_API_KEY = "API-X-809817721977385403946866809-P-API";
  static CRON_TIME_CHECK_WHATSAPP_SERVICE_IN_MIN = 120;
  // static CRON_TIME_IN_MIN_ORDER = 60;  // 1 min
  // static CRON_TIME_IN_MIN_MESSAGE = 120;  // 2 hours
  // static START_MSG_FETCH_CRON = false;
  // static START_MSG_SEND_CRON = false;

  // // Relink emails
  // static CRON_RELINK_SHOP_ORDER_PROCESSING = 60;  // 1 hours
  // static START_RELINK_SHOP_ORDER_PROCESSING = false;
  // static DELAY_AFTER_REC_CREATION_IN_MINUTES = 10;

  static email_sending = {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
    SMTP_USER: 'ocdigitalltd@gmail.com',
    SMTP_PASS: 'cgwpjdxpldaydbcx',
    SMTP_FROM_TITLE: 'Relink'
  }
  static ITALIAN_WAREHOUSE_EMAIL_ADDRESS = "texrwork365@gmail.com";
  static NON_ITALIAN_WAREHOUSE_EMAIL_ADDRESS = "localdev899@gmail.com";
  static ADMIN_EMAIL_ADDRESS = "p.sokol19@gmail.com";

  static knex = {
    client: "pg",
    connection: {
      host: "node196112-db-cluster-pgre-1.de-fra1.cloudjiffy.net",
      user: "webadmin",
      password: "k9YZChhLj0",
      database: "shopmanager",
      charset: "utf8",
    },
    migrations: {
      directory: "src/base/database/knex/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "src/base/database/knex/seeds",
      extension: "ts",
    },
  };

  static ovh: {
    OVH_API_ENDPOINT: 'ovh-eu',
    OVH_APP_KEY: '91d8b33d1b783f2b',
    OVH_APP_SECRET: '779ed6230a7fff26c52cec799fab5465',
    OVH_CONSUMER_KEY: '265c881a8afcd6154afe51cc94787d75',
    OVH_DOMAIN: 'ocdbiz.cloud'
  }

  static landingPage1Url = "https://shop-manager.schedy.app/home1"
  static landingPage2Url = "https://shop-manager.schedy.app/home2"
}

export default prodEnv;
