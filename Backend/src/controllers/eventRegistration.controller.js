import Event from "../models/Event.model.js";
import EventRegistration from "../models/EventRegistration.model.js";

export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { teamName, teamLeader, teamMembers = [] } = req.body;

    const userId = req.user._id;

    // 1️⃣ Find event
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ success: false, message: "Event not found" });

    // 2️⃣ Check event status
    if (event.status !== "Published")
      return res.status(400).json({ success: false, message: "Event not open for registration" });

    // 3️⃣ Check registration open
    if (!event.registration?.isOpen)
      return res.status(400).json({ success: false, message: "Registration closed" });

    // 4️⃣ Basic validation
    if (!teamLeader)
      return res.status(400).json({ success: false, message: "Participant details required" });

    // 5️⃣ Team validation
    if (event.isTeamEvent) {
      if (!teamName)
        return res.status(400).json({ success: false, message: "Team name required" });

      if (teamMembers.length > event.maxTeamSize - 1)
        return res.status(400).json({ success: false, message: "Team size exceeded" });

    } else {
      if (teamMembers.length > 0 || teamName)
        return res.status(400).json({ success: false, message: "Solo event does not allow team registration" });
    }

    // 6️⃣ Duplicate check (leader email)
    const existingRegistration = await EventRegistration.findOne({
      event: eventId,
      "teamLeader.email": teamLeader.email
    });

    if (existingRegistration)
      return res.status(400).json({ success: false, message: "Already registered" });

    // 7️⃣ Calculate incoming participant count
    const incomingCount = event.isTeamEvent
      ? 1 + teamMembers.length
      : 1;

    // 8️⃣ Calculate current participant count
    const aggregation = await EventRegistration.aggregate([
      { $match: { event: event._id } },
      { $group: { _id: null, total: { $sum: "$totalParticipants" } } }
    ]);

    const currentTotal = aggregation[0]?.total || 0;

    if (currentTotal + incomingCount > event.registration.maxParticipants)
      return res.status(400).json({ success: false, message: "Event capacity full" });

    // 9️⃣ Create registration
    const registration = await EventRegistration.create({
      event: eventId,
      teamName,
      teamLeader,
      teamMembers,
      totalParticipants: incomingCount,
      registeredBy: userId
    });

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: registration
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};