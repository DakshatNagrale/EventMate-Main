import express from "express";
import { registerForEvent } from "../controllers/eventRegistration.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/:eventId/register",
  authMiddleware,
  registerForEvent
);

export default router;