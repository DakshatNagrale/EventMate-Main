import { useMemo, useState } from "react";
import Search from "../components/Search";
import api from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => {
      const title = (event?.title || "").toLowerCase();
      const category = (event?.category || "").toLowerCase();
      const description = (event?.description || "").toLowerCase();
      return title.includes(q) || category.includes(q) || description.includes(q);
    });
  }, [events, query]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api({
        ...SummaryApi.get_published_events,
        params: { page: 1, limit: 100 },
        skipAuth: true,
      });
      setEvents(response.data?.data || []);
    } catch (err) {
      setError(AxiosToastError(err, "Unable to load events"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Search Events</h1>
        <p className="text-sm text-gray-500 mt-2">Find published events by title, category, or description.</p>

        <div className="mt-6">
          <Search
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onSubmit={handleSearch}
            placeholder="Search published events"
          />
        </div>

        {loading && <p className="mt-6 text-sm text-gray-500">Loading events...</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {!loading && !error && filtered.length > 0 && (
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((event) => (
              <article key={event._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
                <p className="text-xs text-gray-500 mt-1">{event.category || "General"}</p>
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">{event.description || "No description"}</p>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && events.length > 0 && filtered.length === 0 && (
          <p className="mt-8 text-sm text-gray-500">No events matched your search.</p>
        )}
      </div>
    </section>
  );
}
