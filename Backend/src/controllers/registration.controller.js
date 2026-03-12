import * as registrationService from "../services/registration.service.js";

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

// Student — see their own registrations
export const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await registrationService.getMyRegistrations(
      req.user._id
    );
    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

// Organizer — see all registrations for their event
export const getEventRegistrations = async (req, res, next) => {
  try {
    const registrations = await registrationService.getEventRegistrations(
      req.params.eventId,
      req.user
    );
    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

// Organizer/Coordinator — scan QR token
export const markAttendance = async (req, res, next) => {
  try {
    const result = await registrationService.markAttendance(
      req.params.token,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: `Attendance marked for ${result.participantName}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Admin — mark attendance manually
export const markAttendanceManual = async (req, res, next) => {
  try {
    const result = await registrationService.markAttendanceManual(
      req.params.registrationId,
      req.body.email,
      req.user._id
    );
    return res.status(200).json({
      success: true,
      message: `Attendance marked for ${result.participantName}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Tag winner
export const tagWinner = async (req, res, next) => {
  try {
    const result = await registrationService.tagWinner(
      req.params.registrationId,
      req.body.position,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: `${result.position} place assigned to ${result.name}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
