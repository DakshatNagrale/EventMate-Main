import cron from "node-cron";
import Event from "../models/Event.model.js";

const buildEventEndDateTime = (endDate, endTime) => {
  if (!endDate || !endTime) return null;

  const [hours, minutes] = String(endTime).split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

  const rawDate = new Date(endDate);
  if (Number.isNaN(rawDate.getTime())) return null;

  // Preserve the stored calendar day and merge it with schedule end time.
  return new Date(
    rawDate.getUTCFullYear(),
    rawDate.getUTCMonth(),
    rawDate.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );
};

const autoCompleteEvents = async () => {
  try {
    const now = new Date();
    const publishedEvents = await Event.find({ status: "Published" });

    for (const event of publishedEvents) {
      const eventEndDateTime = buildEventEndDateTime(
        event.schedule?.endDate,
        event.schedule?.endTime
      );

      if (!eventEndDateTime) continue;

      if (now >= eventEndDateTime) {
        await Event.findByIdAndUpdate(event._id, {
          status: "Completed",
          updatedAt: now
        });
        console.log(`[AUTO_COMPLETE] Event marked completed: ${event.title}`);
      }
    }
  } catch (error) {
    console.error("[AUTO_COMPLETE] Cron job error:", error.message);
  }
};

const startCronJobs = () => {
  // Run every minute so events are completed close to their end date/time.
  cron.schedule("* * * * *", autoCompleteEvents);
  console.log("[AUTO_COMPLETE] Cron jobs started");
};

export default startCronJobs;
