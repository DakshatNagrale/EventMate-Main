import * as feedbackService from "../services/feedback.service.js";

export const submitFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.submitFeedback(
      req.params.eventId,
      req.user._id,
      req.body
    );
    return res.status(201).json({
      success: true,
      message: "Feedback submitted! Your certificate will be emailed shortly.",
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

export const getEventFeedback = async (req, res, next) => {
  try {
    const result = await feedbackService.getEventFeedback(
      req.params.eventId,
      req.user
    );
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};