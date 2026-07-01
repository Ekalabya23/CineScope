import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useCinematicTheme } from "../context/CinematicThemeContext";
import { moodShortcuts } from "../theme/cinematicTheme";
import {
  Home,
  Compass,
  Film,
  Map as MapIcon,
  Sparkles,
  Search,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout, isReelPlaying } = useStore();
  const { mood, theme } = useCinematicTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const profileInitial = user?.name?.slice(0, 1)?.toUpperCase() || "C";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        animate={{
          background: scrolled
            ? `linear-gradient(135deg, rgba(10,12,18,.45), rgba(5,6,9,.40)), ${theme.gradient}`
            : `linear-gradient(135deg, rgba(10,12,18,.2), rgba(5,6,9,.1)), ${theme.gradient}`,
          boxShadow: scrolled
            ? `0 20px 40px rgba(0,0,0,.6), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(255,255,255,0.05), 0 0 30px ${theme.glow}50`
            : `0 10px 30px rgba(0,0,0,.4), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 32px ${theme.glow}00`,
          borderColor: scrolled
            ? "rgba(255,255,255,.15)"
            : "rgba(255,255,255,.08)",
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`fixed left-0 right-0 top-0 sm:top-4 mx-auto z-50 flex h-14 sm:h-16 w-full sm:w-[98%] xl:w-[92%] max-w-[1400px] items-center justify-between sm:rounded-full border-b sm:border border-white/10 sm:border-white/15 px-4 backdrop-blur-2xl backdrop-saturate-150 lg:px-8 transition-transform duration-500 ease-out ${
          isReelPlaying ? "max-md:-translate-y-[150%]" : "max-md:translate-y-0"
        }`}
      >
        <div className="flex items-center">
          <Link
            to="/browse"
            className="text-base sm:text-xl font-black tracking-[0.18em] text-white xl:text-2xl drop-shadow-lg"
          >
            CINESCOPE
          </Link>
        </div>

        {user && (
          <div className="hidden flex-1 items-center justify-center gap-1 xl:gap-3 text-sm font-bold text-zinc-300 md:flex">
            <NavLink
              to="/browse"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${isActive ? "bg-white/10 text-white shadow-inner" : "hover:bg-white/5 hover:text-white"}`
              }
            >
              <span>🍿</span> Home
            </NavLink>
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${isActive ? "bg-white/10 text-white shadow-inner" : "hover:bg-white/5 hover:text-white"}`
              }
            >
              <span>🧭</span> Explore
            </NavLink>
            <NavLink
              to="/reels"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${isActive ? "bg-white/10 text-white shadow-inner" : "hover:bg-white/5 hover:text-white"}`
              }
            >
              <span>🎞️</span> Reels
            </NavLink>
            <NavLink
              to="/scene-to-title"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${isActive ? "bg-white/10 text-white shadow-inner" : "hover:bg-white/5 hover:text-white"}`
              }
            >
              <span>🔍</span> Scene to Title
            </NavLink>
            <NavLink
              to="/roadmap"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${isActive ? "bg-white/10 text-white shadow-inner" : "hover:bg-white/5 hover:text-white"}`
              }
            >
              <span>🚀</span> Roadmap
            </NavLink>
          </div>
        )}

        <div className="flex flex-shrink-0 items-center justify-end gap-3 sm:gap-4">
          {user ? (
            <>
              <span className="hidden text-xs text-zinc-300 xl:inline whitespace-nowrap">
                {user.name} ·{" "}
                <b className={theme.text}>{mood.replace("-", " ")}</b>
              </span>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `grid h-8 w-8 sm:h-10 sm:w-10 place-items-center overflow-hidden rounded-full border text-xs sm:text-sm font-black text-white transition hover:scale-105 ${
                    isActive ? "bg-white/20" : "bg-white/10"
                  }`
                }
                style={{
                  borderColor: theme.border,
                  boxShadow: `0 0 18px ${theme.glow}`,
                }}
                aria-label="Open profile"
                title="Profile"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileInitial
                )}
              </NavLink>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="rounded-full border border-white/10 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white/15"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 sm:hidden"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition"
              style={{ background: theme.accent }}
            >
              Sign In
            </Link>
          )}
        </div>
      </motion.nav>

      {user && (
        <div
          className={`fixed inset-x-0 bottom-0 z-50 flex justify-center md:hidden transition-transform duration-500 ease-out ${
            isReelPlaying ? "translate-y-[150%]" : "translate-y-0"
          }`}
        >
          <motion.div className="flex w-full items-center justify-around bg-black/40 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] px-2 backdrop-blur-3xl backdrop-saturate-150 border-t border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_-10px_40px_rgba(0,0,0,0.5)]">
            {["browse", "explore", "reels", "roadmap"].map((item) => {
              const Icon =
                item === "browse"
                  ? Home
                  : item === "explore"
                    ? Compass
                    : item === "reels"
                      ? Film
                      : MapIcon;
              const label =
                item === "browse"
                  ? "Home"
                  : item === "explore"
                    ? "Explore"
                    : item === "reels"
                      ? "Reels"
                      : "Map";
              const isActive = location.pathname.includes(item);

              return (
                <button
                  key={item}
                  onClick={() => navigate(`/${item}`)}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] transition-all duration-300 ${
                    isActive
                      ? "scale-105 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2 : 1.5} />
                  <span
                    className={`text-[10px] tracking-wide ${isActive ? "font-black" : "font-medium"}`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() =>
                window.dispatchEvent(new Event("open-cinescope-ai"))
              }
              className="flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] transition-colors"
              style={{ color: theme.accent }}
            >
              <div className="relative">
                <Sparkles className="w-6 h-6 relative z-10" strokeWidth={1.5} />
                <div
                  className="absolute inset-0 blur-md opacity-60"
                  style={{ background: theme.accent }}
                />
              </div>
              <span className="text-[10px] font-bold tracking-wide">AI</span>
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};
