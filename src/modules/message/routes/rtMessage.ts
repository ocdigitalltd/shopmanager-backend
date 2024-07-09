// routes/appRoutes.ts
import express from "express";
import {
  ctGetAllMessageKeys,
  ctGetAllMessageTemplates,
  ctGetAllMessages,
  ctGetMessageByKey,
  ctUpdateMessage,
} from "../controllers/ctMessage";

const messageRouter = express.Router();

// Define routes
messageRouter.get("/getAllMessageKeys", ctGetAllMessageKeys);
messageRouter.get("/getAllMessages", ctGetAllMessages);
messageRouter.get("/getMessageByKey/:key", ctGetMessageByKey);
messageRouter.put("/updateMessage/:key", ctUpdateMessage);
messageRouter.get("/templates", ctGetAllMessageTemplates);

export default messageRouter;
