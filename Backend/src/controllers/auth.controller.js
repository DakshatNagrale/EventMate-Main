import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import generateOtp from "../utils/generateOtp.js";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import sendEmail from "../config/sendEmail.js";
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import { validateRegister } from "../validators/auth.validator.js";

// ---------------- REGISTER ----------------
export const registerUserController = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  const errors = validateRegister({ fullName, email, password });
  if (errors.length) return res.status(400).json({ success: false, errors });

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ success: false, message: "Email already registered" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    otp,
    otpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  await sendEmail(email, "Verify Email - EventMate", verifyEmailTemplate({ name: fullName, otp }));

  res.status(201).json({ success: true, message: "Registered successfully. OTP sent to email." });
});

// ---------------- VERIFY EMAIL ----------------
export const verifyEmailController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email }).select("+otp +otpExpiry");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (user.otp !== otp || user.otpExpiry < Date.now())
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

  user.emailVerified = true;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  res.json({ success: true, message: "Email verified successfully" });
});

// ---------------- LOGIN ----------------
export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
  if (!user.emailVerified) return res.status(403).json({ success: false, message: "Verify email first" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();

  res.json({ success: true, accessToken, refreshToken, role: user.role });
});

// ---------------- LOGOUT ----------------
export const logoutController = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const user = await User.findById(userId).select("+refreshToken");
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.json({ success: true, message: "Logged out successfully" });
});

// ---------------- REFRESH TOKEN ----------------
export const refreshTokenController = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ success: false, message: "Refresh token missing" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select("+refreshToken");

    if (!user || user.refreshToken?.trim() !== refreshToken?.trim()) {
      return res.status(403).json({ success: false, message: "Invalid refresh token" });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
  }
});
