import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";

export default function AdminDashboard() {
  const { request } = useApp();
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState({ userId: "", payload: "" });
  const [deleteId, setDeleteId] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    const response = await request("/api/admin/users", { auth: true });
    if (response.ok) {
      setUsers(response.data?.users || []);
      setStatus(null);
    } else {
      setStatus({ type: "error", message: response.data?.message || "Unable to fetch users" });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    let payload = {};
    try {
      payload = updateForm.payload ? JSON.parse(updateForm.payload) : {};
    } catch {
      setStatus({ type: "error", message: "Payload must be valid JSON." });
      setLoading(false);
      return;
    }

    const response = await request(`/api/admin/users/${updateForm.userId}`, {
      method: "PUT",
      body: payload,
      auth: true
    });

    if (response.ok) {
      setStatus({ type: "success", message: "User updated." });
      loadUsers();
    } else {
      setStatus({ type: "error", message: response.data?.message || "Update failed" });
    }

    setLoading(false);
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const response = await request(`/api/admin/users/${deleteId}`, {
      method: "DELETE",
      auth: true
    });

    if (response.ok) {
      setStatus({ type: "success", message: "User deleted." });
      loadUsers();
    } else {
      setStatus({ type: "error", message: response.data?.message || "Delete failed" });
    }

    setLoading(false);
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="muted">Manage users, roles, and account access.</p>
        </div>
        <button className="btn ghost" onClick={loadUsers} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Users"}
        </button>
      </div>

      {status && <div className={`alert ${status.type}`}>{status.message}</div>}

      <div className="grid two">
        <div className="card">
          <h3>Users</h3>
          <div className="table">
            <div className="table-row head">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
            </div>
            {users.map((user) => (
              <div className="table-row" key={user._id}>
                <span>{user.fullName}</span>
                <span>{user.email}</span>
                <span>{user.role}</span>
              </div>
            ))}
            {!users.length && <p className="muted">No users found.</p>}
          </div>
        </div>

        <div className="card">
          <h3>Update User</h3>
          <form onSubmit={handleUpdate}>
            <label>User ID</label>
            <input
              value={updateForm.userId}
              onChange={(event) => setUpdateForm((prev) => ({ ...prev, userId: event.target.value }))}
              required
            />
            <label>Payload (JSON)</label>
            <textarea
              value={updateForm.payload}
              onChange={(event) => setUpdateForm((prev) => ({ ...prev, payload: event.target.value }))}
              placeholder='{"fullName":"Updated Name"}'
            />
            <button className="btn primary" type="submit" disabled={loading}>
              Update User
            </button>
          </form>

          <div className="divider" />

          <h3>Delete User</h3>
          <form onSubmit={handleDelete}>
            <label>User ID</label>
            <input value={deleteId} onChange={(event) => setDeleteId(event.target.value)} required />
            <button className="btn danger" type="submit" disabled={loading}>
              Delete User
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}