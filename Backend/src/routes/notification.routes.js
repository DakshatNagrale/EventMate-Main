import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getMyNotifications,
  markAllRead,
  markOneRead
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/my", authMiddleware, getMyNotifications);
router.patch("/read-all", authMiddleware, markAllRead);
router.patch("/:notificationId/read", authMiddleware, markOneRead);

export default router;