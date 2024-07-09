// routes/appRoutes.ts
import express from "express";
import {  triggerEmailProcessing, triggerMessageSendingProcessing } from "../controllers/emailController";
import { deleteOrderByOrderNumber, getAllOrders, sendTestMessageForOrder, sendTestMessageForOrderByMsgId, updateStatusForOrders } from "../ctMailOrders";

const shopifyEmailRouter = express.Router();

// Define routes
shopifyEmailRouter.get("/triggerEmailProcessing", triggerEmailProcessing);
shopifyEmailRouter.get("/triggerMessageSendingProcessing", triggerMessageSendingProcessing)
shopifyEmailRouter.get("/getAllOrders?:status", getAllOrders)
shopifyEmailRouter.delete("/deleteOrderByOrderNumber", deleteOrderByOrderNumber)
shopifyEmailRouter.post("/sendTestMessageForOrder", sendTestMessageForOrder);
shopifyEmailRouter.post("/testSendMessage", sendTestMessageForOrderByMsgId);
shopifyEmailRouter.post("/updateStatus", updateStatusForOrders);

export default shopifyEmailRouter;
