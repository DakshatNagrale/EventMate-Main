import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CircleCheck,
  Clock3,
  Loader2,
  MapPin,
  MessageSquareMore,
  PencilLine,
  Plus,
  QrCode,
  RefreshCcw,
  Sparkles,
  Star,
  Users2,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import SummaryApi from "../api/SummaryApi";
import { getStoredUser } from "../lib/auth";
import { extractEventList } from "../lib/backendAdapters";

const STATUS_STYLES = {
  Draft: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Completed: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

const DEFAULT_POSTER =
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80";

const timeAgo = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const normalizeId = (value) => String(value || "").trim();
const sortByRecent = (items) =>
  [...items].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime()
  );

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
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const formatRelativeTime = (value) => {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 45) return "just now";
  if (abs < 3600) return timeAgo.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return timeAgo.format(Math.round(diffSec / 3600), "hour");
  return timeAgo.format(Math.round(diffSec / 86400), "day");
};

const formatTimeRange = (schedule) => {
  const startTime = String(schedule?.startTime || "").trim();
  const endTime = String(schedule?.endTime || "").trim();
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime || "Time TBD";
};

const getDateBadge = (value) => {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return { month: "TBD", day: "--" };
  return {
    month: date.toLocaleDateString([], { month: "short" }),
    day: date.toLocaleDateString([], { day: "2-digit" }),
  };
};

const getEventRating = (event) =>
  firstNumber(
    event?.averageRating,
    event?.ratingAverage,
    event?.rating?.average,
    event?.ratings?.average,
    event?.feedback?.averageRating,
    event?.feedback?.rating
  );

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

const deriveEventStage = (event) => {
  const workflowStatus = String(event?.status || "Draft");
  if (workflowStatus === "Draft") {
    return {
      label: "Draft",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    };
  }
  if (workflowStatus === "Completed") {
    return {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    };
  }
  if (workflowStatus === "Cancelled") {
    return {
      label: "Cancelled",
      className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    };
  }

  const start = new Date(event?.schedule?.startDate || 0).getTime();
  const end = new Date(event?.schedule?.endDate || event?.schedule?.startDate || 0).getTime();
  const now = Date.now();

  if (Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end) {
    return {
      label: "Live Now",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    };
  }

  return {
    label: "Published",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  };
};

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [events, setEvents] = useState([]);
  const [registrationStats, setRegistrationStats] = useState({});
  const [loadingRegistrationStats, setLoadingRegistrationStats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [pendingEventId, setPendingEventId] = useState("");

  const fetchRegistrationStats = async (eventRows) => {
    const rows = Array.isArray(eventRows) ? eventRows : [];
    if (!rows.length) {
      setRegistrationStats({});
      return;
    }

    setLoadingRegistrationStats(true);
    try {
      const requests = rows.map(async (event) => {
        const eventId = normalizeId(event?._id);
        if (!eventId) return null;
        try {
          const response = await api({
            ...SummaryApi.get_event_registrations,
            url: SummaryApi.get_event_registrations.url.replace(":eventId", eventId),
          });
          const apiCount = Number(response.data?.count);
          const list = Array.isArray(response.data?.data) ? response.data.data : [];
          return [eventId, { count: Number.isFinite(apiCount) ? apiCount : list.length, error: null }];
        } catch (fetchError) {
          return [eventId, { count: null, error: fetchError.response?.data?.message || "Unavailable" }];
        }
      });

      const resolved = await Promise.all(requests);
      const next = {};
      resolved.filter(Boolean).forEach(([eventId, payload]) => {
        next[eventId] = payload;
      });
      setRegistrationStats(next);
    } finally {
      setLoadingRegistrationStats(false);
    }
  };

  const fetchMyEvents = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setMessage(null);
    }
    setError(null);

    try {
      const response = await api({ ...SummaryApi.get_my_events });
      const myEvents = extractEventList(response.data);
      const sortedEvents = sortByRecent(myEvents);
      setEvents(sortedEvents);
      fetchRegistrationStats(sortedEvents);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [user?._id]);

  const handlePublishEvent = async (eventId) => {
    if (!eventId) return;

    setPendingEventId(eventId);
    setMessage(null);
    try {
      const response = await api({
        ...SummaryApi.publish_event,
        url: SummaryApi.publish_event.url.replace(":eventId", eventId),
      });
      setMessage({ type: "success", text: response.data?.message || "Event published successfully." });
      await fetchMyEvents({ silent: true });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Unable to publish event.",
      });
    } finally {
      setPendingEventId("");
    }
  };

  const metrics = useMemo(() => {
    const total = events.length;
    const published = events.filter((event) => String(event?.status || "Draft") === "Published").length;
    const draft = events.filter((event) => String(event?.status || "Draft") === "Draft").length;
    const completed = events.filter((event) => String(event?.status || "Draft") === "Completed").length;
    const cancelled = events.filter((event) => String(event?.status || "Draft") === "Cancelled").length;

    const totalRegistrations = Object.values(registrationStats).reduce((sum, row) => {
      const count = Number(row?.count);
      return Number.isFinite(count) ? sum + count : sum;
    }, 0);

    const ratings = events.map(getEventRating).filter((value) => Number.isFinite(value));
    const averageRating = ratings.length
      ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
      : null;

    const feedbackCount = events.reduce((sum, event) => sum + getFeedbackCount(event), 0);

    return {
      total,
      published,
      draft,
      completed,
      cancelled,
      totalRegistrations,
      averageRating,
      feedbackCount,
    };
  }, [events, registrationStats]);

  const profileProgress = useMemo(() => {
    const checks = [
      Boolean(user?.fullName || user?.name),
      Boolean(user?.email),
      Boolean(user?.phone || user?.phoneNumber),
      Boolean(user?.department || user?.organization || user?.college),
      Boolean(user?.avatar),
    ];
    const done = checks.filter(Boolean).length;
    const total = checks.length;
    const percent = Math.round((done / total) * 100);
    return { done, total, left: total - done, percent };
  }, [user]);

  const activity = useMemo(() => {
    const list = [];

    events.slice(0, 6).forEach((event) => {
      const id = normalizeId(event?._id);
      if (!id) return;

      const title = event?.title || "Untitled Event";
      const status = String(event?.status || "Draft");
      const timestamp = event?.updatedAt || event?.createdAt || null;
      const regCount = Number(registrationStats[id]?.count);
      const feedbackCount = getFeedbackCount(event);

      if (Number.isFinite(regCount) && regCount > 0) {
        list.push({ id: `reg-${id}`, type: "reg", text: `${regCount} registration(s) for ${title}`, at: timestamp });
      }
      if (feedbackCount > 0) {
        list.push({ id: `fb-${id}`, type: "feedback", text: `${feedbackCount} feedback for ${title}`, at: timestamp });
      }

      list.push({ id: `status-${id}`, type: "status", text: `${title} is ${status.toLowerCase()}`, at: timestamp });
    });

    if (!list.length) {
      list.push({
        id: "empty-activity",
        type: "status",
        text: "Create your first event to start seeing organizer activity.",
        at: new Date().toISOString(),
      });
    }

    return list
      .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
      .slice(0, 5);
  }, [events, registrationStats]);

  const kpis = [
    {
      label: "Total Events Published",
      value: metrics.published,
      icon: CalendarDays,
      iconClass: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
    },
    {
      label: "Total Registrations",
      value: metrics.totalRegistrations.toLocaleString(),
      icon: Users2,
      iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    },
    {
      label: "Avg. Rating",
      value: metrics.averageRating === null ? "--" : metrics.averageRating.toFixed(1),
      icon: Star,
      iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
    },
    {
      label: "New Feedback",
      value: metrics.feedbackCount,
      icon: MessageSquareMore,
      iconClass: "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300",
    },
  ];

  return (
    <div className="eventmate-page min-h-screen bg-slate-100/80 dark:bg-gray-900 px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                <Users2 size={13} />
                Organizer Workspace
              </span>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Organizer Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Welcome back, {user?.fullName || "Organizer"}.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fetchMyEvents({ silent: true })}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10 disabled:opacity-60"
              >
                {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
                Refresh
              </button>
              <button
                type="button"
                onClick={() => navigate("/organizer-dashboard/create-event")}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={15} />
                Create Event
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="eventmate-kpi rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                  </div>
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${item.iconClass}`}>
                    <Icon size={16} />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"
            }`}
          >
            {message.text}
          </p>
        )}

        {loading && (
          <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
            <Loader2 size={14} className="animate-spin" />
            Loading events...
          </p>
        )}

        {error && !loading && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

        {!loading && !error && (
          <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)] gap-4">
            <div id="my-events" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">My Events</h2>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">{metrics.total} total events</p>
              </div>

              {events.length > 0 ? (
                events.slice(0, 6).map((event) => {
                  const eventId = normalizeId(event?._id);
                  const status = String(event?.status || "Draft");
                  const stage = deriveEventStage(event);
                  const isPending = pendingEventId === eventId;
                  const startDate = event?.schedule?.startDate || event?.createdAt;
                  const dateBadge = getDateBadge(startDate);
                  const registrationInfo = registrationStats[eventId] || null;
                  const registrationsText = registrationInfo?.error
                    ? "Registrations unavailable"
                    : Number.isFinite(registrationInfo?.count)
                    ? `${registrationInfo.count} registrations`
                    : loadingRegistrationStats
                    ? "Loading registrations..."
                    : "0 registrations";

                  return (
                    <article key={eventId} className="eventmate-panel overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70">
                      <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)]">
                        <div className="relative h-52 sm:h-full">
                          <img
                            src={String(event?.posterUrl || "").trim() || DEFAULT_POSTER}
                            alt={event?.title || "Event poster"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-center text-[11px] font-semibold text-slate-700 shadow-sm dark:bg-slate-900/85 dark:text-slate-200">
                            <p className="uppercase tracking-wide text-[10px] text-indigo-600 dark:text-indigo-300">{dateBadge.month}</p>
                            <p className="text-sm leading-none">{dateBadge.day}</p>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
                                {event?.category || "General"}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${stage.className}`}>
                                {stage.label}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-300">Updated {formatDateTime(event?.updatedAt || event?.createdAt)}</span>
                          </div>

                          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{event?.title || "Untitled Event"}</h3>

                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={13} />
                              {formatDate(startDate)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={13} />
                              {formatTimeRange(event?.schedule)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={13} />
                              {event?.venue?.location || "Venue TBD"}
                            </span>
                          </div>

                          <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                            {event?.description || "Event details will be announced soon."}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {status === "Draft" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/organizer-dashboard/edit-event/${eventId}`)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/30 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
                                >
                                  <PencilLine size={13} />
                                  Edit Event
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handlePublishEvent(eventId)}
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  {isPending ? "Publishing..." : "Publish"}
                                </button>
                              </>
                            ) : (
                              <>
                                {status === "Published" && (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/organizer-dashboard/event/${encodeURIComponent(eventId)}/scan-qr`)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/30 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
                                  >
                                    <QrCode size={13} />
                                    Scan QR
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => navigate(`/organizer-dashboard/event/${encodeURIComponent(eventId)}/details`)}
                                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                >
                                  View Details
                                </button>

                                {(status === "Completed" || getFeedbackCount(event) > 0) && (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/organizer-dashboard/event/${encodeURIComponent(eventId)}/feedback`)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-400/30 dark:text-violet-200 dark:hover:bg-violet-500/20"
                                  >
                                    <MessageSquareMore size={13} />
                                    View Feedbacks
                                  </button>
                                )}
                              </>
                            )}

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              {registrationsText}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.Draft}`}>
                              Workflow: {status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-6 text-sm text-slate-600 dark:text-slate-300">
                  No events found yet. Create one to get started.
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                <div className="mt-4 space-y-3">
                  {activity.map((item) => {
                    const iconClass =
                      item.type === "reg"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"
                        : item.type === "feedback"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                        : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300";

                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${iconClass}`}>
                          {item.type === "reg" ? <Users2 size={14} /> : item.type === "feedback" ? <MessageSquareMore size={14} /> : <Sparkles size={14} />}
                        </span>
                        <div>
                          <p className="text-sm text-slate-700 dark:text-slate-200">{item.text}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(item.at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-5 text-white shadow-xl shadow-indigo-500/20">
                <h3 className="text-lg font-semibold">Complete your profile</h3>
                <p className="mt-1 text-sm text-white/85">
                  Add your details to improve recommendations and organizer setup.
                </p>
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-white/25">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-300"
                      style={{ width: `${profileProgress.percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/90">
                    <span>{profileProgress.percent}% completed</span>
                    <span>{profileProgress.left} steps left</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/profile/customization")}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-white"
                >
                  Continue Setup
                </button>
              </section>

              <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Workflow Snapshot</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Sparkles size={14} className="text-amber-500" /> {metrics.draft} draft
                  </p>
                  <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <CircleCheck size={14} className="text-emerald-500" /> {metrics.completed} completed
                  </p>
                  <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <XCircle size={14} className="text-rose-500" /> {metrics.cancelled} cancelled
                  </p>
                </div>
              </section>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
