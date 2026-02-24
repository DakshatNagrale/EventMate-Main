import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  college: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true }
}, { _id: false });

const EventRegistrationSchema = new mongoose.Schema({

  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  teamName: {
    type: String,
    trim: true
  },

  teamLeader: {
    type: participantSchema,
    required: true
  },

  teamMembers: {
    type: [participantSchema],
    default: []
  },

  totalParticipants: {
    type: Number,
    required: true
  },

  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  attendanceMarked: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("EventRegistration", EventRegistrationSchema);