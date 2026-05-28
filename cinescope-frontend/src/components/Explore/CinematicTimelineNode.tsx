import React, { useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Props {
  item: any;
  index: number;
  accent: string;
  glow: string;
  isEven: boolean;
  activeMode: string;
}

export const CinematicTimelineNode: React.FC<Props> = ({
  item, index, accent, glow, isEven, activeMode,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cfg = { stiffness: 200, damping: 20 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), cfg);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), cfg);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }, [mx, my]);

  const onLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  const phaseIdx = activeMode === "Chronological" ? item.chronologyIndex : item.releaseIndex;
  const typeLabel = item.mediaType === "tv" ? "Series" : item.mediaType === "arc" ? "Arc" : "Film";

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (index % 3) * 0.06 }}
      className={`relative flex w-full items-center ${isEven ? "flex-col md:flex-row" : "flex-col md:flex-row-reverse"}`}
      style={{ padding: "clamp(2rem, 5vw, 5rem) 0" }}
    >
      {/* timeline dot */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className="w-5 h-5 rounded-full border-[3px] border-[#0a0a0f]"
          style={{ background: accent, boxShadow: `0 0 25px 6px ${glow}, 0 0 60px 2px ${glow}` }}
        />
      </div>

      {/* card */}
      <div
        className={`w-full md:w-[46%] px-4 md:px-8 ${isEven ? "md:pr-16" : "md:pl-16"}`}
        style={{ perspective: "1000px" }}
      >
        <motion.div
          ref={cardRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative w-full rounded-2xl overflow-hidden group cursor-default"
        >
          {/* blurred bg glow */}
          <div
            className="absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-3xl -z-10"
            style={{ background: accent }}
          />

          <div className="relative bg-[#0c0c14]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 md:p-7 group-hover:border-white/[0.12] transition-colors duration-500">
            <div className="flex gap-5 md:gap-7 items-start">
              {/* poster */}
              <div className="flex-none" style={{ transform: "translateZ(30px)" }}>
                {item.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                    alt={item.title}
                    loading="lazy"
                    className="w-28 h-40 md:w-36 md:h-52 object-cover rounded-xl shadow-2xl border border-white/[0.08] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-shadow duration-700"
                  />
                ) : (
                  <div className="w-28 h-40 md:w-36 md:h-52 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-3xl">🎬</div>
                )}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0 space-y-3" style={{ transform: "translateZ(20px)" }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-md"
                    style={{ color: accent, background: `${accent}15`, border: `1px solid ${accent}25` }}
                  >
                    {typeLabel}
                  </span>
                  <span className="text-[11px] text-zinc-600 font-medium">
                    Phase {phaseIdx}
                  </span>
                </div>

                <h4 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">
                  {item.title}
                </h4>

                <p className="text-xs md:text-sm text-zinc-500 leading-relaxed line-clamp-2">
                  {item.continuityRelevance}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                    {item.releaseYear || "TBA"}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.importanceScore}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: accent }}
                      />
                    </div>
                    <span className="text-[11px] font-black text-zinc-400">{item.importanceScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="hidden md:block w-[46%]" />
    </motion.div>
  );
};
