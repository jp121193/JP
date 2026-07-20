import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jp_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback set by AuthContext to handle a global "kicked out" event.
let onForcedLogout = null;
export function setForcedLogoutHandler(fn) {
  onForcedLogout = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail;
    // Ignore the initial /auth/me bootstrap (no token yet) and login/register failures.
    const url = error?.config?.url || "";
    const isAuthPost = url.includes("/auth/login") || url.includes("/auth/register");
    if (status === 401 && !isAuthPost && localStorage.getItem("jp_token")) {
      const reason = typeof detail === "string" ? detail : "Session ended";
      if (onForcedLogout) onForcedLogout(reason);
    }
    return Promise.reject(error);
  }
);

export function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
