import mongoose from "mongoose";

/* ================= PARTICIPANT ================= */

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobileNumber: { type: String, required: true },
    college: { type: String, required: true },
    branch: { type: String, required: true },
    year: { type: String, required: true },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/* ================= MAIN SCHEMA ================= */

const EventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    teamName: {
      type: String,
      trim: true,
      default: null,
    },

    teamLeader: {
      type: participantSchema,
      required: true,
    },

    teamMembers: {
      type: [participantSchema],
      default: [],
      emailVerified: {
  type: Boolean,
  default: false
}
    },

    totalParticipants: {
      type: Number,
    },

    /* ===== WORKFLOW STATUS ===== */

    status: {
  type: String,
  enum: ["Draft", "PendingVerification", "Confirmed", "Rejected"],
  default: "Draft"
},

allMembersVerified: {
  type: Boolean,
  default: false
},

    /* ================= PAYMENT ================= */

    payment: {
      method: {
        type: String,
        enum: ["FREE", "PHONEPE_QR"],
        default: "FREE",
      },

      amount: {
        type: Number,
        default: 0,
      },

      transactionId: {
        type: String,
        trim: true,
      },

      paymentScreenshot: {
        type: String,
      },

      paymentStatus: {
        type: String,
        enum: ["Pending", "Under Review", "Verified", "Rejected"],
        default: "Pending",
      },

      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      verifiedAt: Date,
    },

    attendanceMarked: {
      type: Boolean,
      default: false,
    },

    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

/* ================= VALIDATION LOGIC ================= */

EventRegistrationSchema.pre("save", async function () {
  const Event = mongoose.model("Event");
  const event = await Event.findById(this.event);

  if (!event) {
    throw new Error("Event not found");
  }

  this.totalParticipants = 1 + this.teamMembers.length;

  /* ===== INDIVIDUAL EVENT ===== */

  if (event.eventType === "INDIVIDUAL") {
    if (this.teamMembers.length > 0) {
      throw new Error("Individual event cannot have team members");
    }

    this.teamName = null;

    if (this.totalParticipants !== 1) {
      throw new Error("Individual event must have exactly 1 participant");
    }
  }

  /* ===== TEAM EVENT ===== */

  if (event.eventType === "TEAM") {
    if (!this.teamName) {
      throw new Error("Team name required for team event");
    }

    if (
      this.totalParticipants < event.minTeamSize ||
      this.totalParticipants > event.maxTeamSize
    ) {
      throw new Error(
        `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}`
      );
    }
  }

  /* ===== PAYMENT LOGIC ===== */

  if (event.registration?.fee > 0) {
    if (!this.payment.transactionId) {
      throw new Error("Transaction ID required for paid event");
    }

    this.payment.method = "PHONEPE_QR";
    this.payment.amount = event.registration.fee;
    this.payment.paymentStatus = "Under Review";
  } else {
    this.payment.method = "FREE";
    this.payment.paymentStatus = "Verified";
  }
});

/* ================= UNIQUE INDEX ================= */

EventRegistrationSchema.index(
  { event: 1, registeredBy: 1 },
  { unique: true }
);

export default mongoose.model(
  "EventRegistration",
  EventRegistrationSchema
);