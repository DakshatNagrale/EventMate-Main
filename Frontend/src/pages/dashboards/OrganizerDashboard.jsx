import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/auth";
import { logoutUser } from "../../lib/logout";
import EventCreator from "../../components/EventCreator";

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizer Console</h1>
            <p className="text-sm text-gray-500">Monitor events and coordinate with admins.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user?.fullName || "Organizer"}</p>
              <p className="text-xs text-gray-500">{user?.email || "organizer@eventmate.com"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900">Profile Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Your organizer profile synced from the backend.</p>
            <div className="mt-6 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-gray-900">{user?.fullName || "Organizer"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold text-gray-900">{user?.email || "organizer@eventmate.com"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Role</span>
                <span className="font-semibold text-gray-900">{user?.role || "ORGANIZER"}</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900">Next Steps</h2>
            <p className="text-sm text-gray-500 mt-1">Organizer tools will be wired once event APIs are ready.</p>
            <ul className="mt-5 space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                Coordinate event creation flow with the admin team.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                Request access to student coordinator management endpoints.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                Share event requirements to enable registrations and attendance tracking.
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-8">
          <EventCreator title="Create Event" subtitle="Organizers can create draft events with posters and schedules." />
        </div>
      </main>
    </div>
  );
}
