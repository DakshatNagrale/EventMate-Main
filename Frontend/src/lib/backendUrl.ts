const trimTrailingSlash = (value) => String(value || "").trim().replace(/\/+$/, "");

const getFallbackBaseUrl = () => {
  const backendPort = String(import.meta.env.VITE_BACKEND_PORT || "5000").trim() || "5000";

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol || "http:";
    const hostname = window.location.hostname || "localhost";
    return `${protocol}//${hostname}:${backendPort}`;
  }

  return `http://localhost:${backendPort}`;
};

export const API_BASE_URL =
  trimTrailingSlash(import.meta.env.VITE_API_URL) || getFallbackBaseUrl();