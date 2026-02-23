import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import { getAllUsersController, updateUserController, deleteUserController } from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("MAIN_ADMIN"));

router.get("/users", getAllUsersController);
router.put("/users/:id", updateUserController);
router.delete("/users/:id", deleteUserController);

export default router;
