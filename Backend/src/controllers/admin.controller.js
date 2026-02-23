import User from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ---------------- GET ALL USERS ----------------
export const getAllUsersController = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken");
  res.json({ success: true, users });
});

// ---------------- UPDATE USER ----------------
export const updateUserController = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, message: "User updated", user });
});

// ---------------- DELETE USER ----------------
export const deleteUserController = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "User deleted" });
});
