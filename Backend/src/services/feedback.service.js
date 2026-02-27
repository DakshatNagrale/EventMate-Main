import Event from "../models/Event.model.js";
import EventRegistration from "../models/EventRegistration.model.js";
import ParticipantQR from "../models/ParticipantQR.model.js";
import Feedback from "../models/Feedback.model.js";
import { generateCertificatesForRegistration } from "./certificate.service.js";

/* ================================================
   SUBMIT FEEDBACK
================================================ */

export const submitFeedback = async (eventId, userId, payload) => {
  const { rating, comment } = payload;

  // Rating is mandatory
  if (!rating || rating < 1 || rating > 5)
    throw new Error("Rating must be between 1 and 5");

  // Event must exist and be Completed
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  if (event.status !== "Completed")
    throw new Error("Feedback can only be submitted after event is completed");

  // Find the registration for this user
  const registration = await EventRegistration.findOne({
    event: eventId,
    registeredBy: userId,
    status: "Confirmed"
  });

  if (!registration)
    throw new Error("No confirmed registration found for this event");

  // For team events — only leader can submit feedback
  // Leader is identified as the registeredBy user
  if (event.isTeamEvent) {
    if (registration.registeredBy.toString() !== userId.toString())
      throw new Error("Only the team leader can submit feedback");
  }

  // Leader/participant must have attended
  const leaderQR = await ParticipantQR.findOne({
    registration: registration._id,
    email: registration.teamLeader.email
  });

  if (!leaderQR || !leaderQR.attendanceMarked)
    throw new Error("Only participants who attended can submit feedback");

  // Check duplicate feedback
  const existing = await Feedback.findOne({
    event: eventId,
    registration: registration._id
  });

  if (existing)
    throw new Error("Feedback already submitted for this event");

  // Save feedback
  const feedback = await Feedback.create({
  event: eventId,
  eventName: event.title,
  registration: registration._id,
  participantName: registration.teamLeader.name,
  participantEmail: registration.teamLeader.email,
  submittedBy: userId,
  rating,
  comment: comment || null
});

  // Trigger certificate generation in background — don't await
  generateCertificatesForRegistration(registration, event).catch((err) =>
    console.error("❌ Certificate generation error:", err.message)
  );

  return feedback;
};

/* ================================================
   GET FEEDBACK FOR EVENT
   Organizer views all feedback
================================================ */

export const getEventFeedback = async (eventId, requesterId) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  // Only organizer or admin
  const isAdmin = requesterId.role === "MAIN_ADMIN";
  const isOrganizer =
    event.createdBy.toString() === requesterId._id.toString();

  if (!isAdmin && !isOrganizer)
    throw new Error("Not authorized to view feedback for this event");

  const feedbacks = await Feedback.find({ event: eventId })
  .sort({ createdAt: -1 });

  // Calculate average rating
  const avgRating =
    feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length || 0;

  return {
    totalFeedbacks: feedbacks.length,
    averageRating: Math.round(avgRating * 10) / 10,
    feedbacks
  };
};