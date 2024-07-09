import { Request, Response } from "express";
import doMessage from "../doMessage";
import knex from "../../../base/database/cfgKnex";
import MdMessage from "../mdMessage";

export const ctGetAllMessageKeys = async (req: Request, res: Response) => {
  try {
    knex.transaction(async (trx) => {
      const message = await doMessage.getAll(trx);
      const messageKeys = message.map((m) => m.key);
      res.status(200).json({ messageKeys });
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const ctGetAllMessages = async (req: Request, res: Response) => {
  try {
    knex.transaction(async (trx) => {
      const messages = await doMessage.getAll(trx);
      res.status(200).json({ messages });
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const ctGetMessageByKey = async (req: Request, res: Response) => {
  try {
    knex.transaction(async (trx) => {
      const { key } = req.params;
      const message = await doMessage.findOneByPredicate(trx, { key });
      res.status(200).json({ message });
    });
  }
  catch (error) {
    res.status(500).json({ error });
  }

}

export const ctUpdateMessage = async (req: Request, res: Response) => {
  try {
    knex.transaction(async (trx) => {
      const { key } = req.params;
      const { value } = req.body;
      await doMessage.updateOneByPredicate(trx, { value }, { key });
      res.status(200).json({ message: "Update message successfully" });
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const ctGetAllMessageTemplates = async (req: Request, res: Response) => {
  try {
    await knex.transaction(async (trx) => {
      const allmessages = await doMessage.getAll(trx);
      let data = [];
      const invalidAddress = allmessages.filter(msg => msg.key.includes("NON_VALID")).map((msg) => ({
        message: msg.value, title: msg.key, id: msg.id
      }))
      const validAddress = allmessages.filter(msg => !msg.key.includes("NON_VALID") && msg.scope === "shopify").map((msg) => ({
        message: msg.value, title: msg.key, id: msg.id
      }))
      const relinkTmpl: MdMessage[] = allmessages.filter(msg => msg.scope === "relink").map((msg) => ({
        message: msg.value, title: msg.key, id: msg.id
      }))
      const login: MdMessage[] = allmessages.filter(msg => msg.scope === "user-login").map((msg) => ({
        message: msg.value, title: msg.key, id: msg.id
      }))

      data.push(
        { scope: "Login", category: "User Credentials", messages: login },
        { scope: "Relink", category: "Warehouses", messages: relinkTmpl },
        { scope: "Shopify", category: "Valid Address", messages: validAddress },
        { scope: "Shopify", category: "Invalid Address", messages: invalidAddress },
      )
      res.status(200).json({ data });
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};