import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { getStoredUser } from "../../lib/auth";
import { logoutUser } from "../../lib/logout";
import SummaryApi from "../../common/SummaryApi";
import EventCreator from "../../components/EventCreator";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api({ ...SummaryApi.get_all_users });
      setUsers(response.data?.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

  const handleToggleActive = async (userId, isActive) => {
    setMessage(null);
    setPendingId(userId);
    try {
      const response = await api({
        ...SummaryApi.update_user,
        url: SummaryApi.update_user.url.replace(":id", userId),
        data: { isActive: !isActive },
      });
      const updatedUser = response.data?.user;
      setUsers((prev) => prev.map((item) => (item._id === userId ? updatedUser : item)));
      setMessage({ type: "success", text: "User updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Unable to update user." });
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    setMessage(null);
    setPendingId(userId);
    try {
      await api({
        ...SummaryApi.delete_user,
        url: SummaryApi.delete_user.url.replace(":id", userId),
      });
      setUsers((prev) => prev.filter((item) => item._id !== userId));
      setMessage({ type: "success", text: "User deleted." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Unable to delete user." });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
            <p className="text-sm text-gray-500">Manage users and access levels.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user?.fullName || "Main Admin"}</p>
              <p className="text-xs text-gray-500">{user?.email || "admin@eventmate.com"}</p>
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

      <main className="max-w-6xl mx-auto px-6 py-10">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">User Directory</h2>
              <p className="text-sm text-gray-500 mt-1">Total users: {users.length}</p>
            </div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {message && (
            <p
              className={`mt-4 text-sm text-center rounded-lg py-2 ${
                message.type === "success"
                  ? "text-green-700 bg-green-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {message.text}
            </p>
          )}

          {loading && <p className="mt-6 text-sm text-gray-500">Loading users...</p>}
          {error && !loading && <p className="mt-6 text-sm text-red-600">{error}</p>}

          {!loading && !error && (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Verified</th>
                    <th className="pb-3 pr-4">Active</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((item) => (
                    <tr key={item._id} className="text-gray-700">
                      <td className="py-3 pr-4 font-medium text-gray-900">{item.fullName}</td>
                      <td className="py-3 pr-4">{item.email}</td>
                      <td className="py-3 pr-4">{item.role}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.emailVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                          {item.emailVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.isActive ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 space-x-2">
                        <button
                          onClick={() => handleToggleActive(item._id, item.isActive)}
                          disabled={pendingId === item._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          disabled={pendingId === item._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <p className="mt-6 text-sm text-gray-500">No users found.</p>
              )}
            </div>
          )}
        </section>

        <div className="mt-8">
          <EventCreator title="Create Event" subtitle="Admins can create draft events alongside user management." />
        </div>
      </main>
    </div>
  );
}
