import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function StudentDashboard() {
  const { user } = useApp();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Student Dashboard</h2>
          <p className="muted">Welcome back{user?.fullName ? `, ${user.fullName}` : ""}.</p>
        </div>
        <Link className="btn ghost" to="/profile">
          Edit Profile
        </Link>
      </div>

      <div className="grid three">
        <div className="card">
          <h3>Profile Status</h3>
          <p className="muted">Keep your academic and professional details up to date.</p>
          <p className="highlight">{user?.emailVerified ? "Email verified" : "Email pending"}</p>
        </div>
        <div className="card">
          <h3>Upcoming Events</h3>
          <p className="muted">Your event feed will appear here once events are added.</p>
        </div>
        <div className="card">
          <h3>Security</h3>
          <p className="muted">Access tokens expire every hour. Use refresh tokens to stay signed in.</p>
        </div>
      </div>
    </section>
  );
}