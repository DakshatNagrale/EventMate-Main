import jwt from "jsonwebtoken";

export default (id) =>
  jwt.sign({ userId: id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
