import { useNavigate } from "react-router-dom"
import { getStoredUser } from "../../lib/auth"
import { logoutUser } from "../../lib/logout"

export default function CoordinatorDashboard() {
  const navigate = useNavigate()
  const user = getStoredUser()

  const handleLogout = async () => {
    await logoutUser()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
            <p className="text-sm text-gray-500">Manage student participation and assist events.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user?.fullName || "Coordinator"}</p>
              <p className="text-xs text-gray-500">{user?.email || "coordinator@eventmate.com"}</p>
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

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-600 mt-2">
            Event management tools will appear here once event and attendance APIs are connected.
          </p>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              { label: "Events Assigned", value: "0" },
              { label: "Students Checked In", value: "0" },
              { label: "Certificates Issued", value: "0" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
