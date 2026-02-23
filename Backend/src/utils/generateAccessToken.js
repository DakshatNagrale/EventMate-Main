import jwt from "jsonwebtoken";

export default (id) =>
  jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "1h" });
