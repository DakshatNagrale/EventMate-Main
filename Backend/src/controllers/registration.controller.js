import * as registrationService from "../services/registration.service.js";

/* ================================================
   POST /:eventId/initiate
   Student initiates a registration for an event
================================================ */
export const initiateRegistration = async (req, res, next) => {
  try {
    const registration = await registrationService.initiateRegistration(
      req.params.eventId,
      req.user._id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Registration initiated successfully",
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

/* ================================================
   GET /verify/:token
   Team member clicks verify link from email
   (no auth required — public route)
================================================ */
export const verifyMember = async (req, res, next) => {
  try {
    const result = await registrationService.verifyMember(req.params.token);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};