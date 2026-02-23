import validator from "validator";

export const validateRegister = ({ fullName, email, password }) => {
  const errors = [];
  if (!fullName || fullName.length < 3) errors.push("Full name must be at least 3 characters");
  if (!email || !validator.isEmail(email)) errors.push("Invalid email");
  if (!password || password.length < 8) errors.push("Password must be at least 8 characters");
  return errors;
};
