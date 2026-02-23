export const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000"; // EventMate backend

const SummaryApi = {
  /* ================= AUTH ================= */
  register: {
    url: "/api/auth/register",
    method: "post",
  },

  verify_email: {
    url: "/api/auth/verify-email",
    method: "post",
  },

  login: {
    url: "/api/auth/login",
    method: "post",
  },

  logout: {
    url: "/api/auth/logout",
    method: "post",
  },

  refresh_token: {
    url: "/api/auth/refresh-token",
    method: "post",
  },

  /* ================= USER ================= */
  get_profile: {
    url: "/api/user/profile",
    method: "get",
  },

  update_profile: {
    url: "/api/user/profile",
    method: "put",
  },

  upload_avatar: {
    url: "/api/user/avatar",
    method: "post",
  },

  forgot_password: {
    url: "/api/user/forgot-password",
    method: "post",
  },

  reset_password: {
    url: "/api/user/reset-password",
    method: "post",
  },

  /* ================= EVENTS ================= */
  create_event: {
    url: "/api/events",
    method: "post",
  },

  /* ================= ADMIN ================= */
  get_all_users: {
    url: "/api/admin/users",
    method: "get",
  },

  update_user: {
    url: "/api/admin/users/:id",
    method: "put",
  },

  delete_user: {
    url: "/api/admin/users/:id",
    method: "delete",
  },
};

export default SummaryApi;
