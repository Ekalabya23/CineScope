import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { apiClient } from "../api/client";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setAuth = useStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/auth/login", {
        email,
        password,
      });
      setAuth(res.data.data.user, res.data.token);
      navigate("/browse");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Authentication sequence failed.",
      );
    }
  };

  return (
    <div className="h-screen w-full bg-[#0b0c10] flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.08)_0,transparent_65%)]" />
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 shadow-2xl">
        <h2 className="text-3xl font-black text-center text-white mb-2 tracking-tight">
          Access CineScope
        </h2>
        <p className="text-center text-xs text-zinc-400 mb-6">
          Enter system credentials to resume entertainment streams.
        </p>

        {error && (
          <div className="bg-red-900/40 border border-red-600/40 text-red-200 text-xs p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">
              Email Interface Endpoint
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">
              Secured Cipher Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-sm transition mt-2 shadow-lg tracking-wide uppercase"
          >
            Initialize Access Session
          </button>
        </form>
        <p className="text-center text-xs text-zinc-400 mt-6">
          New to the node network?{" "}
          <Link
            to="/register"
            className="text-red-500 font-semibold hover:underline"
          >
            Register Channel
          </Link>
        </p>
      </div>
    </div>
  );
};
