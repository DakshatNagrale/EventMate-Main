import * as registrationService from "../services/registration.service.js";

export const createDraft = async (req, res, next) => {
  try {
    const draft = await registrationService.createDraft(
      req.params.eventId,
      req.user._id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Draft created successfully",
      data: draft
    });

  } catch (error) {
    next(error);
  }
};

export const verifyMember = async (req, res, next) => {
  try {

    const result = await registrationService.verifyMember(
      req.params.token
    );

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    next(error);
  }
};