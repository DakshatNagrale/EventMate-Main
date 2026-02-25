import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  initiateRegistration,
  verifyMember
} from "../controllers/registration.controller.js";

const router = express.Router();

router.post(
  "/:eventId/initiate",
  authMiddleware,
  initiateRegistration
);

router.get("/verify/:token", verifyMember);

export default router;
