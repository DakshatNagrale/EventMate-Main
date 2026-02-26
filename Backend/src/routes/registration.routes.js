import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import {
  initiateRegistration,
  verifyMember,
  getMyRegistrations,
  getEventRegistrations
} from "../controllers/registration.controller.js";

const router = express.Router();

// Student initiates registration
router.post("/:eventId/draft", authMiddleware, initiateRegistration);

// Member verifies email via token — public
router.get("/verify/:token", verifyMember);

// Student sees their own registrations + QRs
router.get("/my", authMiddleware, getMyRegistrations);

// Organizer sees all registrations for their event
router.get(
  "/:eventId/all",
  authMiddleware,
  roleMiddleware("MAIN_ADMIN", "ORGANIZER"),
  getEventRegistrations
);

export default router;