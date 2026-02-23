import { useState } from "react";
import api from "../lib/api";
import SummaryApi from "../common/SummaryApi";

const initialForm = {
  title: "",
  category: "",
  description: "",
  poster: null,
  venueMode: "",
  venueLocation: "",
  venueMap: "",
  scheduleStartDate: "",
  scheduleEndDate: "",
  scheduleStartTime: "",
  scheduleEndTime: "",
  registrationOpen: false,
  registrationLastDate: "",
  registrationMax: "",
  registrationFee: "",
  certificateEnabled: false,
  feedbackEnabled: false
};

export default function EventCreator({ title = "Create Event", subtitle }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    if (type === "file") {
      setForm((prev) => ({ ...prev, [name]: files?.[0] || null }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("category", form.category);
    if (form.description.trim()) payload.append("description", form.description.trim());
    if (form.poster) payload.append("poster", form.poster);

    const venue = {};
    if (form.venueMode) venue.mode = form.venueMode;
    if (form.venueLocation.trim()) venue.location = form.venueLocation.trim();
    if (form.venueMap.trim()) venue.googleMapLink = form.venueMap.trim();
    if (Object.keys(venue).length) payload.append("venue", JSON.stringify(venue));

    const schedule = {};
    if (form.scheduleStartDate) schedule.startDate = form.scheduleStartDate;
    if (form.scheduleEndDate) schedule.endDate = form.scheduleEndDate;
    if (form.scheduleStartTime) schedule.startTime = form.scheduleStartTime;
    if (form.scheduleEndTime) schedule.endTime = form.scheduleEndTime;
    if (Object.keys(schedule).length) payload.append("schedule", JSON.stringify(schedule));

    const registration = { isOpen: !!form.registrationOpen };
    if (form.registrationLastDate) registration.lastDate = form.registrationLastDate;
    if (form.registrationMax) registration.maxParticipants = Number(form.registrationMax);
    if (form.registrationFee) registration.fee = Number(form.registrationFee);
    payload.append("registration", JSON.stringify(registration));

    const certificate = { isEnabled: !!form.certificateEnabled };
    payload.append("certificate", JSON.stringify(certificate));

    const feedback = { enabled: !!form.feedbackEnabled };
    payload.append("feedback", JSON.stringify(feedback));

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!form.title.trim() || !form.category || !form.poster) {
      setMessage({ type: "error", text: "Title, category, and poster are required." });
      return;
    }

    setIsLoading(true);
    try {
      const payload = buildPayload();
      const response = await api({
        ...SummaryApi.create_event,
        data: payload
      });

      setMessage({
        type: "success",
        text: response.data?.message || "Event created successfully."
      });
      setForm(initialForm);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to create event."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {subtitle || "Create a draft event with poster, venue, schedule, and registration details."}
        </p>
      </div>

      {message && (
        <p
          className={`mt-4 text-sm text-center rounded-lg py-2 ${
            message.type === "success" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
          }`}
        >
          {message.text}
        </p>
      )}

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Event title"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            >
              <option value="">Select category</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Describe the event"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Poster</label>
            <input
              type="file"
              name="poster"
              onChange={handleChange}
              accept="image/*"
              className="mt-1 w-full text-sm text-gray-600"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Venue Mode</label>
            <select
              name="venueMode"
              value={form.venueMode}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Select mode</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Venue Location</label>
            <input
              name="venueLocation"
              value={form.venueLocation}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Location"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Google Map Link</label>
            <input
              name="venueMap"
              value={form.venueMap}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="https://maps.google.com"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="scheduleStartDate"
              value={form.scheduleStartDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              name="scheduleEndDate"
              value={form.scheduleEndDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="time"
              name="scheduleStartTime"
              value={form.scheduleStartTime}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">End Time</label>
            <input
              type="time"
              name="scheduleEndTime"
              value={form.scheduleEndTime}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="registrationOpen"
              checked={form.registrationOpen}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Registration Open
          </label>
          <div>
            <label className="text-sm font-medium text-gray-700">Last Registration Date</label>
            <input
              type="date"
              name="registrationLastDate"
              value={form.registrationLastDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Max Participants</label>
            <input
              type="number"
              min="0"
              name="registrationMax"
              value={form.registrationMax}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Registration Fee</label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="registrationFee"
              value={form.registrationFee}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="certificateEnabled"
              checked={form.certificateEnabled}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Certificate Enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="feedbackEnabled"
              checked={form.feedbackEnabled}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Feedback Enabled
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-70"
        >
          {isLoading ? "Creating..." : "Create Draft Event"}
        </button>
      </form>
    </section>
  );
}
