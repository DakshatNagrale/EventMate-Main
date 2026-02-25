import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: ["Technical", "Cultural", "Sports", "Workshop"],
      required: true
    },

    posterUrl: String,

    /* ================= ORGANIZER ================= */

    organizer: {
      organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: { type: String, required: true },
      department: String,
      contactEmail: String,
      contactPhone: String
    },

    studentCoordinators: [
      {
        coordinatorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        },
        name: String,
        email: String
      }
    ],

    /* ================= VENUE ================= */

    venue: {
      mode: {
        type: String,
        enum: ["ONLINE", "OFFLINE", "HYBRID"],
        required: true
      },
      location: String,
      googleMapLink: String
    },

    /* ================= SCHEDULE ================= */

    schedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true }
    },

    /* ================= REGISTRATION ================= */

    registration: {
      isOpen: {
        type: Boolean,
        default: false
      },
      lastDate: {
        type: Date,
        required: true
      },
      maxParticipants: {
        type: Number,
        required: true
      },
      fee: {
        type: Number,
        default: 0
      }
    },

    /* ================= TEAM CONFIG ================= */

    isTeamEvent: {
      type: Boolean,
      required: true,
      default: false
    },

    minTeamSize: {
      type: Number,
      default: 1
    },

    maxTeamSize: {
      type: Number,
      default: 1
    },

    /* ================= ATTENDANCE ================= */

    attendance: {
      qrCode: String,
      totalPresent: {
        type: Number,
        default: 0
      }
    },

    /* ================= CERTIFICATE ================= */

    certificate: {
      isEnabled: Boolean,
      templateId: {
        type: mongoose.Schema.Types.ObjectId
      },
      issuedCount: {
        type: Number,
        default: 0
      }
    },

    /* ================= FEEDBACK ================= */

    feedback: {
      enabled: Boolean,
      averageRating: Number
    },

    /* ================= EVENT STATUS ================= */

    status: {
      type: String,
      enum: ["Draft", "Published", "Completed", "Cancelled"],
      default: "Draft"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

/* ==================================================
   CRITICAL VALIDATION LOGIC (TEAM DISTINCTION FIX)
================================================== */

EventSchema.pre("save", function () {

  // Individual Event
  if (!this.isTeamEvent) {
    this.minTeamSize = 1;
    this.maxTeamSize = 1;
  }

  // Team Event
  if (this.isTeamEvent) {
    if (this.maxTeamSize <= 1) {
      throw new Error("Team event must have maxTeamSize greater than 1");
    }

    if (this.minTeamSize < 1) {
      throw new Error("minTeamSize must be at least 1");
    }

    if (this.maxTeamSize < this.minTeamSize) {
      throw new Error("maxTeamSize must be >= minTeamSize");
    }
  }

  // Registration sanity check
  if (this.registration.lastDate > this.schedule.startDate) {
    throw new Error("Registration lastDate cannot be after event startDate");
  }

});

export default mongoose.model("Event", EventSchema);