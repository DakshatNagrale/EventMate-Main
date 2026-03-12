import Contact from "../models/Contact.model.js";
import { sendNotification } from "../services/notification.service.js";
import User from "../models/User.model.js";

/* ================================================
   POST /api/contact
   Anyone can submit — logged in or not
================================================ */
export const submitContact = async (req, res, next) => {
  try {
    const { fullName, email, message } = req.body;

    if (!fullName || !email || !message)
      return res.status(400).json({
        success: false,
        message: "Full name, email and message are required"
      });

    const contact = await Contact.create({
      fullName,
      email,
      message,
      submittedBy: {
        userId: req.user?._id || null,
        role: req.user?.role || "GUEST"
      }
    });
// Notify admin
const admin = await User.findOne({ role: "MAIN_ADMIN" });
if (admin) {
  await sendNotification({
    recipientId: admin._id,
    recipientName: admin.fullName,
    recipientRole: "MAIN_ADMIN",
    title: "New Contact Message",
    message: `${fullName} (${email}) sent a message`,
    type: "CONTACT",
    refId: contact._id
  });
}
    return res.status(201).json({
      success: true,
      message: "Your message has been submitted. We'll get back to you soon!",
      data: {
        fullName: contact.fullName,
        email: contact.email,
        message: contact.message,
        submittedAt: contact.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/* ================================================
   GET /api/contact
   MAIN_ADMIN only — view all submissions
================================================ */
export const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
};