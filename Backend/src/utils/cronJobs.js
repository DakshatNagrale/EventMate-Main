import cron from "node-cron";
import Event from "../models/Event.model.js";

const autoCompleteEvents = async () => {
  try {
    const now = new Date();

    // Find all Published events
    const publishedEvents = await Event.find({ status: "Published" });

    for (const event of publishedEvents) {
      const { endDate, endTime } = event.schedule;

      if (!endDate || !endTime) continue;

      // Combine endDate + endTime into one DateTime
      // endTime is "16:00" format
      const [hours, minutes] = endTime.split(":").map(Number);

      const eventEndDateTime = new Date(endDate);
      eventEndDateTime.setHours(hours, minutes, 0, 0);

      // Add 6 hours
      const completionTime = new Date(
        eventEndDateTime.getTime() + 6 * 60 * 60 * 1000
      );

      // If current time has passed completionTime → mark Completed
      if (now >= completionTime) {
  await Event.findByIdAndUpdate(event._id, { status: "Completed" });
  console.log(`✅ Auto completed event: ${event.title}`);
}
    }
  } catch (error) {
    console.error("❌ Cron job error:", error.message);
  }
};

const startCronJobs = () => {
  // Runs every hour at minute 0
  cron.schedule("0 * * * *", () => {
    console.log("⏰ Running auto complete events cron job...");
    autoCompleteEvents();
  });

  console.log("✅ Cron jobs started");
};

export default startCronJobs;