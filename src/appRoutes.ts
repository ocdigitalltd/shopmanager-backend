import express from "express";
import messageRouter from "./modules/message/routes/rtMessage";
import userRouter from "./modules/user/routes/rtUser";
import relinkEmailRouter from "./modules/relinkOrders/routes/relinkEmailRouter";
import shopifyEmailRouter from "./modules/orderMail/routes/shopifyEmailRouter";
import { updateRelinkCardRedirection, updateRelinkRedirectionByLanding2 } from "./modules/relinkOrders/ctRelinkOrders";
import customerRouter from "./modules/customers/rtCustomer";
import parsingSettingsRouter from "./modules/warehouseSetup/rtWarehouseSetup";
import { getAllMisprintedDomainsInfo, getMisPrintedDomainInfo, updateMisprintedRedirectionByLanding2 } from "./modules/misprintedCards/srMisprintedCards";

const appRouter = express.Router();

appRouter.get("/test", (_req, res) => res.json("App is working!!!"));
appRouter.use("/shopify-email", shopifyEmailRouter);
appRouter.use("/relink-email", relinkEmailRouter);
appRouter.post("/relink/redirectDomain", updateRelinkCardRedirection)
appRouter.post("/relink/redirectDomain/landing2", updateRelinkRedirectionByLanding2)
appRouter.post("/relink/misprintRedirect/landing2", updateMisprintedRedirectionByLanding2)
appRouter.use("/message", messageRouter);
appRouter.use("/user", userRouter);
appRouter.use("/customer", customerRouter)
appRouter.use("/parsingSettings", parsingSettingsRouter)
appRouter.get("/misprinted-domain/:domain", getMisPrintedDomainInfo)
appRouter.get("/misprinted/all", getAllMisprintedDomainsInfo)

export default appRouter;
