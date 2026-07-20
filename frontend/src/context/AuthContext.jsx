import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiError, setForcedLogoutHandler } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { toast } from "sonner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem("jp_token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      localStorage.removeItem("jp_token");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Wire the global 401 handler once
  useEffect(() => {
    setForcedLogoutHandler((reason) => {
      localStorage.removeItem("jp_token");
      setUser(null);
      // Delay to let React finish current render
      setTimeout(() => toast.error(reason || "Session ended"), 0);
    });
    return () => setForcedLogoutHandler(null);
  }, []);

  const login = async (mobile, password) => {
    try {
      const { data } = await api.post("/auth/login", {
        mobile,
        password,
        device_id: getDeviceId(),
      });
      localStorage.setItem("jp_token", data.token);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, error: formatApiError(e) };
    }
  };

  const register = async (mobile, name, password) => {
    try {
      const { data } = await api.post("/auth/register", {
        mobile,
        name,
        password,
        device_id: getDeviceId(),
      });
      localStorage.setItem("jp_token", data.token);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, error: formatApiError(e) };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("jp_token");
    setUser(null);
  };

  const refresh = bootstrap;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
