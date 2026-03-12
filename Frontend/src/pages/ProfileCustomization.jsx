import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { getStoredUser } from "../lib/auth";

const ROLE_PROFILE_PATHS = {
  MAIN_ADMIN: "/profile",
  ORGANIZER: "/organizer-dashboard/profile",
  STUDENT_COORDINATOR: "/coordinator-dashboard/profile",
  STUDENT: "/profile",
};

export default function ProfileCustomization() {
  const user = getStoredUser();
  const profilePath = ROLE_PROFILE_PATHS[user?.role] || "/profile";

  return (
    <section className="eventmate-page min-h-screen bg-slate-100/80 dark:bg-gray-900 px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Avatar Customization Removed</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Avatar frames and customization options have been removed from EventMate.
          </p>
          <Link
            to={profilePath}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <ArrowLeft size={14} />
            Back to Profile
          </Link>
        </div>
      </div>
    </section>
  );
}
