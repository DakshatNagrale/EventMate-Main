import { Link } from "react-router-dom";

export default function Settings() {
  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-2">
          Settings will be available soon. You can update your personal details in the profile page.
        </p>
        <Link
          to="/profile"
          className="inline-flex mt-6 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Go to Profile
        </Link>
      </div>
    </section>
  );
}
