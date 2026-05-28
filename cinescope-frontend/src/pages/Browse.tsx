import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { AiChatSidebar } from "../components/AiChatSidebar";
import { CinematicHero } from "../components/CinematicHero";
import { ContinueWatchingRail } from "../components/ContinueWatchingRail";
import { DynamicSectionRenderer } from "../components/DynamicSectionRenderer";
import { TasteProfilePanel } from "../components/TasteProfilePanel";
import { TrustedReviewersBanner } from "../components/TrustedReviewersBanner";
import { MovieCard } from "../components/MovieCard";
import { platformApi } from "../services/platformApi";
import { getMoodTheme, moodShortcuts } from "../theme/cinematicTheme";
import { useCinematicTheme } from "../context/CinematicThemeContext";

const CinematicSkeleton = () => (
  <div className="min-h-screen bg-[#050609]">
    <div className="relative h-[88vh] overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 shimmer opacity-40" />
      <div className="absolute bottom-24 left-6 w-[min(680px,80vw)] space-y-5 md:left-16">
        <div className="h-4 w-52 rounded-full bg-white/10" />
        <div className="h-20 rounded-2xl bg-white/10 md:h-28" />
        <div className="h-4 w-3/4 rounded-full bg-white/10" />
        <div className="h-4 w-1/2 rounded-full bg-white/10" />
      </div>
    </div>
    <div className="-mt-12 space-y-8 px-5 md:px-16">
      {[1, 2, 3].map((item) => (
        <div key={item} className="space-y-4">
          <div className="h-7 w-80 rounded-full bg-white/10" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((card) => (
              <div key={card} className="h-64 w-44 flex-none rounded-xl bg-white/10 shimmer" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const Browse: React.FC = () => {
  const { mood } = useParams();
  const [homepage, setHomepage] = useState<any>(null);
  const [personalized, setPersonalized] = useState<any>(null);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [tasteProfile, setTasteProfile] = useState<any>(null);
  const [moodDiscovery, setMoodDiscovery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, setCinematicMood } = useCinematicTheme();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        const homeData = await platformApi.homepage();

        if (!mounted) return;
        setHomepage(homeData);
        setCinematicMood(
          homeData?.sections?.[0]?.mood || "mind-bending",
          homeData?.heroBanner?.backdropPath || homeData?.heroBanner?.backdrop_path,
        );
        setLoading(false);

        const [personalData, historyData, profileData, moodData] = await Promise.all([
          platformApi.personalized().catch(() => null),
          platformApi.continueWatching().catch(() => []),
          platformApi.tasteProfile().catch(() => null),
          mood ? platformApi.moodDiscovery(mood).catch(() => null) : Promise.resolve(null),
        ]);

        if (!mounted) return;
        setPersonalized(personalData);
        setContinueWatching(historyData || []);
        setTasteProfile(profileData);
        setMoodDiscovery(moodData);
        if (moodData?.mood) {
          setCinematicMood(moodData.mood);
        }
      } catch (err) {
        console.error("Cinematic orchestration hydration failed:", err);
        if (mounted) {
          setHomepage({ heroBanner: null, sections: [] });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [mood, setCinematicMood]);

  const sections = useMemo(() => {
    const base = homepage?.sections || [];
    const personal = personalized?.sections || [];
    if (moodDiscovery) return base;
    const seen = new Set(base.map((section: any) => section.title));
    const uniquePersonal = personal.filter((section: any) => {
      if (seen.has(section.title)) return false;
      if (/trending|popular right now|top rated|new releases|most watched/i.test(section.title)) {
        return false;
      }
      seen.add(section.title);
      return true;
    });
    return [...base, ...uniquePersonal.slice(0, 3)];
  }, [homepage, personalized, moodDiscovery]);

  if (loading) return <CinematicSkeleton />;

  const heroItems = sections.flatMap((section: any) => section.items || []).slice(0, 8);
  const activeTheme = getMoodTheme(moodDiscovery?.mood || sections[0]?.mood);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050609] pb-28 text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          background: `radial-gradient(circle at 20% 12%, ${theme.glow}, transparent 32%), radial-gradient(circle at 85% 18%, ${theme.soft}, transparent 34%)`,
        }}
      />

      {!moodDiscovery && (
        <CinematicHero hero={homepage?.heroBanner} fallbackItems={heroItems} />
      )}

      {moodDiscovery && (
        <section className="relative min-h-[72vh] px-5 pb-12 pt-36 md:px-16">
          <div
            className="absolute inset-0 opacity-80"
            style={{ background: activeTheme.gradient }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 max-w-4xl space-y-5"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: activeTheme.accent }}>
              Mood discovery system
            </p>
            <h1 className="text-5xl font-black capitalize leading-none text-white md:text-8xl">
              {moodDiscovery.mood.replace("-", " ")}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-300">
              {moodDiscovery.emotionalTone} across {moodDiscovery.themes?.join(", ")}.
            </p>
            <div className="flex flex-wrap gap-2">
              {moodShortcuts.map((item) => (
                <a
                  key={item}
                  href={`/discover/${item}`}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold capitalize text-white backdrop-blur"
                >
                  {item.replace("-", " ")}
                </a>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <div className={`relative z-10 ${moodDiscovery ? "pt-0" : "pt-12"} mx-auto max-w-[1700px] space-y-20 px-4 md:px-10 lg:px-16`}>
        {moodDiscovery && (
          <section className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {moodDiscovery.items?.map((item: any) => (
                <MovieCard
                  key={`mood-${item.id}`}
                  movie={item}
                  type={item.mediaType || item.media_type || "movie"}
                  mood={moodDiscovery.mood}
                  fluid
                />
              ))}
            </div>
          </section>
        )}

        <ContinueWatchingRail items={continueWatching} />

        {!moodDiscovery && <TrustedReviewersBanner />}

        {!moodDiscovery &&
          sections.map((section: any) => (
            <DynamicSectionRenderer key={`${section.title}-${section.mood}`} section={section} />
          ))}

        {!moodDiscovery && <TasteProfilePanel profile={tasteProfile} />}
      </div>

      <AiChatSidebar />
    </main>
  );
};
