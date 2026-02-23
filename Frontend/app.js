const state = {
  apiBase: "",
  accessToken: "",
  refreshToken: "",
  role: "",
  frontendOrigin: ""
};

const roles = {
  event: ["MAIN_ADMIN", "ORGANIZER"],
  admin: ["MAIN_ADMIN"]
};

const $ = (id) => document.getElementById(id);

const elements = {
  apiForm: $("apiForm"),
  apiBase: $("apiBase"),
  frontendOrigin: $("frontendOrigin"),
  statusBadge: $("statusBadge"),
  statusMessage: $("statusMessage"),
  roleValue: $("roleValue"),
  accessValue: $("accessValue"),
  refreshValue: $("refreshValue"),
  latestResponse: $("latestResponse"),
  profileResponse: $("profileResponse"),
  eventForm: $("eventForm"),
  eventGuard: $("eventGuard"),
  adminGuard: $("adminGuard"),
  adminPanel: $("adminPanel"),
  eventPanel: $("eventPanel"),
  userTableBody: $("userTableBody")
};

function loadState() {
  state.apiBase = localStorage.getItem("eventmate_api") || "http://localhost:5000";
  state.accessToken = localStorage.getItem("eventmate_access") || "";
  state.refreshToken = localStorage.getItem("eventmate_refresh") || "";
  state.role = localStorage.getItem("eventmate_role") || "";
  state.frontendOrigin = localStorage.getItem("eventmate_origin") || window.location.origin;
}

function saveState() {
  localStorage.setItem("eventmate_api", state.apiBase);
  localStorage.setItem("eventmate_access", state.accessToken);
  localStorage.setItem("eventmate_refresh", state.refreshToken);
  localStorage.setItem("eventmate_role", state.role || "");
  localStorage.setItem("eventmate_origin", state.frontendOrigin);
}

function truncateToken(token) {
  if (!token) return "Not set";
  if (token.length <= 24) return token;
  return `${token.slice(0, 14)}...${token.slice(-6)}`;
}

function updateSessionUI() {
  elements.apiBase.value = state.apiBase;
  elements.frontendOrigin.value = state.frontendOrigin;
  elements.roleValue.textContent = state.role || "Guest";
  elements.accessValue.textContent = truncateToken(state.accessToken);
  elements.refreshValue.textContent = truncateToken(state.refreshToken);

  const canCreateEvent = roles.event.includes(state.role);
  const canAdmin = roles.admin.includes(state.role);

  elements.eventForm.classList.toggle("hidden", !canCreateEvent);
  elements.eventGuard.classList.toggle("hidden", canCreateEvent);
  elements.adminPanel.querySelector(".card").classList.toggle("hidden", !canAdmin);
  elements.adminGuard.classList.toggle("hidden", canAdmin);
}

function setStatus(message, type = "info") {
  elements.statusMessage.textContent = message;
  elements.statusBadge.textContent = type === "success" ? "Success" : type === "error" ? "Error" : "Info";
  elements.statusBadge.classList.remove("success", "error");
  if (type === "success") elements.statusBadge.classList.add("success");
  if (type === "error") elements.statusBadge.classList.add("error");
}

function setLatestResponse(payload) {
  elements.latestResponse.textContent = payload ? JSON.stringify(payload, null, 2) : "No response yet.";
}

function setProfileResponse(payload) {
  elements.profileResponse.textContent = payload ? JSON.stringify(payload, null, 2) : "No profile loaded yet.";
}

function buildUrl(path) {
  const base = state.apiBase.replace(/\/$/, "");
  return `${base}${path}`;
}

async function refreshAccessToken() {
  if (!state.refreshToken) return false;
  const res = await fetch(buildUrl("/api/auth/refresh-token"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: state.refreshToken })
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.accessToken) {
    state.accessToken = data.accessToken;
    state.refreshToken = data.refreshToken || state.refreshToken;
    saveState();
    updateSessionUI();
    return true;
  }
  return false;
}

async function request(path, { method = "GET", body, auth = false, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth && state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok && response.status === 401 && auth && state.refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, { method, body, auth, isForm });
    }
  }

  return { ok: response.ok, status: response.status, data };
}

function handleResponse(result, successMessage) {
  setLatestResponse(result.data);
  if (result.ok) {
    setStatus(successMessage || "Request successful.", "success");
  } else {
    const message = result.data?.message || result.data?.errors?.join(" ") || "Request failed.";
    setStatus(message, "error");
  }
}

function collectProfileUpdate() {
  const payload = {};
  const fullName = $("profileName").value.trim();
  const mobileNumber = $("profileMobile").value.trim();
  const collegeName = $("profileCollege").value.trim();
  const branch = $("profileBranch").value.trim();
  const year = $("profileYear").value;
  const department = $("profileDepartment").value.trim();
  const occupation = $("profileOccupation").value.trim();

  if (fullName) payload.fullName = fullName;
  if (mobileNumber) payload.mobileNumber = mobileNumber;
  if (collegeName) payload.collegeName = collegeName;

  const academicProfile = {};
  if (branch) academicProfile.branch = branch;
  if (year) academicProfile.year = year;
  if (Object.keys(academicProfile).length) payload.academicProfile = academicProfile;

  const professionalProfile = {};
  if (department) professionalProfile.department = department;
  if (occupation) professionalProfile.occupation = occupation;
  if (Object.keys(professionalProfile).length) payload.professionalProfile = professionalProfile;

  return payload;
}

function buildEventPayload() {
  const title = $("eventTitle").value.trim();
  const description = $("eventDescription").value.trim();
  const category = $("eventCategory").value;
  const posterFile = $("eventPoster").files[0];

  if (!title || !category || !posterFile) {
    return { error: "Title, category, and poster are required." };
  }

  const venueMode = $("venueMode").value;
  const venueLocation = $("venueLocation").value.trim();
  const venueMap = $("venueMap").value.trim();

  const scheduleStartDate = $("scheduleStartDate").value;
  const scheduleEndDate = $("scheduleEndDate").value;
  const scheduleStartTime = $("scheduleStartTime").value;
  const scheduleEndTime = $("scheduleEndTime").value;

  const registrationOpen = $("registrationOpen").checked;
  const registrationLastDate = $("registrationLastDate").value;
  const registrationMax = $("registrationMax").value;
  const registrationFee = $("registrationFee").value;

  const certificateEnabled = $("certificateEnabled").checked;
  const feedbackEnabled = $("feedbackEnabled").checked;

  const venue = {};
  if (venueMode) venue.mode = venueMode;
  if (venueLocation) venue.location = venueLocation;
  if (venueMap) venue.googleMapLink = venueMap;

  const schedule = {};
  if (scheduleStartDate) schedule.startDate = scheduleStartDate;
  if (scheduleEndDate) schedule.endDate = scheduleEndDate;
  if (scheduleStartTime) schedule.startTime = scheduleStartTime;
  if (scheduleEndTime) schedule.endTime = scheduleEndTime;

  const registration = { isOpen: registrationOpen };
  if (registrationLastDate) registration.lastDate = registrationLastDate;
  if (registrationMax) registration.maxParticipants = Number(registrationMax);
  if (registrationFee) registration.fee = Number(registrationFee);

  const certificate = { isEnabled: certificateEnabled };
  const feedback = { enabled: feedbackEnabled };

  const formData = new FormData();
  formData.append("poster", posterFile);
  formData.append("title", title);
  formData.append("category", category);
  if (description) formData.append("description", description);
  if (Object.keys(venue).length) formData.append("venue", JSON.stringify(venue));
  if (Object.keys(schedule).length) formData.append("schedule", JSON.stringify(schedule));
  formData.append("registration", JSON.stringify(registration));
  formData.append("certificate", JSON.stringify(certificate));
  formData.append("feedback", JSON.stringify(feedback));

  return { formData };
}

function renderUsers(users) {
  if (!users?.length) {
    elements.userTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="muted">No users found.</td>
      </tr>
    `;
    return;
  }

  elements.userTableBody.innerHTML = "";
  users.forEach((user) => {
    const row = document.createElement("tr");
    row.dataset.id = user._id;
    row.innerHTML = `
      <td>
        <div>${user.fullName || "Unnamed"}</div>
        <div class="muted" style="font-size: 0.75rem;">${user._id}</div>
      </td>
      <td>${user.email || ""}</td>
      <td>${user.role || ""}</td>
      <td>
        <label class="switch">
          <input type="checkbox" data-action="toggle" ${user.isActive ? "checked" : ""} />
          <span>${user.isActive ? "Active" : "Inactive"}</span>
        </label>
      </td>
      <td>
        <button class="btn small" data-action="update">Update</button>
        <button class="btn small ghost" data-action="delete">Delete</button>
      </td>
    `;
    elements.userTableBody.appendChild(row);
  });
}

function clearSession() {
  state.accessToken = "";
  state.refreshToken = "";
  state.role = "";
  saveState();
  updateSessionUI();
  setStatus("Session cleared.", "info");
}

async function init() {
  loadState();
  updateSessionUI();

  elements.apiForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.apiBase = elements.apiBase.value.trim() || state.apiBase;
    state.frontendOrigin = elements.frontendOrigin.value.trim() || state.frontendOrigin;
    saveState();
    updateSessionUI();
    setStatus("API settings saved.", "success");
  });

  $("btnPing").addEventListener("click", async () => {
    const result = await request("/");
    handleResponse(result, "Backend reachable.");
  });

  $("btnClearSession").addEventListener("click", clearSession);

  $("btnCopyAccess").addEventListener("click", async () => {
    if (!state.accessToken) return setStatus("No access token to copy.", "error");
    try {
      await navigator.clipboard.writeText(state.accessToken);
      setStatus("Access token copied.", "success");
    } catch {
      setStatus("Clipboard unavailable. Copy manually from the session panel.", "error");
    }
  });

  $("btnCopyRefresh").addEventListener("click", async () => {
    if (!state.refreshToken) return setStatus("No refresh token to copy.", "error");
    try {
      await navigator.clipboard.writeText(state.refreshToken);
      setStatus("Refresh token copied.", "success");
    } catch {
      setStatus("Clipboard unavailable. Copy manually from the session panel.", "error");
    }
  });

  $("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      fullName: $("regName").value.trim(),
      email: $("regEmail").value.trim(),
      password: $("regPassword").value
    };
    const result = await request("/api/auth/register", { method: "POST", body: payload });
    handleResponse(result, "Registration successful. Check email for OTP.");
  });

  $("verifyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      email: $("verifyEmail").value.trim(),
      otp: $("verifyOtp").value.trim()
    };
    const result = await request("/api/auth/verify-email", { method: "POST", body: payload });
    handleResponse(result, "Email verified successfully.");
  });

  $("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      email: $("loginEmail").value.trim(),
      password: $("loginPassword").value
    };
    const result = await request("/api/auth/login", { method: "POST", body: payload });
    handleResponse(result, "Login successful.");
    if (result.ok) {
      state.accessToken = result.data.accessToken || "";
      state.refreshToken = result.data.refreshToken || "";
      state.role = result.data.role || "";
      saveState();
      updateSessionUI();
    }
  });

  $("btnRefreshToken").addEventListener("click", async () => {
    const result = await request("/api/auth/refresh-token", {
      method: "POST",
      body: { refreshToken: state.refreshToken }
    });
    handleResponse(result, "Token refreshed.");
    if (result.ok) {
      state.accessToken = result.data.accessToken || state.accessToken;
      state.refreshToken = result.data.refreshToken || state.refreshToken;
      saveState();
      updateSessionUI();
    }
  });

  $("btnLogout").addEventListener("click", async () => {
    const result = await request("/api/auth/logout", { method: "POST", auth: true });
    handleResponse(result, "Logged out.");
    if (result.ok) clearSession();
  });

  $("btnLoadProfile").addEventListener("click", async () => {
    const result = await request("/api/user/profile", { auth: true });
    handleResponse(result, "Profile loaded.");
    if (result.ok) setProfileResponse(result.data);
  });

  $("profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = collectProfileUpdate();
    const result = await request("/api/user/profile", { method: "PUT", auth: true, body: payload });
    handleResponse(result, "Profile updated.");
    if (result.ok) setProfileResponse(result.data);
  });

  $("avatarForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = $("avatarFile").files[0];
    if (!file) return setStatus("Select an avatar file.", "error");
    const formData = new FormData();
    formData.append("avatar", file);
    const result = await request("/api/user/avatar", { method: "POST", auth: true, isForm: true, body: formData });
    handleResponse(result, "Avatar uploaded.");
  });

  $("forgotForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = { email: $("forgotEmail").value.trim() };
    const result = await request("/api/user/forgot-password", { method: "POST", auth: true, body: payload });
    handleResponse(result, "OTP sent to email.");
  });

  $("resetForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      email: $("resetEmail").value.trim(),
      otp: $("resetOtp").value.trim(),
      newPassword: $("resetPassword").value
    };
    const result = await request("/api/user/reset-password", { method: "POST", auth: true, body: payload });
    handleResponse(result, "Password reset request sent.");
  });

  elements.eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = buildEventPayload();
    if (payload.error) return setStatus(payload.error, "error");

    const result = await request("/api/events", { method: "POST", auth: true, isForm: true, body: payload.formData });
    handleResponse(result, "Event created.");
  });

  $("btnLoadUsers").addEventListener("click", async () => {
    const result = await request("/api/admin/users", { auth: true });
    handleResponse(result, "Users loaded.");
    if (result.ok) renderUsers(result.data.users || []);
  });

  elements.userTableBody.addEventListener("click", async (event) => {
    const action = event.target.dataset.action;
    if (!action) return;
    const row = event.target.closest("tr");
    if (!row) return;
    const userId = row.dataset.id;
    if (!userId) return;

    if (action === "delete") {
      const result = await request(`/api/admin/users/${userId}`, { method: "DELETE", auth: true });
      handleResponse(result, "User deleted.");
      if (result.ok) row.remove();
    }

    if (action === "update") {
      const toggle = row.querySelector("input[data-action='toggle']");
      const payload = { isActive: toggle ? toggle.checked : true };
      const result = await request(`/api/admin/users/${userId}`, { method: "PUT", auth: true, body: payload });
      handleResponse(result, "User updated.");
    }
  });
}

init();
