import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useCinematicTheme } from "../context/CinematicThemeContext";
import { moodShortcuts } from "../theme/cinematicTheme";

export const Navbar: React.FC = () => {
  const { user, logout } = useStore();
  const { mood, theme } = useCinematicTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const profileInitial = user?.name?.slice(0, 1)?.toUpperCase() || "C";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/discover/${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      <motion.nav
        animate={{
          background: scrolled
            ? `linear-gradient(135deg, rgba(5,6,9,.82), rgba(5,6,9,.68)), ${theme.gradient}`
            : `linear-gradient(135deg, rgba(5,6,9,.22), rgba(5,6,9,.08)), ${theme.gradient}`,
          boxShadow: scrolled
            ? `0 16px 50px rgba(0,0,0,.36), 0 0 34px ${theme.glow}`
            : `0 0 32px ${theme.glow}`,
          borderColor: scrolled ? theme.border : "rgba(255,255,255,.08)",
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="fixed left-3 right-3 top-3 z-50 flex h-16 items-center justify-between rounded-2xl border px-4 backdrop-blur-2xl md:left-8 md:right-8 md:px-7"
      >
      <div className="flex items-center gap-5 md:gap-8">
        <Link
          to="/browse"
          className="text-xl font-black tracking-[0.18em] text-white md:text-2xl"
          style={{ textShadow: `0 0 22px ${theme.glow}` }}
        >
          CINESCOPE
        </Link>
        {user && (
          <div className="hidden items-center gap-1 text-sm font-medium text-zinc-300 md:flex">
            <NavLink
              to="/browse"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`
              }
            >
              Explore
            </NavLink>
            <NavLink
              to="/reels"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`
              }
            >
              Reels
            </NavLink>
            <NavLink
              to="/roadmap"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`
              }
            >
              Roadmap
            </NavLink>
            {moodShortcuts.slice(0, 3).map((item) => (
              <NavLink
                key={item}
                to={`/discover/${item}`}
                className="rounded-full px-4 py-2 capitalize transition hover:bg-white/5 hover:text-white"
              >
                {item.replace("-", " ")}
              </NavLink>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <>
            <form
              onSubmit={submitSearch}
              className={`hidden items-center overflow-hidden rounded-full border bg-black/20 backdrop-blur-xl transition-all md:flex ${
                searchOpen ? "w-72" : "w-11"
              }`}
              style={{ borderColor: searchOpen ? theme.border : "rgba(255,255,255,.08)" }}
            >
              <button
                type="button"
                onClick={() => setSearchOpen((value) => !value)}
                className="grid h-10 w-10 flex-none place-items-center text-zinc-200"
                aria-label="Open search"
              >
                ⌕
              </button>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a mood, theme, title..."
                className="w-full bg-transparent pr-4 text-xs text-white outline-none placeholder:text-zinc-500"
              />
            </form>
            <button
              onClick={() => window.dispatchEvent(new Event("open-cinescope-ai"))}
              className="relative grid h-10 w-10 place-items-center rounded-full border bg-white/10 text-sm text-white shadow-lg transition hover:scale-105"
              style={{ borderColor: theme.border, boxShadow: `0 0 20px ${theme.glow}` }}
              aria-label="Open CineScope AI"
            >
              AI
              <span
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
                style={{ background: theme.accent, boxShadow: `0 0 14px ${theme.accent}` }}
              />
            </button>
            <span className="hidden text-xs text-zinc-300 lg:inline">
              {user.name} · <b className={theme.text}>{mood.replace("-", " ")}</b>
            </span>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `grid h-10 w-10 place-items-center overflow-hidden rounded-full border text-sm font-black text-white transition hover:scale-105 ${
                  isActive ? "bg-white/20" : "bg-white/10"
                }`
              }
              style={{ borderColor: theme.border, boxShadow: `0 0 18px ${theme.glow}` }}
              aria-label="Open profile"
              title="Profile"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                profileInitial
              )}
            </NavLink>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white/15"
            >
              Sign Out
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
        <div className="fixed inset-x-4 bottom-4 z-50 flex justify-center md:hidden">
          <motion.div
            animate={{ boxShadow: `0 0 28px ${theme.glow}` }}
            className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/55 p-1.5 backdrop-blur-2xl"
          >
            {["browse", "explore", "reels", "roadmap", "profile"].map((item) => (
              <button
                key={item}
                onClick={() =>
                  navigate(
                    item === "browse"
                      ? "/browse"
                      : item === "explore"
                        ? "/explore"
                      : item === "reels"
                        ? "/reels"
                      : item === "roadmap"
                        ? "/roadmap"
                        : "/profile",
                  )
                }
                className="rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-zinc-200"
              >
                {item === "browse" ? "Home" : item === "explore" ? "Explore" : item === "reels" ? "Reels" : item === "roadmap" ? "Map" : "Me"}
              </button>
            ))}
            <button
              onClick={() => window.dispatchEvent(new Event("open-cinescope-ai"))}
              className="rounded-xl px-3 py-2 text-[10px] font-black text-white"
              style={{ background: theme.accent }}
            >
              AI
            </button>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {searchOpen && query && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed right-40 top-24 z-40 hidden w-80 rounded-2xl border border-white/10 bg-black/65 p-3 backdrop-blur-2xl md:block"
          >
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              AI discovery suggestions
            </p>
            {[query, `${query} emotional`, `${query} cyberpunk`].map((item) => (
              <button
                key={item}
                onClick={() => navigate(`/discover/${encodeURIComponent(item)}`)}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/10"
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
