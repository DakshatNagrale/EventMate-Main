import crypto from "crypto";
import Event from "../models/Event.model.js";
import EventRegistration from "../models/EventRegistration.model.js";
import MemberVerification from "../models/MemberVerification.model.js";
import ParticipantQR from "../models/ParticipantQR.model.js";
import sendEmail from "../config/sendEmail.js";
import { generateQRsForRegistration } from "./qr.service.js";

/* ================================================
   INITIATE REGISTRATION
================================================ */

export const initiateRegistration = async (eventId, userId, payload) => {
  const { teamName, teamLeader, teamMembers = [] } = payload;

  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  if (event.status !== "Published")
    throw new Error("Event is not open for registration");

  if (!event.registration?.isOpen)
    throw new Error("Registration is closed");

  if (
    event.registration?.lastDate &&
    new Date() > new Date(event.registration.lastDate)
  )
    throw new Error("Registration deadline has passed");

  const activeRegistrations = await EventRegistration.find({
    event: eventId,
    status: {
      $in: [
        "PendingMemberVerification",
        "PendingPayment",
        "PendingPaymentVerification",
        "Confirmed"
      ]
    }
  });

  const totalOccupied = activeRegistrations.reduce(
    (sum, reg) => sum + reg.totalParticipants,
    0
  );

  const incomingCount = 1 + teamMembers.length;

  if (totalOccupied + incomingCount > event.registration.maxParticipants)
    throw new Error("Event is full");

  const existing = await EventRegistration.findOne({
    event: eventId,
    registeredBy: userId,
    status: {
      $in: [
        "PendingMemberVerification",
        "PendingPayment",
        "PendingPaymentVerification",
        "Confirmed"
      ]
    }
  });

  if (existing)
    throw new Error("You already have an active registration for this event");

  const isPaid = event.registration?.fee > 0;
  const isTeam = event.isTeamEvent;

  let initialStatus;
  if (!isTeam) {
    initialStatus = isPaid ? "PendingPayment" : "Confirmed";
  } else {
    initialStatus = "PendingMemberVerification";
  }

  const registration = await EventRegistration.create({
    event: eventId,
    teamName: isTeam ? teamName : null,
    teamLeader,
    teamMembers: isTeam ? teamMembers : [],
    registeredBy: userId,
    status: initialStatus,
    allMembersVerified: !isTeam
  });

  if (!isTeam && initialStatus === "Confirmed") {
    await generateQRsForRegistration(registration, event);
  }

  if (isTeam && teamMembers.length > 0) {
    await sendMemberVerificationEmails(registration, teamMembers);
  }

  return registration;
};

/* ================================================
   VERIFY MEMBER EMAIL
================================================ */

export const verifyMember = async (token) => {
  const verification = await MemberVerification.findOne({ token });

  if (!verification) throw new Error("Invalid verification link");
  if (verification.expiresAt < new Date()) throw new Error("Verification link has expired");
  if (verification.verified) throw new Error("This email has already been verified");

  verification.verified = true;
  await verification.save();

  const registration = await EventRegistration.findById(verification.registration);

  if (!registration) throw new Error("Registration not found");

  if (registration.status === "Cancelled" || registration.status === "Rejected")
    throw new Error("This registration is no longer active");

  const member = registration.teamMembers.find(
    (m) => m.email === verification.email
  );

  if (!member) throw new Error("Member not found in this registration");

  member.emailVerified = true;

  const allVerified = registration.teamMembers.every(
    (m) => m.emailVerified === true
  );

  if (allVerified) {
    registration.allMembersVerified = true;
    const event = await Event.findById(registration.event);
    const isPaid = event?.registration?.fee > 0;
    registration.status = isPaid ? "PendingPayment" : "Confirmed";
    await registration.save();

    if (!isPaid) {
      await generateQRsForRegistration(registration, event);
    }
  } else {
    await registration.save();
  }

  return {
    message: allVerified
      ? "Email verified! Registration confirmed. Check your email for your QR code."
      : "Email verified successfully. Waiting for other members to verify."
  };
};

/* ================================================
   GET MY REGISTRATIONS
   Student sees their own registrations + QR
================================================ */

export const getMyRegistrations = async (userId) => {
  const registrations = await EventRegistration.find({
    registeredBy: userId
  })
    .populate("event", "title category schedule venue status posterUrl")
    .sort({ createdAt: -1 });

  // Attach QR for each registration
  const result = await Promise.all(
    registrations.map(async (reg) => {
      const qr = await ParticipantQR.findOne({
        registration: reg._id,
        email: reg.teamLeader.email
      }).select("qrImageUrl role attendanceMarked");

      return {
        ...reg.toObject(),
        qr: qr || null
      };
    })
  );

  return result;
};

/* ================================================
   GET ALL REGISTRATIONS FOR AN EVENT
   Organizer sees everyone registered for their event
================================================ */

export const getEventRegistrations = async (eventId, organizerId) => {
  // Verify the event exists and belongs to this organizer
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  if (
    event.organizer.organizerId.toString() !== organizerId.toString() &&
    event.createdBy.toString() !== organizerId.toString()
  )
    throw new Error("Not authorized to view these registrations");

  const registrations = await EventRegistration.find({
    event: eventId
  }).sort({ createdAt: -1 });

  // Attach QRs for all participants in each registration
  const result = await Promise.all(
    registrations.map(async (reg) => {
      const qrs = await ParticipantQR.find({
        registration: reg._id
      }).select("name email role qrImageUrl attendanceMarked attendanceMarkedAt");

      return {
        ...reg.toObject(),
        participants: qrs
      };
    })
  );

  return result;
};

/* ================================================
   HELPER — Send verification emails
================================================ */

const sendMemberVerificationEmails = async (registration, teamMembers) => {
  for (const member of teamMembers) {
    const token = crypto.randomBytes(32).toString("hex");

    await MemberVerification.create({
      registration: registration._id,
      email: member.email,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    });

    const verifyLink = `${process.env.FRONTEND_URL}/verify-registration?token=${token}`;

    await sendEmail(
      member.email,
      "Verify Your Event Registration — EventMate",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #4f46e5;">Hi ${member.name},</h2>
          <p>You've been added as a team member for an event on EventMate.</p>
          <p>Please verify your participation by clicking the button below:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyLink}" style="
              display: inline-block;
              padding: 14px 32px;
              background-color: #4f46e5;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 15px;
            ">Verify My Participation</a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">
            This link expires in 24 hours. Once all team members verify,
            you'll receive a confirmation email with your unique QR code.
          </p>
        </div>
      `
    );
  }
};

/* ================================================
   MARK ATTENDANCE VIA QR TOKEN
   Called when organizer/coordinator scans QR
================================================ */

export const markAttendance = async (token, scannedBy) => {

  // Find QR record
  const qr = await ParticipantQR.findOne({ token });
  if (!qr) throw new Error("Invalid QR code");

  // Already attended check
  if (qr.attendanceMarked)
    throw new Error(`Attendance already marked for ${qr.name}`);

  // Find the event
  const event = await Event.findById(qr.eventId);
  if (!event) throw new Error("Event not found");

// Event must be happening today
const today = new Date();
const eventStart = new Date(event.schedule.startDate);
const eventEnd = new Date(event.schedule.endDate);

// Strip time — compare dates only
today.setHours(0, 0, 0, 0);
eventStart.setHours(0, 0, 0, 0);
eventEnd.setHours(0, 0, 0, 0);

if (today < eventStart || today > eventEnd)
  throw new Error("Attendance can only be marked on the event day");

  // Authorization check
  // Must be the organizer OR an assigned coordinator of THIS event
  const isOrganizer =
    event.createdBy.toString() === scannedBy._id.toString();

  const isAssignedCoordinator = event.studentCoordinators.some(
    (c) => c.coordinatorId.toString() === scannedBy._id.toString()
  );

  if (!isOrganizer && !isAssignedCoordinator)
    throw new Error("Not authorized to mark attendance for this event");

  // Mark attendance
  qr.attendanceMarked = true;
  qr.attendanceMarkedAt = new Date();
  qr.attendanceMarkedBy = scannedBy._id;
  await qr.save();

  return {
    participantName: qr.name,
    email: qr.email,
    role: qr.role,
    eventName: event.title,
    markedAt: qr.attendanceMarkedAt
  };
};

/* ================================================
   MARK ATTENDANCE MANUALLY — ADMIN ONLY
   Admin marks directly from participant list
================================================ */

export const markAttendanceManual = async (registrationId, email, adminId) => {

  const qr = await ParticipantQR.findOne({
    registration: registrationId,
    email
  });

  if (!qr) throw new Error("Participant not found");

  if (qr.attendanceMarked)
    throw new Error(`Attendance already marked for ${qr.name}`);

  qr.attendanceMarked = true;
  qr.attendanceMarkedAt = new Date();
  qr.attendanceMarkedBy = adminId;
  await qr.save();

  return {
    participantName: qr.name,
    email: qr.email,
    role: qr.role,
    markedAt: qr.attendanceMarkedAt
  };
};