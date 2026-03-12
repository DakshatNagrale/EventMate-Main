import mongoose from "mongoose";

const normalizeVerificationCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const CertificateSchema = new mongoose.Schema(
  {
    // Event info — stored directly, no ID hunting
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    eventName: {
      type: String,
      required: true
    },
    eventDate: {
      type: String,
      required: true
    },

    // Registration reference
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
      required: true
    },

    // Participant info — stored directly
    participantName: {
      type: String,
      required: true
    },
    participantEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    // Certificate type
    certificateType: {
      type: String,
      enum: ["participation", "winner"],
      required: true
    },

    // Only for winners
    position: {
      type: String,
      enum: ["1st", "2nd", "3rd"],
      default: null
    },

    // Cloudinary URL — used for dashboard display + download
    certificateUrl: {
  type: String,
  default: null
},
certificateData: {
  type: String,  // base64 encoded PDF
  default: null
},
    verificationCode: {
      type: String,
      trim: true,
      default: null
    },
    verificationCodeNormalized: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },
    verificationStatus: {
      type: String,
      enum: ["VALID", "REVOKED"],
      default: "VALID"
    },
    revokedAt: {
      type: Date,
      default: null
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    revokeReason: {
      type: String,
      default: null
    },

    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// One certificate per participant per event
CertificateSchema.index(
  { eventId: 1, participantEmail: 1 },
  { unique: true }
);
CertificateSchema.index(
  { verificationCodeNormalized: 1 },
  { unique: true, sparse: true }
);

CertificateSchema.pre("validate", function() {
  const normalized = normalizeVerificationCode(this.verificationCode);
  this.verificationCodeNormalized = normalized || null;
});

export default mongoose.model("Certificate", CertificateSchema);
