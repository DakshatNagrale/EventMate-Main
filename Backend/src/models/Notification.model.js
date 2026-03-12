import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipient: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      }
    },

    // Notification content
    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    // Type helps frontend show different icons
    type: {
      type: String,
      enum: [
        "REGISTRATION",
        "ASSIGNMENT",
        "ATTENDANCE",
        "CERTIFICATE",
        "FEEDBACK",
        "CONTACT",
        "WINNER"
      ],
      required: true
    },

    // Reference to related document
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);
