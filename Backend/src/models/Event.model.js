import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Technical", "Cultural", "Sports", "Workshop"],
      required: true,
    },

    posterUrl: {
      type: String,
      default: "",
    },

    /* ================= EVENT TYPE ================= */

    eventType: {
      type: String,
      enum: ["INDIVIDUAL", "TEAM"],
      default: "INDIVIDUAL",
      required: true,
    },

    /* ================= ORGANIZER ================= */

    organizer: {
      organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: { type: String, required: true },
      department: String,
      contactEmail: String,
      contactPhone: String,
    },

    studentCoordinators: [
      {
        coordinatorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        email: String,
      },
    ],

    /* ================= VENUE ================= */

    venue: {
      mode: {
        type: String,
        enum: ["ONLINE", "OFFLINE", "HYBRID"],
        required: true,
      },
      location: String,
      googleMapLink: String,
    },

    /* ================= SCHEDULE ================= */

    schedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      startTime: String,
      endTime: String,
    },

    /* ================= REGISTRATION ================= */

    registration: {
      isOpen: { type: Boolean, default: false },
      lastDate: Date,

      // For individual events
      maxParticipants: Number,

      // For team events
      maxTeams: Number,

      fee: {
        type: Number,
        default: 0,
        min: 0,
      },

      paymentQrCode: String,
      paymentUpiId: String,
    },

    /* ================= TEAM CONFIG ================= */

    minTeamSize: {
      type: Number,
      default: 1,
      min: 1,
    },

    maxTeamSize: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* ================= STATUS ================= */

    status: {
      type: String,
      enum: ["Draft", "Published", "Completed", "Cancelled"],
      default: "Draft",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* ===== VALIDATION ===== */

EventSchema.pre("save", function (next) {
  if (this.eventType === "INDIVIDUAL") {
    this.minTeamSize = 1;
    this.maxTeamSize = 1;
    this.registration.maxTeams = null;

    if (!this.registration.maxParticipants) {
      return next(
        new Error("maxParticipants required for INDIVIDUAL event")
      );
    }
  }

  if (this.eventType === "TEAM") {
    this.registration.maxParticipants = null;

    if (!this.registration.maxTeams) {
      return next(
        new Error("maxTeams required for TEAM event")
      );
    }

    if (this.minTeamSize > this.maxTeamSize) {
      return next(
        new Error("minTeamSize cannot exceed maxTeamSize")
      );
    }
  }

  next();
});

/* ===== INDEXES ===== */

EventSchema.index({ category: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ "schedule.startDate": 1 });

export default mongoose.model("Event", EventSchema);