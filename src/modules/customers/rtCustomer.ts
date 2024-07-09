import express from "express";
import { addNewCustomer, addOtherDomainForCustomer, deleteCustomerById, deleteCustomerProductById, getAllCustomers, getCustomerProductsById, updateCustomer } from "./ctCustomer";

const customerRouter = express.Router();

// Define routes
customerRouter.get("/all", getAllCustomers);
customerRouter.post("/add", addNewCustomer);
customerRouter.delete("/:id", deleteCustomerById)
customerRouter.put("/update", updateCustomer)
customerRouter.get("/products/:id", getCustomerProductsById)
customerRouter.post("/products/add", addOtherDomainForCustomer)
customerRouter.delete("/products/:id", deleteCustomerProductById)

export default customerRouter;
