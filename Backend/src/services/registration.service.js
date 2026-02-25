import crypto from "crypto";
import Event from "../models/Event.model.js";
import EventRegistration from "../models/EventRegistration.model.js";
import MemberVerification from "../models/MemberVerification.model.js";
import sendEmail from "../config/sendEmail.js";

/* ================================================
   INITIATE REGISTRATION
   - Validates event, capacity, duplicates
   - Creates registration record
   - Individual + free  → straight to Confirmed
   - Individual + paid  → PendingPayment
   - Team + free        → sends member emails → PendingMemberVerification
   - Team + paid        → sends member emails → PendingMemberVerification
                          (payment comes after all members verify)
================================================ */

export const initiateRegistration = async (eventId, userId, payload) => {
  const { teamName, teamLeader, teamMembers = [] } = payload;

  /* 1️⃣ Event exists */
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  /* 2️⃣ Must be published */
  if (event.status !== "Published")
    throw new Error("Event is not open for registration");

  /* 3️⃣ Registration window must be open */
  if (!event.registration?.isOpen)
    throw new Error("Registration is closed");

  /* 4️⃣ Deadline check */
  if (
    event.registration?.lastDate &&
    new Date() > new Date(event.registration.lastDate)
  )
    throw new Error("Registration deadline has passed");

  /* 5️⃣ Capacity check — only count active registrations */
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

  /* 6️⃣ Duplicate check — one active registration per user per event */
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

  /* 7️⃣ Determine initial status */

  const isPaid = event.registration?.fee > 0;
  const isTeam = event.isTeamEvent;

  let initialStatus;

  if (!isTeam) {
    // Individual event — no members to verify
    initialStatus = isPaid ? "PendingPayment" : "Confirmed";
  } else {
    // Team event — members need to verify first, payment comes after
    initialStatus = "PendingMemberVerification";
  }

  /* 8️⃣ Create registration */
  const registration = await EventRegistration.create({
    event: eventId,
    teamName: isTeam ? teamName : null,
    teamLeader,
    teamMembers: isTeam ? teamMembers : [],
    registeredBy: userId,
    status: initialStatus,
    // Individual with no members = already "verified"
    allMembersVerified: !isTeam
  });

  /* 9️⃣ Send verification emails to team members */
  if (isTeam && teamMembers.length > 0) {
    await sendMemberVerificationEmails(registration, teamMembers);
  }

  return registration;
};

/* ================================================
   VERIFY MEMBER EMAIL
   Called when a team member clicks the link in their email
================================================ */

export const verifyMember = async (token) => {
  const verification = await MemberVerification.findOne({ token });

  if (!verification)
    throw new Error("Invalid verification link");

  if (verification.expiresAt < new Date())
    throw new Error("Verification link has expired");

  if (verification.verified)
    throw new Error("This email has already been verified");

  // Mark token as used
  verification.verified = true;
  await verification.save();

  const registration = await EventRegistration.findById(
    verification.registration
  );

  if (!registration)
    throw new Error("Registration not found");

  if (registration.status === "Cancelled" || registration.status === "Rejected")
    throw new Error("This registration is no longer active");

  // Find and mark the team member as verified
  const member = registration.teamMembers.find(
    (m) => m.email === verification.email
  );

  if (!member)
    throw new Error("Member not found in this registration");

  member.emailVerified = true;

  // Check if ALL members are now verified
  const allVerified = registration.teamMembers.every(
    (m) => m.emailVerified === true
  );

  if (allVerified) {
    registration.allMembersVerified = true;

    const event = await Event.findById(registration.event);
    const isPaid = event?.registration?.fee > 0;

    // Move to the right next status
    registration.status = isPaid ? "PendingPayment" : "Confirmed";
  }

  await registration.save();

  return {
    message: allVerified
      ? "Email verified! All members verified successfully."
      : "Email verified successfully. Waiting for other members to verify."
  };
};

/* ================================================
   HELPER — Send verification emails to team members
================================================ */

const sendMemberVerificationEmails = async (registration, teamMembers) => {
  for (const member of teamMembers) {
    const token = crypto.randomBytes(32).toString("hex");

    await MemberVerification.create({
      registration: registration._id,
      email: member.email,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours
    });

    const verifyLink = `${process.env.FRONTEND_URL}/verify-registration?token=${token}`;

    await sendEmail(
      member.email,
      "Verify Your Event Registration — EventMate",
      `
        <h2>Hi ${member.name},</h2>
        <p>You've been added as a team member for an event on EventMate.</p>
        <p>Please verify your participation by clicking the link below:</p>
        <a href="${verifyLink}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          margin-top: 12px;
        ">Verify My Participation</a>
        <p style="margin-top: 16px; color: #6b7280; font-size: 14px;">
          This link expires in 24 hours.
        </p>
      `
    );
  }
};