// routes/appRoutes.ts
import express from "express";
import { addConditionForWarehouse, addNewWarehouse, deleteParsingCondition, deleteWarehouseSetup, getAllWarehouses, getConditionsByWarehouse, updateWarehouseSetup } from "./ctWarehouseSetup";
import { ctGetCronSettings, ctUpdateCronSettingsById } from "../cronSettings/ctCronSettings";

const parsingSettingsRouter = express.Router();

// Define routes

parsingSettingsRouter.get("/warehouses", getAllWarehouses)
parsingSettingsRouter.post("/warehouses/add", addNewWarehouse)
parsingSettingsRouter.put("/warehouses/:id", updateWarehouseSetup)
parsingSettingsRouter.delete("/warehouses/:id", deleteWarehouseSetup)
parsingSettingsRouter.post("/conditions/add", addConditionForWarehouse)
parsingSettingsRouter.get("/conditions/:id", getConditionsByWarehouse)
parsingSettingsRouter.delete("/conditions/:id", deleteParsingCondition)
parsingSettingsRouter.get("/cron", ctGetCronSettings)
parsingSettingsRouter.put("/cron/:id", ctUpdateCronSettingsById)

export default parsingSettingsRouter;
