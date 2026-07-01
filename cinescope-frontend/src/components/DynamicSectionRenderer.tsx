import React, { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useCinematicTheme } from "../context/CinematicThemeContext";
import { getMoodTheme } from "../theme/cinematicTheme";
import { getBackdropPath, getTitle, imageUrl } from "../utils/media";
import { MovieCard } from "./MovieCard";

const SectionShell: React.FC<{ section: any; children: React.ReactNode }> = ({
  section,
  children,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { margin: "-30% 0px -45% 0px" });
  const { setCinematicMood } = useCinematicTheme();
  const theme = getMoodTheme(section.mood);

  useEffect(() => {
    if (inView) setCinematicMood(section.mood, getBackdropPath(section.items?.[0]));
  }, [inView, section.mood, section.items, setCinematicMood]);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="relative space-y-5 overflow-visible py-2"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-[0.26em]"
            style={{ color: theme.accent }}
          >
            {section.emotionalTone || section.mood} · {section.visualTheme}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-normal text-white md:text-4xl">
            {section.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
            {section.subtitle}
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 backdrop-blur">
          {section.layout} · AI scored
        </div>
      </div>
      {children}
    </motion.section>
  );
};

export const DynamicSectionRenderer: React.FC<{ section: any }> = ({ section }) => {
  const items = section.items || [];
  const theme = getMoodTheme(section.mood);
  if (!items.length) return null;

  const mediaType = (item: any) =>
    section.mediaType !== "mixed" ? section.mediaType : item.mediaType || item.media_type;

  if (section.layout === "featured-split") {
    const [feature, ...rest] = items;
    return (
      <SectionShell section={section}>
        <div
          className="grid gap-4 overflow-hidden rounded-3xl border bg-white/[0.03] p-4 backdrop-blur-xl lg:grid-cols-[1.05fr_1.5fr]"
          style={{ borderColor: theme.border, boxShadow: `0 0 38px ${theme.soft}` }}
        >
          <div className="relative min-h-[220px] md:min-h-[360px] overflow-hidden rounded-2xl bg-black">
            <img
              src={imageUrl(getBackdropPath(feature), "w1280")}
              alt={getTitle(feature)}
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 space-y-3 p-5">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Featured emotional match
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white">{getTitle(feature)}</h3>
              <p className="line-clamp-3 text-sm leading-6 text-zinc-300">{feature.overview}</p>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-hide">
            {rest.slice(0, 10).map((item: any) => (
              <MovieCard
                key={`${section.title}-${item.id}`}
                movie={item}
                type={mediaType(item)}
                mood={section.mood}
              />
            ))}
          </div>
        </div>
      </SectionShell>
    );
  }

  if (section.layout === "bento-grid") {
    const [feature, ...rest] = items;
    return (
      <SectionShell section={section}>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1.85fr]">
          <div
            className="relative min-h-[180px] md:min-h-[320px] overflow-hidden rounded-2xl border bg-black"
            style={{ borderColor: theme.border }}
          >
            <img
              src={imageUrl(getBackdropPath(feature), "w1280")}
              alt={getTitle(feature)}
              className="absolute inset-0 h-full w-full object-cover opacity-65"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute bottom-0 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: theme.accent }}>
                Featured in {section.title}
              </p>
              <h3 className="mt-2 text-2xl md:text-3xl font-black text-white">{getTitle(feature)}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-300">
                {feature.overview}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {rest.slice(0, 8).map((item: any) => (
              <MovieCard
                key={`${section.title}-${item.id}`}
                movie={item}
                type={mediaType(item)}
                mood={section.mood}
                fluid
                size="poster"
              />
            ))}
          </div>
        </div>
      </SectionShell>
    );
  }

  if (section.layout === "cinematic-banner") {
    const item = items[0];
    return (
      <SectionShell section={section}>
          <div className="relative h-[220px] md:h-[360px] overflow-hidden rounded-3xl border bg-black" style={{ borderColor: theme.border }}>
            <img
              src={imageUrl(getBackdropPath(item), "original")}
              alt={getTitle(item)}
              className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0" style={{ background: theme.gradient }} />
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: theme.accent }}>
                {section.recommendationReason}
              </p>
              <h3 className="mt-2 max-w-3xl text-2xl sm:text-4xl font-black text-white md:text-6xl">
                {getTitle(item)}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 line-clamp-2 md:line-clamp-none">{item.overview}</p>
            </div>
        </div>
      </SectionShell>
    );
  }

  if (section.layout === "stacked-vertical") {
    return (
      <SectionShell section={section}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.slice(0, 9).map((item: any) => (
            <MovieCard
              key={`${section.title}-${item.id}`}
              movie={item}
              type={mediaType(item)}
              mood={section.mood}
              size="wide"
              fluid
            />
          ))}
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell section={section}>
      <div className="flex gap-4 overflow-x-auto overflow-y-visible px-1 pb-10 pt-3 scrollbar-hide">
        {items.map((item: any) => (
          <MovieCard
            key={`${section.title}-${item.id}`}
            movie={item}
            type={mediaType(item)}
            mood={section.mood}
            size={section.layout === "large-carousel" ? "wide" : "poster"}
          />
        ))}
      </div>
    </SectionShell>
  );
};
