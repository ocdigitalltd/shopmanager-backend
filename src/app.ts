import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import AppRouter from "./appRoutes";
import { Env } from "./base/loaders/appLoader";
import knex from "./base/database/cfgKnex";
import { fixExistingDomainsLandingUrls, initializeDomainsInfoInMemory } from "./modules/misprintedCards/srMisprintedCards";

const expressApp = express();

expressApp.use(bodyParser.json({ limit: "50mb" }));

expressApp.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || "";
  if (Env.allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers",
      "Content-Type, Authorization, Origin, X-Requested-With,Accept, x-api-version, x-csrf-token, cache-control, pragma");
    res.header("Access-Control-Allow-Credentials", "true");
    return next();
  }
  return res.status(400)
    .json("{Either login, or use API key}")
    .end();
});



// connect ovh
try {
  const ovh = require('ovh')({
    appKey: Env.ovh.OVH_APP_KEY,
    appSecret: Env.ovh.OVH_APP_SECRET,
    consumerKey: Env.ovh.OVH_CONSUMER_KEY
  });

  ovh.request('GET', '/me', function (err, me) {
    console.log(err || 'Welcome ' + me.firstname);
  });
} catch (e) {
  console.log('error in ovh authentication', e)
}


expressApp.use("/api", AppRouter);
console.log(`app is running in: ${process.env.NODE_ENV}`);
expressApp.listen(Env.port, () => {
  console.log(`app is ready on port: ${Env.port}`);
});

knex
  .raw("select 1+1 as result")
  .then(() => {
    console.log("Postgres Database Connected");
    expressApp.emit("ready");
  })
  .catch(console.error);

const connectionPromise = knex.transaction(async (trx) => {
  try {
    await trx.raw("select 1+1 as result");
    console.log(`Postgres ${knex.client.config.connection.database} Database Connected`);
    await trx.commit();
    await initializeDomainsInfoInMemory();
  } catch (error) {
    await trx.rollback();
    console.error(`Database connection error for ${knex.client.config.connection.database}:`, error);
  }
});

connectionPromise
  .then(() => {
    expressApp.emit("ready");
    fixExistingDomainsLandingUrls().then(() => {
      console.log("done fixing")
    })
  })
  .catch((error) => {
    console.error("Error checking database connection:", error);
  });


export default expressApp;
