import Event from "../models/Event.model.js";
import uploadImageCloudinary from "../utils/uploadImageCloudinary.js";
import {asyncHandler} from "../utils/asyncHandler.js";

export const createEventController = asyncHandler(async (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Event poster is required"
    });
  }

  const {
    title,
    description,
    category,
    venue,
    schedule,
    registration,
    certificate,
    feedback,
    isTeamEvent,
    minTeamSize,
    maxTeamSize
  } = req.body;

  if (!title || !category) {
    return res.status(400).json({
      success: false,
      message: "Title and category are required"
    });
  }

  // Upload to Cloudinary
  const uploaded = await uploadImageCloudinary(req.file);

  const event = await Event.create({
    title,
    description,
    category,
    posterUrl: uploaded.url,

    organizer: {
      organizerId: req.user._id,
      name: req.user.fullName,
      department: req.user.professionalProfile?.department || "",
      contactEmail: req.user.email,
      contactPhone: req.user.mobileNumber || ""
    },

    venue: venue ? JSON.parse(venue) : undefined,
    schedule: schedule ? JSON.parse(schedule) : undefined,
    registration: registration ? JSON.parse(registration) : {
      isOpen: false,
      fee: 0
    },
    certificate: certificate ? JSON.parse(certificate) : { isEnabled: false },
    feedback: feedback ? JSON.parse(feedback) : { enabled: false },

    isTeamEvent: isTeamEvent === "true",
    minTeamSize: minTeamSize ? Number(minTeamSize) : 1,
    maxTeamSize: maxTeamSize ? Number(maxTeamSize) : 1,

    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: "Event created successfully (Draft)",
    data: event
  });
});

// PUBLISH EVENT
export const publishEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (event.status === "Published") {
      return res.status(400).json({
        success: false,
        message: "Event already published"
      });
    }

    event.status = "Published";
    event.updatedBy = req.user._id;

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Event published successfully",
      data: event
    });

  } catch (error) {
    next(error);
  }
};

//getPublishedEvents

export const getPublishedEvents = async (req, res, next) => {
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    
    const events = await Event.find({ status: "Published" }).select("-__v -createdBy -updatedBy").skip(skip)
      .limit(limit);


    const total = await Event.countDocuments({ status: "Published" });
    
    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: events
    });

  } catch (error) {
    next(error);
  }
};

//cancel event
export const cancelEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (event.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Completed event cannot be cancelled"
      });
    }

    if (event.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Event already cancelled"
      });
    }

    if (
      req.user.role !== "MAIN_ADMIN" &&
      event.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this event"
      });
    }

    event.status = "Cancelled";
    event.updatedBy = req.user._id;

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      data: event
    });

  } catch (error) {
    next(error);
  }
};

//completeEvent
export const completeEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }


    if (event.status !== "Published") {
      return res.status(400).json({
        success: false,
        message: "Only published events can be marked as completed"
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      event.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this event"
      });
    }

    event.status = "Completed";
    event.updatedBy = req.user._id;

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Event marked as completed successfully",
      data: event
    });

  } catch (error) {
    next(error);
  }
};

//updateEvent
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (
      req.user.role !== "MAIN_ADMIN" &&
      event.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event"
      });
    }

    if (event.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft events can be updated"
      });
    }


    delete req.body.organizer;
    delete req.body.createdBy;
    delete req.body.updatedBy;
    delete req.body.status;
    delete req.body._id;
    delete req.body.__v;


    Object.assign(event, req.body);

    event.updatedBy = req.user._id;

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event
    });

  } catch (error) {
    next(error);
  }
};

//get an published event by id
export const getEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    
    if(!event){
     return res.status(404).json({
        success: false,
        message: "Event not found!"
      });
    }
    
    if(req.user.role !== "MAIN_ADMIN" &&
      event.createdBy.toString() !== req.user._id.toString() && event.status !== "Published"){
       return res.status(403).json({
          success: false,
          message: "Not authorized to view this event"
        })
      }
      
      return res.status(200).json({
      success: true,
      message: "Access Granted!",
      data: event
    });
    
  } catch (error) {
    next(error);
  }
};
