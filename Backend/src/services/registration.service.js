import Event from "../models/Event.model.js";
import EventRegistration from "../models/EventRegistration.model.js";
import crypto from "crypto";
import MemberVerification from "../models/MemberVerification.model.js";
import sendEmail from "../config/sendEmail.js";

export const createDraft = async (eventId, userId, payload) => {

  const { teamName, teamLeader, teamMembers = [] } = payload;

  /* 1️⃣ Check Event Exists */
  const event = await Event.findById(eventId);
  if (!event)
    throw new Error("Event not found");

  /* 2️⃣ Event Must Be Published */
  if (event.status !== "Published")
    throw new Error("Event not open for registration");

  /* 3️⃣ Registration Must Be Open */
  if (!event.registration?.isOpen)
    throw new Error("Registration closed");

  /* 4️⃣ Deadline Check */
  if (
    event.registration?.lastDate &&
    new Date() > new Date(event.registration.lastDate)
  )
    throw new Error("Registration deadline passed");

  /* 5️⃣ Capacity Check (ONLY count Submitted) */
  const submittedRegs = await EventRegistration.find({
    event: eventId,
    status: "Submitted"
  });

  const totalParticipants = submittedRegs.reduce(
    (sum, reg) => sum + reg.totalParticipants,
    0
  );

  if (totalParticipants >= event.registration.maxParticipants)
    throw new Error("Event is full");

  /* 6️⃣ Prevent Duplicate (Updated Status Check) */
  const existing = await EventRegistration.findOne({
    event: eventId,
    registeredBy: userId,
    status: { $in: ["Draft", "Submitted"] }
  });

  if (existing)
    throw new Error("You already started registration for this event");

  /* 7️⃣ Respect Event Type During Draft */

  let finalTeamName = teamName;

  if (!event.isTeamEvent) {
    // Individual event
    finalTeamName = null;
  }
  
  /* 8️⃣ Create Draft */

  const draft = await EventRegistration.create({
    event: eventId,
    teamName: finalTeamName,
    teamLeader,
    teamMembers,
    registeredBy: userId,
    status: "PendingVerification"
  });

for (const member of draft.teamMembers) {

  const token = crypto.randomBytes(32).toString("hex");

  await MemberVerification.create({
    registration: draft._id,
    email: member.email,
    token,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
  });

  const verifyLink = `${process.env.FRONTEND_URL}/verify-registration?token=${token}`;

  await sendEmail(
  member.email,
  "Verify Your Event Registration",
  `
    <h2>Event Registration Verification</h2>
    <p>Please verify your participation:</p>
    <a href="${verifyLink}">Verify Now</a>
  `
);
}

  return draft;
};


export const verifyMember = async (token) => {

  const verification = await MemberVerification.findOne({ token });

  if (!verification)
    throw new Error("Invalid verification token");

  if (verification.expiresAt < Date.now())
    throw new Error("Verification token expired");

  if (verification.verified)
    throw new Error("Member already verified");

  // Mark token verified
  verification.verified = true;
  await verification.save();

  // Find registration
  const registration = await EventRegistration.findById(verification.registration);

  if (!registration)
    throw new Error("Registration not found");

  // Mark correct team member verified
  const member = registration.teamMembers.find(
    m => m.email === verification.email
  );

  if (!member)
    throw new Error("Member not found in registration");

  member.emailVerified = true;

  await registration.save();

  // Check if all members verified
  const allVerified = registration.teamMembers.every(
    m => m.emailVerified === true
  );

  if (allVerified) {
    registration.status = "Confirmed";
    registration.allMembersVerified = true;
    await registration.save();
  }

  return { message: "Email verified successfully" };
};