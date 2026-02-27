import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, Download, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import SummaryApi from "../api/SummaryApi";
import { extractEventList } from "../lib/backendAdapters";

const DEFAULT_POSTER =
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80";

const deriveCompleted = (event) => {
  const status = String(event?.status || "");
  if (status === "Completed") return true;

  const endDate = new Date(event?.schedule?.endDate || event?.schedule?.startDate || 0).getTime();
  if (Number.isNaN(endDate)) return false;
  return Date.now() > endDate;
};

const formatDateLabel = (value) => {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) return "Date TBD";
  return parsed.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

const formatMonthDay = (value) => {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) {
    return { month: "TBD", day: "--" };
  }

  return {
    month: parsed.toLocaleDateString([], { month: "short" }),
    day: parsed.toLocaleDateString([], { day: "2-digit" }),
  };
};

const formatTimeRange = (schedule) => {
  const start = String(schedule?.startTime || "").trim();
  const end = String(schedule?.endTime || "").trim();
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "Time TBD";
};

export default function MyCertificates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api({ ...SummaryApi.get_public_events });
        const events = extractEventList(response.data);
        const sorted = events
          .filter(deriveCompleted)
          .sort((a, b) => {
            const aTime = new Date(a?.schedule?.endDate || a?.schedule?.startDate || 0).getTime();
            const bTime = new Date(b?.schedule?.endDate || b?.schedule?.startDate || 0).getTime();
            return bTime - aTime;
          });
        setCompletedEvents(sorted);
      } catch (fetchError) {
        setCompletedEvents([]);
        setError(fetchError.response?.data?.message || "Unable to load certificate context.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const certificateRows = useMemo(
    () =>
      completedEvents.map((event) => ({
        id: String(event?._id || event?.id || "").trim(),
        title: event?.title || "Untitled Event",
        category: event?.category || "Seminar",
        description: event?.description || "Event description is not available.",
        posterUrl: event?.posterUrl || DEFAULT_POSTER,
        date: event?.schedule?.startDate || event?.schedule?.endDate || null,
        timeRange: formatTimeRange(event?.schedule),
        venue: event?.venue?.location || "Campus Venue",
      })),
    [completedEvents]
  );

  const handleDownloadClick = () => {
    setNotice("Certificate download is not available in this backend build yet.");
  };

  const handleViewDetails = (eventId) => {
    const normalized = String(eventId || "").trim();
    if (!normalized) return;
    navigate(`/student-dashboard/events/${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="eventmate-page min-h-screen bg-slate-100/80 dark:bg-slate-950 pt-10 pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <button
          type="button"
          onClick={() => navigate("/student-dashboard")}
          className="inline-flex items-center rounded-lg p-1.5 text-slate-500 transition hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>

        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">My Certificates</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Manage your registrations, attendance, and download certificates.
          </p>
        </header>

        {notice && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200">
            {notice}
          </p>
        )}

        {loading && (
          <section className="eventmate-panel rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 inline-flex items-center gap-2">
            <Clock3 size={14} />
            Loading certificate records...
          </section>
        )}

        {error && !loading && (
          <section className="eventmate-panel rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300">
            {error}
          </section>
        )}

        {!loading && !error && certificateRows.length > 0 && (
          <section className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 sm:p-5 dark:border-white/10 dark:bg-slate-900/65">
            <div className="space-y-4 border-l-2 border-indigo-500/70 pl-3 sm:pl-4">
              {certificateRows.map((row) => {
                const monthDay = formatMonthDay(row.date);
                return (
                  <article
                    key={row.id || `${row.title}-${row.date || "cert"}`}
                    className="eventmate-panel rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[170px_1fr]">
                      <div className="relative h-32 sm:h-36 overflow-hidden rounded-xl">
                        <img
                          src={row.posterUrl}
                          alt={row.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-2 top-2 rounded-lg bg-white px-2 py-1 text-center shadow-sm">
                          <p className="text-[10px] font-semibold text-slate-500">{monthDay.month}</p>
                          <p className="text-sm font-bold leading-none text-slate-900">{monthDay.day}</p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            Attended
                          </span>
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                            Certificate Ready
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            {row.category}
                          </span>
                        </div>

                        <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{row.title}</h2>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <p className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300">
                            <CalendarDays size={12} />
                            {formatDateLabel(row.date)} - {row.timeRange}
                          </p>
                          <p className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300">
                            <MapPin size={12} />
                            {row.venue}
                          </p>
                        </div>

                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                          {row.description}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
                          <button
                            type="button"
                            onClick={handleDownloadClick}
                            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-400/40 dark:text-indigo-200 dark:hover:bg-indigo-500/15"
                          >
                            <Download size={12} />
                            Download Certificate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(row.id)}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {!loading && !error && certificateRows.length === 0 && (
          <section className="eventmate-panel rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            No completed events found yet, so no certificates are available.
          </section>
        )}
      </div>
    </div>
  );
}
