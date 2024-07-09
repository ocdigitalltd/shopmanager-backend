// routes/appRoutes.ts
import express from "express";
import { ctGetUserDataById, ctLogin, ctUpdateUserDataById, getAllUserProductsById } from "../controllers/ctUser";

const userRouter = express.Router();

// Define routes
userRouter.post("/login", ctLogin);
userRouter.get("/:id", ctGetUserDataById)
userRouter.put("/:id", ctUpdateUserDataById)
userRouter.get("/products/:id", getAllUserProductsById)

export default userRouter;
