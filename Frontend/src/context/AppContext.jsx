import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const AppContext = createContext(null);
const defaultBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parseJson = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const normalizeBase = (value = "") => value.trim().replace(/\/+$/, "");

export function AppProvider({ children }) {
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem("eventmate_api") || defaultBaseUrl);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("eventmate_access") || "");
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("eventmate_refresh") || "");
  const [role, setRole] = useState(() => localStorage.getItem("eventmate_role") || "");
  const [user, setUser] = useState(() => safeParse(localStorage.getItem("eventmate_user")));
  const refreshInFlight = useRef(null);

  useEffect(() => {
    localStorage.setItem("eventmate_api", baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    localStorage.setItem("eventmate_access", accessToken || "");
  }, [accessToken]);

  useEffect(() => {
    localStorage.setItem("eventmate_refresh", refreshToken || "");
  }, [refreshToken]);

  useEffect(() => {
    localStorage.setItem("eventmate_role", role || "");
  }, [role]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("eventmate_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("eventmate_user");
    }
  }, [user]);

  const performRequest = async (path, options = {}, tokenOverride) => {
    const { method = "GET", body, auth = false, isForm = false } = options;
    const normalized = normalizeBase(baseUrl || defaultBaseUrl);
    const url = `${normalized}${path}`;

    const headers = {};
    const authToken = tokenOverride || accessToken;
    if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;
    if (!isForm && body !== undefined && method !== "GET") headers["Content-Type"] = "application/json";

    const fetchOptions = { method, headers, credentials: "include" };
    if (body !== undefined && method !== "GET") {
      fetchOptions.body = isForm ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      const text = await response.text();
      const data = parseJson(text);
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      return { ok: false, status: "network", data: { message: error.message } };
    }
  };

  const refreshSession = async () => {
    if (!refreshToken) return null;
    if (refreshInFlight.current) return refreshInFlight.current;

    refreshInFlight.current = (async () => {
      const response = await performRequest("/api/auth/refresh-token", {
        method: "POST",
        body: { refreshToken }
      });

      if (!response.ok) {
        clearAuth();
        return null;
      }

      const nextAccess = response.data?.accessToken || "";
      const nextRefresh = response.data?.refreshToken || "";
      setTokens(nextAccess, nextRefresh);
      return nextAccess || null;
    })();

    const token = await refreshInFlight.current;
    refreshInFlight.current = null;
    return token;
  };

  const request = async (path, options = {}) => {
    const { auth = false, token } = options;
    let tokenOverride = token;

    if (auth && !tokenOverride && !accessToken && refreshToken) {
      tokenOverride = await refreshSession();
    }

    let response = await performRequest(path, options, tokenOverride);

    if (auth && response.status === 401 && refreshToken) {
      const nextToken = await refreshSession();
      if (nextToken) {
        response = await performRequest(path, options, nextToken);
      }
    }

    return response;
  };

  const setTokens = (nextAccess, nextRefresh) => {
    setAccessToken(nextAccess || "");
    setRefreshToken(nextRefresh || "");
  };

  const clearAuth = () => {
    setAccessToken("");
    setRefreshToken("");
    setRole("");
    setUser(null);
  };

  const logout = async () => {
    if (accessToken) {
      await request("/api/auth/logout", { method: "POST", auth: true });
    }
    clearAuth();
  };

  const value = useMemo(
    () => ({
      baseUrl,
      setBaseUrl,
      accessToken,
      refreshToken,
      role,
      setRole,
      user,
      setUser,
      request,
      setTokens,
      clearAuth,
      logout,
      isAuthenticated: !!accessToken
    }),
    [baseUrl, accessToken, refreshToken, role, user]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
