import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import {
  initiateRegistration,
  verifyMember,
  getMyRegistrations,
  getEventRegistrations,
  markAttendanceManual,
  markAttendance,
  tagWinner
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

// Organizer/Coordinator scans QR
router.patch(
  "/attendance/:token",
  authMiddleware,
  roleMiddleware("ORGANIZER", "STUDENT_COORDINATOR"),
  markAttendance
);

// Admin marks attendance manually
router.patch(
  "/:registrationId/attendance/manual",
  authMiddleware,
  roleMiddleware("MAIN_ADMIN"),
  markAttendanceManual
);

// Tag winner — organizer or admin only
router.patch(
  "/:registrationId/winner",
  authMiddleware,
  roleMiddleware("MAIN_ADMIN", "ORGANIZER"),
  tagWinner
);

export default router;