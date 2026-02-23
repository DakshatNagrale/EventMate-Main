import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    category: {
      type: String,
      enum: ["Technical", "Cultural", "Sports", "Workshop"]
    },
    posterUrl: String,

    organizer: {
      organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      name: String,
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

    venue: {
      mode: {
        type: String,
        enum: ["ONLINE", "OFFLINE", "HYBRID"]
      },
      location: String,
      googleMapLink: String
    },

    schedule: {
      startDate: Date,
      endDate: Date,
      startTime: String,
      endTime: String
    },

    registration: {
      isOpen: Boolean,
      lastDate: Date,
      maxParticipants: Number,
      fee: {
        type: Number,
        default: 0
      }
    },

    attendance: {
      qrCode: String,
      totalPresent: {
        type: Number,
        default: 0
      }
    },

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

    feedback: {
      enabled: Boolean,
      averageRating: Number
    },

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

export default mongoose.model("Event", EventSchema);