import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { apiClient } from "../api/client";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useStore((state) => state.setAuth);
  const logoutStore = useStore((state) => state.logout);
  const navigate = useNavigate();

  const login = async (payload: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post("/auth/login", payload);
      const { user, token } = res.data.data;
      setAuth(user, res.data.token || token);
      navigate("/browse");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "The authorization handshake failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post("/auth/register", payload);
      const { user, token } = res.data.data;
      setAuth(user, res.data.token || token);
      navigate("/browse");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Profile initialization aborted.",
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutStore();
    navigate("/login");
  };

  return { login, register, logout, loading, error };
};
