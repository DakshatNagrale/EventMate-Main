import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Loader2, MapPin, QrCode, RefreshCcw, ShieldCheck, Users2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import SummaryApi from "../api/SummaryApi";
import { extractEventItem } from "../lib/backendAdapters";

const normalizeId = (value) => String(value || "").trim();

const parseRegistrationRows = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.registrations)) return payload.registrations;
  if (Array.isArray(payload?.data?.registrations)) return payload.data.registrations;
  return [];
};

const parseAttendanceToken = (rawValue) => {
  const value = String(rawValue || "").trim();
  if (!value) return "";

  try {
    const parsedUrl = new URL(value);
    const queryToken = String(parsedUrl.searchParams.get("token") || "").trim();
    if (queryToken) return queryToken;

    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    const attendanceIndex = parts.findIndex((item) => item.toLowerCase() === "attendance");
    if (attendanceIndex >= 0 && parts[attendanceIndex + 1]) {
      return decodeURIComponent(parts[attendanceIndex + 1]);
    }

    return decodeURIComponent(parts[parts.length - 1] || "");
  } catch {
    return value.replace(/^.*\/attendance\//i, "").trim();
  }
};

const resolveRowToken = (row) => {
  const direct = String(row?.qr?.token || row?.qr?.attendanceToken || "").trim();
  if (direct) return direct;

  const qrImageUrl = String(row?.qr?.qrImageUrl || "").trim();
  if (!qrImageUrl) return "";

  const fromQuery = qrImageUrl.match(/[?&]token=([^&]+)/i)?.[1];
  if (fromQuery) return decodeURIComponent(fromQuery);

  const fromPath = qrImageUrl.match(/\/attendance\/([^/?#]+)/i)?.[1];
  if (fromPath) return decodeURIComponent(fromPath);

  return "";
};

const mapRegistrationRow = (row) => ({
  id: normalizeId(row?._id || row?.id),
  participantName:
    row?.participantName ||
    row?.studentName ||
    row?.student?.fullName ||
    row?.student?.name ||
    row?.user?.fullName ||
    row?.user?.name ||
    "Participant",
  participantEmail: row?.student?.email || row?.user?.email || row?.participantEmail || "",
  totalParticipants: Number(row?.totalParticipants || 1),
  status: String(row?.status || "").trim() || "Pending",
  attendanceMarked: Boolean(row?.qr?.attendanceMarked),
  token: resolveRowToken(row),
});

const formatDate = (value) => {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
};

export default function OrganizerEventScanQR() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [eventData, setEventData] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const safeEventId = encodeURIComponent(normalizeId(eventData?._id) || eventId || "");

  const load = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const [detailResponse, registrationResponse] = await Promise.all([
        api({
          ...SummaryApi.get_public_event_details,
          url: SummaryApi.get_public_event_details.url.replace(":eventId", encodeURIComponent(eventId || "")),
        }),
        api({
          ...SummaryApi.get_event_registrations,
          url: SummaryApi.get_event_registrations.url.replace(":eventId", encodeURIComponent(eventId || "")),
        }),
      ]);

      const event = extractEventItem(detailResponse.data);
      const rows = parseRegistrationRows(registrationResponse.data).map(mapRegistrationRow);

      if (!event) {
        setError("Event not found.");
        setEventData(null);
        setRegistrations([]);
        return;
      }

      setEventData(event);
      setRegistrations(rows);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Unable to load event scan dashboard.");
      setEventData(null);
      setRegistrations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const marked = registrations.filter((row) => row.attendanceMarked).length;
    const pending = Math.max(0, total - marked);
    const teams = registrations.reduce((sum, row) => sum + Number(row.totalParticipants || 1), 0);
    return { total, marked, pending, teams };
  }, [registrations]);

  const handleMarkAttendance = async (event) => {
    event.preventDefault();
    const token = parseAttendanceToken(tokenInput);

    if (!token) {
      setMessage({ type: "error", text: "Paste a valid attendance token or attendance URL." });
      return;
    }

    setMarking(true);
    setMessage(null);
    try {
      const response = await api({
        ...SummaryApi.mark_attendance_by_token,
        url: SummaryApi.mark_attendance_by_token.url.replace(":token", encodeURIComponent(token)),
      });

      setMessage({ type: "success", text: response.data?.message || "Attendance marked successfully." });
      setTokenInput("");
      await load({ silent: true });
    } catch (attendanceError) {
      setMessage({
        type: "error",
        text: attendanceError.response?.data?.message || "Unable to mark attendance for this token.",
      });
    } finally {
      setMarking(false);
    }
  };

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
            Loading scan workspace...
          </section>
        )}

        {error && !loading && (
          <section className="eventmate-panel rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300">
            {error}
          </section>
        )}

        {!loading && !error && eventData && (
          <>
            <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Scan QR - {eventData?.title || "Event"}</h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {formatDate(eventData?.schedule?.startDate)} | {eventData?.venue?.location || "Venue TBD"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => load({ silent: true })}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/organizer-dashboard/event/${safeEventId}/details`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/30 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
                  >
                    <CalendarDays size={15} />
                    Event Details
                  </button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <article className="eventmate-kpi rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Registrations</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </article>
              <article className="eventmate-kpi rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Attendance Marked</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.marked}</p>
              </article>
              <article className="eventmate-kpi rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Pending</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
              </article>
              <article className="eventmate-kpi rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Participants Scope</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.teams}</p>
              </article>
            </section>

            <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mark Attendance</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  <QrCode size={12} />
                  Paste token or attendance URL
                </span>
              </div>

              <form onSubmit={handleMarkAttendance} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="Paste token or attendance URL"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={marking}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
                >
                  {marking ? <Loader2 size={14} className="animate-spin" /> : null}
                  {marking ? "Marking..." : "Mark Attendance"}
                </button>
              </form>

              {message && (
                <p
                  className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"
                  }`}
                >
                  {message.text}
                </p>
              )}
            </section>

            <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Registration Queue</h2>

              <div className="mt-4 overflow-x-auto">
                {registrations.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No registrations found for this event yet.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <th className="pb-3 pr-4">Participant</th>
                        <th className="pb-3 pr-4">Email</th>
                        <th className="pb-3 pr-4">Team Size</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                      {registrations.map((row) => (
                        <tr key={row.id || `${row.participantName}-${row.participantEmail}`}>
                          <td className="py-3 pr-4 text-slate-800 dark:text-slate-100">{row.participantName}</td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{row.participantEmail || "N/A"}</td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{row.totalParticipants}</td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{row.status}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                row.attendanceMarked
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                              }`}
                            >
                              {row.attendanceMarked ? <ShieldCheck size={12} /> : <Users2 size={12} />}
                              {row.attendanceMarked ? "Marked" : "Pending"}
                            </span>
                            {!row.attendanceMarked && row.token && (
                              <button
                                type="button"
                                onClick={() => setTokenInput(row.token)}
                                className="ml-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
                              >
                                Use token
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
