import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Loader2, MessageSquareMore, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import SummaryApi from "../api/SummaryApi";
import { extractEventItem } from "../lib/backendAdapters";

const normalizeId = (value) => String(value || "").trim();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const firstNumber = (...values) => {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
};

const formatDate = (value) => {
  if (!value) return "Date unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unknown";
  return date.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
};

const getFeedbackCount = (event) =>
  Math.max(
    0,
    Math.floor(
      firstNumber(
        event?.feedbackCount,
        event?.totalFeedback,
        event?.feedback?.count,
        event?.feedback?.total,
        event?.feedbackSummary?.total
      ) || 0
    )
  );

const getEventRating = (event) =>
  firstNumber(
    event?.averageRating,
    event?.ratingAverage,
    event?.rating?.average,
    event?.ratings?.average,
    event?.feedback?.averageRating,
    event?.feedback?.rating
  );

const parseFeedbackItemsFromCollection = (collection) => {
  const rows = Array.isArray(collection) ? collection : [];

  return rows
    .map((entry, index) => {
      const rating = firstNumber(entry?.rating, entry?.stars, entry?.score, entry?.value);
      const comment = String(entry?.comment || entry?.feedback || entry?.message || entry?.text || "").trim();
      const reviewer =
        entry?.reviewerName ||
        entry?.participantName ||
        entry?.studentName ||
        entry?.user?.fullName ||
        entry?.user?.name ||
        entry?.name ||
        "Anonymous";

      if (!comment && rating === null) return null;

      return {
        id: normalizeId(entry?._id || entry?.id) || `feedback-${index}`,
        reviewer,
        rating,
        comment: comment || "No written feedback provided.",
        submittedAt: entry?.createdAt || entry?.updatedAt || null,
      };
    })
    .filter(Boolean);
};

const parseRegistrationRows = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.registrations)) return payload.registrations;
  if (Array.isArray(payload?.data?.registrations)) return payload.data.registrations;
  return [];
};

const collectFeedbackItems = (event, registrationRows) => {
  const pools = [
    event?.feedbackEntries,
    event?.feedbacks,
    event?.feedback?.entries,
    event?.feedback?.responses,
    event?.feedbackSummary?.entries,
  ];

  const eventItems = pools.flatMap(parseFeedbackItemsFromCollection);

  const registrationItems = registrationRows.flatMap((row, index) => {
    if (Array.isArray(row?.feedback)) {
      return parseFeedbackItemsFromCollection(row.feedback);
    }
    if (row?.feedback && typeof row.feedback === "object") {
      return parseFeedbackItemsFromCollection([row.feedback]);
    }

    const rating = firstNumber(row?.rating, row?.feedbackRating, row?.feedback?.rating);
    const comment = String(row?.feedbackText || row?.feedbackComment || "").trim();

    if (!comment && rating === null) return [];

    return [
      {
        id: normalizeId(row?._id || row?.id) || `registration-feedback-${index}`,
        reviewer:
          row?.participantName ||
          row?.student?.fullName ||
          row?.student?.name ||
          row?.user?.fullName ||
          row?.user?.name ||
          "Participant",
        rating,
        comment: comment || "No written feedback provided.",
        submittedAt: row?.updatedAt || row?.createdAt || null,
      },
    ];
  });

  const dedupe = new Map();
  [...eventItems, ...registrationItems].forEach((item) => {
    const key = `${item.id}-${item.reviewer}-${item.comment}`;
    if (!dedupe.has(key)) {
      dedupe.set(key, item);
    }
  });

  return Array.from(dedupe.values()).sort(
    (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
  );
};

export default function OrganizerEventFeedback() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [eventData, setEventData] = useState(null);
  const [feedbackRows, setFeedbackRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setWarning(null);

      try {
        const detailResponse = await api({
          ...SummaryApi.get_public_event_details,
          url: SummaryApi.get_public_event_details.url.replace(":eventId", encodeURIComponent(eventId || "")),
        });

        const event = extractEventItem(detailResponse.data);
        if (!event) {
          setError("Event not found.");
          setLoading(false);
          return;
        }

        let registrationRows = [];
        try {
          const registrationResponse = await api({
            ...SummaryApi.get_event_registrations,
            url: SummaryApi.get_event_registrations.url.replace(":eventId", encodeURIComponent(eventId || "")),
          });
          registrationRows = parseRegistrationRows(registrationResponse.data);
        } catch {
          setWarning("Detailed feedback entries are limited in this backend build.");
        }

        setEventData(event);
        setFeedbackRows(collectFeedbackItems(event, registrationRows));
      } catch (fetchError) {
        setEventData(null);
        setFeedbackRows([]);
        setError(fetchError.response?.data?.message || "Unable to load feedback details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId]);

  const summary = useMemo(() => {
    if (!eventData) {
      return {
        title: "Event",
        category: "General",
        status: "N/A",
        averageRating: null,
        feedbackCount: 0,
      };
    }

    const ratingFromRows = feedbackRows
      .map((row) => toNumber(row.rating))
      .filter((value) => value !== null);

    const averageFromRows = ratingFromRows.length
      ? ratingFromRows.reduce((sum, value) => sum + value, 0) / ratingFromRows.length
      : null;

    const averageRating = getEventRating(eventData) ?? averageFromRows;
    const feedbackCount = Math.max(getFeedbackCount(eventData), feedbackRows.length);

    return {
      title: eventData?.title || "Event",
      category: eventData?.category || "General",
      status: String(eventData?.status || "Draft"),
      averageRating,
      feedbackCount,
    };
  }, [eventData, feedbackRows]);

  return (
    <div className="eventmate-page min-h-screen bg-slate-100/80 dark:bg-gray-900 px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate("/organizer-dashboard")}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {loading && (
          <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5 text-sm text-slate-500 dark:text-slate-300 inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading feedback details...
          </section>
        )}

        {error && !loading && (
          <section className="eventmate-panel rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300">
            {error}
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
                      {summary.category}
                    </span>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {summary.status}
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Feedback - {summary.title}</h1>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/organizer-dashboard/event/${encodeURIComponent(eventId || "")}/details`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/30 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
                >
                  <CalendarDays size={15} />
                  Event Details
                </button>
              </div>
            </section>

            {warning && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200">
                {warning}
              </p>
            )}

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <article className="eventmate-kpi rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Average Rating</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.averageRating === null ? "--" : summary.averageRating.toFixed(1)}
                </p>
              </article>
              <article className="eventmate-kpi rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Feedback Count</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{summary.feedbackCount}</p>
              </article>
              <article className="eventmate-kpi rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Detailed Entries</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{feedbackRows.length}</p>
              </article>
            </section>

            <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Feedback Entries</h2>
              {feedbackRows.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
                  Feedback entry list is not exposed by current backend routes for this event.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {feedbackRows.map((row) => (
                    <article key={row.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.reviewer}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{formatDate(row.submittedAt)}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          <Star size={12} />
                          {row.rating === null ? "No rating" : row.rating}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{row.comment}</p>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs text-slate-500 dark:text-slate-300 inline-flex items-center gap-2">
                <MessageSquareMore size={13} />
                This page is dynamic and uses currently exposed backend fields without adding backend changes.
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
