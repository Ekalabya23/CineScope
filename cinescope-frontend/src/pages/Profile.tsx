import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ContinueWatchingRail } from "../components/ContinueWatchingRail";
import { MovieCard } from "../components/MovieCard";
import { platformApi } from "../services/platformApi";
import { useCinematicTheme } from "../context/CinematicThemeContext";
import { getMoodTheme } from "../theme/cinematicTheme";

const fallbackBackdrop =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800";

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-[#050609] pt-28">
    <div className="mx-auto max-w-7xl space-y-8 px-5 md:px-12">
      <div className="h-[420px] rounded-3xl bg-white/10 shimmer" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-36 rounded-3xl bg-white/10 shimmer" />
        ))}
      </div>
    </div>
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string | number;
  detail?: string;
  accent: string;
}> = ({ label, value, detail, accent }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl"
  >
    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
      {label}
    </p>
    <p className="mt-2 text-4xl font-black text-white">{value}</p>
    {detail && (
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        <span style={{ color: accent }}>●</span> {detail}
      </p>
    )}
  </motion.div>
);

const MoodRadar: React.FC<{ moods: any[] }> = ({ moods }) => {
  const points = useMemo(() => {
    const center = 120;
    const maxRadius = 88;
    const list = moods.slice(0, 6);
    return list.map((item, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(list.length, 1) - Math.PI / 2;
      const score = Number(item.score || 64) / 100;
      return {
        ...item,
        x: center + Math.cos(angle) * maxRadius * score,
        y: center + Math.sin(angle) * maxRadius * score,
        labelX: center + Math.cos(angle) * 108,
        labelY: center + Math.sin(angle) * 108,
      };
    });
  }, [moods]);

  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
        Emotional spectrum
      </p>
      <svg viewBox="0 0 240 240" className="mx-auto mt-4 h-72 w-full max-w-sm">
        {[36, 58, 80].map((radius) => (
          <circle
            key={radius}
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,.09)"
          />
        ))}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          points={polygon}
          fill="rgba(168,85,247,.28)"
          stroke="rgba(168,85,247,.85)"
          strokeWidth="2"
        />
        {points.map((point) => (
          <g key={point.mood}>
            <circle cx={point.x} cy={point.y} r="4" fill={getMoodTheme(point.mood).accent} />
            <text
              x={point.labelX}
              y={point.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,.72)"
              fontSize="9"
              fontWeight="700"
            >
              {String(point.mood).replace("-", " ")}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCinematicMood } = useCinematicTheme();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [profileData, analyticsData, continueData, watchlistData] =
          await Promise.all([
            platformApi.profile(),
            platformApi.analytics().catch(() => null),
            platformApi.continueWatching().catch(() => []),
            platformApi.watchlist().catch(() => []),
          ]);

        if (!mounted) return;
        setProfile(profileData);
        setAnalytics(analyticsData);
        setContinueWatching(continueData || []);
        setWatchlist(watchlistData || []);
        setCinematicMood(profileData?.tasteProfile?.dominantMoods?.[0] || "mind-bending");
      } catch (err) {
        console.error("Profile intelligence hydration failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [setCinematicMood]);

  if (loading) return <ProfileSkeleton />;

  const user = profile?.user || {};
  const taste = profile?.tasteProfile || {};
  const moods = analytics?.moodPreferences || [];
  const theme = getMoodTheme(taste.dominantMoods?.[0]);
  const joinDate = user.joinDate
    ? new Date(user.joinDate).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "Recently";
  const watchlistMovies = watchlist.map((item) => ({
    id: item.mediaId,
    title: item.title,
    posterPath: item.posterPath,
    poster_path: item.posterPath,
    mediaType: item.mediaType,
    media_type: item.mediaType,
    recommendation: undefined,
  }));

  return (
    <main className="min-h-screen overflow-hidden bg-[#050609] pb-28 text-white">
      <section className="relative min-h-[76vh] overflow-hidden px-5 pb-12 pt-32 md:px-12">
        <img
          src={user.backdropUrl || fallbackBackdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050609] via-[#050609]/52 to-transparent" />
        <div className="absolute inset-0" style={{ background: theme.gradient }} />

        <div className="relative z-10 mx-auto flex min-h-[58vh] max-w-7xl flex-col justify-end gap-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-5 lg:grid-cols-[1fr_380px]"
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-end gap-5">
                <div
                  className="grid h-28 w-28 place-items-center overflow-hidden rounded-3xl border bg-black/45 text-4xl font-black backdrop-blur-xl md:h-36 md:w-36"
                  style={{ borderColor: theme.border, boxShadow: `0 0 44px ${theme.glow}` }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name?.slice(0, 1)?.toUpperCase() || "C"
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: theme.accent }}>
                    Entertainment identity
                  </p>
                  <h1 className="mt-2 text-5xl font-black leading-none md:text-7xl">
                    {user.name}
                  </h1>
                  <p className="mt-2 text-sm text-zinc-300">Member since {joinDate}</p>
                </div>
              </div>

              <p className="max-w-3xl text-xl leading-8 text-zinc-200 md:text-2xl">
                {profile?.aiPersonalitySummary ||
                  "Your CineScope identity is still learning from your watch behavior."}
              </p>

              <div className="flex flex-wrap gap-2">
                {[...(taste.favoriteGenres || []), ...(taste.dominantMoods || [])]
                  .slice(0, 10)
                  .map((item) => (
                    <span
                      key={item}
                      className="rounded-full border bg-black/25 px-3 py-1 text-xs font-bold capitalize backdrop-blur"
                      style={{ borderColor: theme.border }}
                    >
                      {String(item).replace("-", " ")}
                    </span>
                  ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/28 p-5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: theme.accent }}>
                Viewing personality
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {taste.watchPattern || "Exploratory"} Viewer
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {user.viewingPersonality || profile?.aiPersonalitySummary}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] text-zinc-500">Favorite mode</p>
                  <p className="mt-1 font-black capitalize">{taste.dominantMoods?.[0]?.replace("-", " ")}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] text-zinc-500">Core genre</p>
                  <p className="mt-1 font-black">{taste.favoriteGenres?.[0] || "Cinema"}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-8 max-w-7xl space-y-14 px-5 md:px-12">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Acceptance rate"
            value={`${analytics?.recommendationAcceptanceRate || 0}%`}
            detail="Recommendation signals accepted"
            accent={theme.accent}
          />
          <StatCard
            label="AI match accuracy"
            value={
              typeof analytics?.aiMatchAccuracy === "number"
                ? `${analytics.aiMatchAccuracy}%`
                : "Learning"
            }
            detail="Based on accepted and ignored recommendations"
            accent={theme.accent}
          />
          <StatCard
            label="Watch history"
            value={analytics?.totals?.watchHistory || 0}
            detail="Tracked sessions"
            accent={theme.accent}
          />
          <StatCard
            label="Watchlist vault"
            value={analytics?.totals?.watchlist || watchlist.length}
            detail="Saved titles"
            accent={theme.accent}
          />
        </div>

        <ContinueWatchingRail items={continueWatching} />

        <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <MoodRadar moods={moods} />
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: theme.accent }}>
              AI taste profile
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">Wrapped-Style Taste DNA</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              {taste.behaviorSummary || analytics?.aiPersonalitySummary}
            </p>
            <div className="mt-6 space-y-4">
              {[
                ["Favorite genres", taste.favoriteGenres || []],
                ["Theme preferences", analytics?.themePreferences || taste.preferredThemes || []],
                ["Genres explored", analytics?.genresExplored || []],
              ].map(([label, values]: any) => (
                <div key={label}>
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-zinc-500">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {values.slice(0, 8).map((value: string) => (
                      <span key={value} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: theme.accent }}>
              Saved cinematic vault
            </p>
            <h2 className="mt-1 text-3xl font-black text-white">Watchlist Vault</h2>
          </div>
          {watchlistMovies.length ? (
            <div className="flex gap-4 overflow-x-auto pb-5 scrollbar-hide">
              {watchlistMovies.map((item) => (
                <MovieCard
                  key={`${item.mediaType}-${item.id}`}
                  movie={item}
                  type={item.mediaType}
                  mood={taste.dominantMoods?.[0]}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-zinc-400">
              Your watchlist vault is empty. Save titles from Browse to start shaping your AI identity.
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
