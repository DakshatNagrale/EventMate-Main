import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import generateOtp from "../utils/generateOtp.js";
import sendEmail from "../config/sendEmail.js";
import forgotPasswordTemplate from "../utils/forgotPasswordTemplate.js";
import uploadImageCloudinary from "../utils/uploadImageCloudinary.js";

// ---------------- PROFILE ----------------
export const getProfileController = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ---------------- UPDATE PROFILE ----------------
export const updateProfileController = asyncHandler(async (req, res) => {
  delete req.body.role; // role cannot be changed
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true });
  res.json({ success: true, message: "Profile updated", user });
});

// ---------------- UPLOAD AVATAR ----------------
export const uploadAvatarController = asyncHandler(async (req, res) => {
  const result = await uploadImageCloudinary(req.file);
  req.user.avatar = result.url;
  await req.user.save();
  res.json({ success: true, message: "Avatar uploaded", avatar: result.url });
});

// ---------------- FORGOT PASSWORD ----------------
export const forgotPasswordController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = Date.now() + 5*60*1000;
  await user.save();

  await sendEmail(email, "Reset Password OTP", forgotPasswordTemplate({ name: user.fullName, otp }));
  res.json({ success: true, message: "OTP sent to email" });
});

// ---------------- RESET PASSWORD ----------------
export const resetPasswordController = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email }).select("+otp +otpExpiry");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (user.otp.toString() !== otp.toString() || user.otpExpiry < Date.now())
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  res.json({ success: true, message: "Password reset successful" });
});

// Admin creates Organizer
export const createOrganizer = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const organizer = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "ORGANIZER",
      createdBy: req.user._id,
      emailVerified: true // optional to skip OTP for admin-created users
    });

    res.status(201).json({
      success: true,
      message: "Organizer created successfully",
      data: {
        _id: organizer._id,
        fullName: organizer.fullName,
        email: organizer.email,
        role: organizer.role
      }
    });

  } catch (error) {
    next(error);
  }
};

// MAIN_ADMIN or ORGANIZER creates Student Coordinator
export const createCoordinator = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const coordinator = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "STUDENT_COORDINATOR",
      createdBy: req.user._id,
      emailVerified: true 
    });

    res.status(201).json({
      success: true,
      message: "Coordinator created successfully",
      data: {
        _id: coordinator._id,
        fullName: coordinator.fullName,
        email: coordinator.email,
        role: coordinator.role,
        createdBy: coordinator.createdBy
      }
    });

  } catch (error) {
    next(error);
  }
};
