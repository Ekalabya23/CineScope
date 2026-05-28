import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiClient } from "../api/client";
import { useCinematicTheme } from "../context/CinematicThemeContext";
import { CinematicBackground } from "../components/Explore/CinematicBackground";
import { UniversePortal } from "../components/Explore/UniversePortal";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CinematicTimelineNode } from "../components/Explore/CinematicTimelineNode";
import { CharacterReveal } from "../components/Explore/CharacterReveal";

gsap.registerPlugin(ScrollTrigger);

const ATMOSPHERES: Record<string, any> = {
  marvel: { color: "#e62429", intensity: 1.5, bg: "/assets/marvel-bg.jpg" },
  dc: { color: "#0078f0", intensity: 1.2, bg: "/assets/dc-bg.jpg" },
  starwars: { color: "#ffe81f", intensity: 1.8, bg: "/assets/starwars-bg.jpg" },
  naruto: { color: "#ff7b00", intensity: 1.4, bg: "/assets/naruto-bg.jpg" },
};

export const Explore: React.FC = () => {
  const { theme } = useCinematicTheme();
  const [universes, setUniverses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    return () => {
      lenis.destroy();
    };
  }, []);

  const atm = useMemo(() => {
    const id = hovered || selectedId;
    return (id && ATMOSPHERES[id]) ? ATMOSPHERES[id] : { color: theme.accent || "#ffffff", intensity: 0.8 };
  }, [hovered, selectedId, theme]);

  // Fetch Universes
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/explore/universes");
        if (res.data?.status === "success") setUniverses(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch Details
  useEffect(() => {
    if (!selectedId) { setData(null); return; }
    (async () => {
      try {
        const res = await apiClient.get(`/explore/universe/${selectedId}`);
        if (res.data?.status === "success") setData(res.data.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedId]);

  const selectUniverse = useCallback((id: string) => {
    setSelectedId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goBack = useCallback(() => {
    setSelectedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="bg-[#020204] text-zinc-100 relative w-full overflow-x-hidden min-h-screen">
      {/* GLOBAL CINEMATIC BACKGROUND */}
      <CinematicBackground color={atm.color} intensity={atm.intensity} />

      {/* FOREGROUND CONTENT */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {!selectedId ? (
            /* ═════ HUB VIEW ═════ */
            <motion.div
              key="hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="min-h-screen flex flex-col justify-center px-6 md:px-12 pt-24 pb-12"
            >
              {/* Cinematic Title */}
              <motion.div
                initial={{ opacity: 0, y: 30, filter: "blur(15px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-center mb-16"
              >
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md mb-8">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: atm.color, boxShadow: `0 0 10px ${atm.color}` }} />
                  <span className="text-xs font-bold uppercase tracking-[0.4em] text-zinc-400">
                    Continuity Engine
                  </span>
                </div>
                <h1 className="text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter text-white leading-[0.85] mix-blend-screen drop-shadow-2xl">
                  Explore<br/>
                  <span className="transition-colors duration-1000" style={{ color: atm.color, textShadow: `0 0 40px ${atm.color}` }}>
                    The Multiverse
                  </span>
                </h1>
              </motion.div>

              {/* Portal Grid */}
              <div className="flex-1 flex flex-col md:flex-row gap-6 max-w-[1800px] mx-auto w-full">
                {loading ? (
                   Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-1 min-h-[300px] rounded-[2rem] bg-white/[0.02] border border-white/[0.05] animate-pulse" />
                  ))
                ) : (
                  universes.map((uni, i) => (
                    <UniversePortal 
                      key={uni.id} 
                      universe={uni} 
                      index={i} 
                      onSelect={selectUniverse} 
                      onHover={setHovered} 
                    />
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            /* ═════ UNIVERSE VIEW ═════ */
            <motion.div
              key="universe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <button 
                onClick={goBack} 
                className="fixed top-24 left-8 z-50 px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition"
              >
                ← Return to Nexus
              </button>

              {data ? (
                <>
                  {/* Cinematic Intro */}
                  <section className="h-screen flex items-center justify-center relative">
                    <motion.div 
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="text-center z-10 px-6"
                    >
                      <h1 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter leading-none mb-6 drop-shadow-[0_20px_50px_rgba(0,0,0,1)]">
                        {data.name}
                      </h1>
                      <p className="text-xl md:text-3xl text-zinc-400 font-light max-w-3xl mx-auto drop-shadow-xl">
                        {data.heroText}
                      </p>
                    </motion.div>
                    
                    {/* Scroll Indicator */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50">
                       <span className="text-xs uppercase tracking-[0.3em] font-bold">Initiate Descent</span>
                       <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent" />
                    </div>
                  </section>

                  {/* Living Timeline */}
                  <section className="relative w-full py-40 overflow-hidden">
                    <div className="max-w-[1400px] mx-auto px-6 relative">
                       <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-center mb-32 mix-blend-overlay opacity-30">
                         The Continuity
                       </h2>
                       
                       {/* SVG Winding Path */}
                       <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                       <div className="relative z-10 flex flex-col gap-12">
                         {data.timeline?.map((item: any, i: number) => (
                           <CinematicTimelineNode 
                             key={item.id} 
                             item={item} 
                             index={i} 
                             accent={atm.color} 
                             glow={atm.color} 
                             isEven={i % 2 === 0} 
                             activeMode="Chronological" 
                           />
                         ))}
                       </div>
                    </div>
                  </section>

                  {/* Character Reveals (GSAP Pinned) */}
                  <section className="relative w-full bg-black/40 backdrop-blur-3xl border-t border-white/10 pt-32 pb-32">
                    <div className="max-w-7xl mx-auto px-6">
                       <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-20 text-center">
                         Legendary Figures
                       </h2>
                       {data.characterIntroductions?.map((char: any, i: number) => (
                         <CharacterReveal key={i} char={char} index={i} themeClass={`text-[${atm.color}]`} />
                       ))}
                    </div>
                  </section>
                </>
              ) : (
                <div className="h-screen flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-t-white border-white/20 animate-spin" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
