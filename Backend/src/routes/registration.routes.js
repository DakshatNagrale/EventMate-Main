import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createDraft,
  verifyMember
} from "../controllers/registration.controller.js";

const router = express.Router();

router.post(
  "/:eventId/draft",
  authMiddleware,
  createDraft
);

router.post("/verify/:token", verifyMember);

export default router;