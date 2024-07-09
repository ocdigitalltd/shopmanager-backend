import { NextFunction, Request, Response } from "express";
import knex from "../../base/database/cfgKnex";
import { Transaction } from "knex";
import doCronSettings from "./doCronSettings";
import MdCronSettings from "./mdCronSettings";
import { stdLogError } from "../../utils/logger";

export const ctGetCronSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const settings = await doCronSettings.getAll(trx);
      res.send({ data: settings })
    });
  } catch (e) {
    next(e);
  }
};

export const ctUpdateCronSettingsById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    if (!id) res.status(404).send({ message: "Invalid data provided" });
    else {
      await knex.transaction(async (trx: Transaction) => {
        const settings = await doCronSettings.findOneByCol(trx, "id", id);
        if (!settings) res.status(404).send({ message: "Invalid data provided" });
        else {
          await doCronSettings.updateOneByColName(trx, req.body, "id", id)
          return res.send({ message: "Settings updated successfully" });
        }
      });
    }
  } catch (e) {
    next(e);
  }
};

export const srGetCronSettingsByName = async (name: string) => {
  let settings: MdCronSettings
  try {
    await knex.transaction(async (trx: Transaction) => {
      settings = await doCronSettings.findOneByCol(trx, "processType", name);
    });
  } catch (e) {
    stdLogError("Error in srGetCronSettingsByName")
  }
  return settings
};

export const srUpdateCronSettingsById = async (id: string, data: MdCronSettings) => {
  let settings: MdCronSettings
  try {
    await knex.transaction(async (trx: Transaction) => {
      [settings] = await doCronSettings.updateOneByColName(trx, data, "id", id);
    });
  } catch (e) {
    stdLogError("Error in srUpdateCronSettingsById")
  }
  return settings
};