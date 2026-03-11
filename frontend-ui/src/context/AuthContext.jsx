import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load — validate stored token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Try to verify the token is still valid
    api.get("/api/auth/me")
      .then(res => {
        setUser({
          username: res.data.username,
          role:     res.data.role || "Admin",
          id:       res.data.id,
        });
      })
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.post("/api/auth/login", { username, password });
    const { access_token, refresh_token, user: userData } = res.data;

    localStorage.setItem("access_token",  access_token);
    if (refresh_token) {
      localStorage.setItem("refresh_token", refresh_token);
    }

    setUser({
      username: userData?.username || username,
      role:     userData?.role     || "Admin",
      id:       userData?.id,
    });
  }, []);

  const logout = useCallback(() => {
    // Try to hit logout endpoint (revoke token server-side)
    api.post("/api/auth/logout").catch(() => {});
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};