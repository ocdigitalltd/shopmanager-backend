// routes/appRoutes.ts
import express from "express";
import { addNewSku, createBulkDomains, deleteRelinkDomainById, deleteSku, getAllBulkDomains, getAllRelinkOrders, getAllSkus, updateDomainsLandingType } from "../ctRelinkOrders";

const relinkEmailRouter = express.Router();

// Define routes
relinkEmailRouter.get("/getAllOrders?:status", getAllRelinkOrders)
relinkEmailRouter.get("/getrandomdomains", getAllBulkDomains);
relinkEmailRouter.post("/bulk-domains", createBulkDomains);
relinkEmailRouter.post("/sku", addNewSku);
relinkEmailRouter.get("/sku", getAllSkus);
relinkEmailRouter.delete("/sku/:id", deleteSku);
relinkEmailRouter.delete("/domains/:id", deleteRelinkDomainById);
relinkEmailRouter.post("/domains/update", updateDomainsLandingType);

export default relinkEmailRouter;
