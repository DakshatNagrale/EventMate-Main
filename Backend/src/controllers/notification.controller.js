import Notification from "../models/Notification.model.js";

// Get all unread notifications for logged in user
export const getMyNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const includeAll = String(req.query.all || "").toLowerCase() === "true";
    const baseFilter = { "recipient.userId": req.user._id };

    const query = Notification.find(baseFilter).sort({ createdAt: -1 });
    if (!includeAll) {
      query.skip((page - 1) * limit).limit(limit);
    }

    const [notifications, unreadCount, totalCount] = await Promise.all([
      query,
      Notification.countDocuments({ ...baseFilter, isRead: false }),
      Notification.countDocuments(baseFilter)
    ]);

    return res.status(200).json({
      success: true,
      unreadCount,
      totalCount,
      page: includeAll ? 1 : page,
      limit: includeAll ? totalCount : limit,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { "recipient.userId": req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    next(error);
  }
};

// Mark single notification as read
export const markOneRead = async (req, res, next) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        "recipient.userId": req.user._id
      },
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    next(error);
  }
};
