import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import upload from "../middleware/multer.middleware.js";
import { createEventController,publishEvent, getPublishedEvents } from "../controllers/event.controller.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("MAIN_ADMIN", "ORGANIZER"),
  upload.single("poster"),
  createEventController
);

router.patch(
  "/:id/publish",
  authMiddleware,
  roleMiddleware("MAIN_ADMIN", "ORGANIZER"),
  publishEvent
);

router.get("/", getPublishedEvents);

export default router;