import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobileNumber: { type: String, required: true },
    college: { type: String, required: true },
    branch: { type: String, required: true },
    year: { type: String, required: true },
  },
  { _id: false }
);

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
    },

    totalParticipants: {
      type: Number,
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
        type: String, // Cloudinary URL
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

    registrationStatus: {
      type: String,
      enum: ["Registered", "Cancelled"],
      default: "Registered",
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

/* ===== VALIDATION ===== */

EventRegistrationSchema.pre("save", async function (next) {
  try {
    const Event = mongoose.model("Event");
    const event = await Event.findById(this.event);

    if (!event) return next(new Error("Event not found"));

    this.totalParticipants = 1 + this.teamMembers.length;

    /* ===== INDIVIDUAL EVENT ===== */

    if (event.eventType === "INDIVIDUAL") {
      if (this.teamMembers.length > 0)
        return next(
          new Error("Individual event cannot have team members")
        );

      this.teamName = null;

      if (this.totalParticipants !== 1)
        return next(
          new Error("Individual event must have exactly 1 participant")
        );
    }

    /* ===== TEAM EVENT ===== */

    if (event.eventType === "TEAM") {
      if (!this.teamName)
        return next(
          new Error("Team name required for team event")
        );

      if (
        this.totalParticipants < event.minTeamSize ||
        this.totalParticipants > event.maxTeamSize
      )
        return next(
          new Error(
            `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}`
          )
        );
    }

    /* ===== PAYMENT LOGIC ===== */

    if (event.registration.fee > 0) {
      if (!this.payment.transactionId)
        return next(
          new Error("Transaction ID required for paid event")
        );

      this.payment.method = "PHONEPE_QR";
      this.payment.amount = event.registration.fee;
      this.payment.paymentStatus = "Under Review";
    } else {
      this.payment.method = "FREE";
      this.payment.paymentStatus = "Verified";
    }

    next();
  } catch (error) {
    next(error);
  }
});

/* ===== INDEXES ===== */

EventRegistrationSchema.index(
  { event: 1, "teamLeader.email": 1 },
  { unique: true }
);

export default mongoose.model(
  "EventRegistration",
  EventRegistrationSchema
);