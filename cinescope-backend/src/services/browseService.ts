import { TmdbService } from "./tmdb.service";

export interface HomepageSection {
  title: string;
  subtitle: string;
  layout:
    | "poster-row"
    | "large-carousel"
    | "bento-grid"
    | "featured-split"
    | "stacked-vertical"
    | "spotlight-banner";
  mood: string;
  theme: string;
  mediaType: "movie" | "tv" | "mixed";
  items: any[];
}

export const BrowseService = {
  generateDiscoveryLayout: async (): Promise<{
    heroBanner: any;
    sections: HomepageSection[];
  }> => {
    const currentYear = new Date().getFullYear();

    // 1. Structural Configuration Definition Map for our 20 Streaming Collections
    const sectionDefinitions = [
      // --- TRENDING & MASTER BLOCKS ---
      {
        title: "Popular Right Now",
        subtitle: "The cultural moments lighting up screens globally.",
        layout: "large-carousel" as const,
        mood: "hyped",
        theme: "mainstream",
        mediaType: "movie" as const,
        fetcher: () => TmdbService.getTrending("movie", "day"),
      },
      {
        title: "Critically Acclaimed Masterpieces",
        subtitle: "High-art cinema vetted by global audiences.",
        layout: "bento-grid" as const,
        mood: "analytical",
        theme: "prestige",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            "vote_count.gte": 8000,
            sort_by: "vote_average.desc",
            "vote_average.gte": 8,
          }),
      },
      {
        title: "Binge-Worthy TV Seasons",
        subtitle: "Highly engaging narratives designed for one more episode.",
        layout: "poster-row" as const,
        mood: "cozy",
        theme: "television",
        mediaType: "tv" as const,
        fetcher: () => TmdbService.getTrending("tv", "week"),
      },

      // --- MOOD-BASED CONFIGS ---
      {
        title: "Reality-Bending Mind-Twisters",
        subtitle:
          "Unhinged timelines, psychological mazes, and cognitive paradoxes.",
        layout: "poster-row" as const,
        mood: "cerebral",
        theme: "sci-fi",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_genres: "878,53",
            "vote_average.gte": 7.2,
            sort_by: "popularity.desc",
          }),
      },
      {
        title: "Pure Adrenaline Rush",
        subtitle: "High-octane operational tracking and explosive set-pieces.",
        layout: "poster-row" as const,
        mood: "energetic",
        theme: "action",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_genres: "28,12",
            "vote_count.gte": 1000,
            sort_by: "popularity.desc",
          }),
      },
      {
        title: "Emotional Damage Collection",
        subtitle: "Heavy-hitting heartstrings and melancholic character arcs.",
        layout: "featured-split" as const,
        mood: "melancholy",
        theme: "drama",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_genres: "18,10749",
            sort_by: "vote_count.desc",
          }),
      },
      {
        title: "Late Night Escapes",
        subtitle:
          "Lightweight premium narratives optimized for relaxing routines.",
        layout: "poster-row" as const,
        mood: "relaxed",
        theme: "comedy",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_genres: "35,10402",
            sort_by: "popularity.desc",
          }),
      },

      // --- THEMATIC & GENRE-SUBSETS ---
      {
        title: "Cyberpunk Dreams & Neon Aesthetics",
        subtitle: "Dystopian cityscapes, synthetics, and corporate operations.",
        layout: "bento-grid" as const,
        mood: "immersive",
        theme: "cyberpunk",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_keywords: "210314|4565|12349",
            sort_by: "popularity.desc",
          }), // Cyberpunk/Dystopia tags
      },
      {
        title: "Dark Psychological Thrillers",
        subtitle:
          "Shadowy operations, sociopathic profiles, and intense tension.",
        layout: "poster-row" as const,
        mood: "tense",
        theme: "thriller",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_genres: "53,96",
            "vote_average.gte": 7.0,
            sort_by: "popularity.desc",
          }),
      },
      {
        title: "Space Exploration & Cosmic Frontiers",
        subtitle:
          "Voyages into the dark void and mysterious interstellar phenomena.",
        layout: "poster-row" as const,
        mood: "wondrous",
        theme: "space",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_keywords: "9882|3801|161172",
            sort_by: "popularity.desc",
          }),
      },
      {
        title: "Time-Loop Paradoxes & Broken Chronology",
        subtitle:
          "Temporal locks, alternate histories, and causality failures.",
        layout: "poster-row" as const,
        mood: "mind-bending",
        theme: "time-travel",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_keywords: "4379|193019",
            sort_by: "popularity.desc",
          }),
      },
      {
        title: "Gritty Neo-Noir Crime Syndicates",
        subtitle:
          "Corrupt cities, morally gray antiheroes, and rain-slicked asphalt.",
        layout: "featured-split" as const,
        mood: "cynical",
        theme: "neo-noir",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_genres: "80,53",
            with_keywords: "186354",
            sort_by: "popularity.desc",
          }),
      },
      {
        title: "Extreme Survival Environments",
        subtitle:
          "Man versus nature, isolated landscapes, and pure survival instinct.",
        layout: "poster-row" as const,
        mood: "desperate",
        theme: "survival",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_keywords: "155787|10477",
            sort_by: "popularity.desc",
          }),
      },

      // --- ANIME COHORTS ---
      {
        title: "Dark & Cyber-Infused Anime Chronicles",
        subtitle: "Visually stunning Japanese animations with mature themes.",
        layout: "poster-row" as const,
        mood: "mystical",
        theme: "anime",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_genres: "16",
            with_keywords: "210314|287550",
            sort_by: "popularity.desc",
          }),
      },
      {
        title: "Beginner Anime Essentials",
        subtitle: "The definitive cinematic onboarding paths for newcomers.",
        layout: "poster-row" as const,
        mood: "adventurous",
        theme: "anime",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_genres: "16,12",
            "vote_average.gte": 7.8,
            sort_by: "popularity.desc",
          }),
      },

      // --- BRAND PLATFORM HOVER SIMULATIONS ---
      {
        title: "Netflix Original Style Exclusives",
        subtitle: "High-budget blockbusters and cultural talking points.",
        layout: "spotlight-banner" as const,
        mood: "premium",
        theme: "exclusives",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            "vote_count.gte": 5000,
            sort_by: "popularity.desc",
          }),
      },
      {
        title: "Prime Video Premium Selects",
        subtitle:
          "Gritty indie breakouts, prestige acquisitions, and bold cinema.",
        layout: "poster-row" as const,
        mood: "eccentric",
        theme: "indie",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            with_genres: "99,18",
            sort_by: "vote_count.desc",
          }),
      },

      // --- EXTRA AI RECS & HIDDEN GEMS ---
      {
        title: "CineScope AI Hidden Gems",
        subtitle:
          "Critically adored entries that slipped past the mainstream box office.",
        layout: "poster-row" as const,
        mood: "experimental",
        theme: "underrated",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            "vote_count.lte": 1500,
            "vote_count.gte": 150,
            "vote_average.gte": 7.5,
            sort_by: "popularity.desc",
          }),
      },
      {
        title: "Vintage Cult Classics",
        subtitle: "Timeless counter-culture phenomena that shaped generations.",
        layout: "poster-row" as const,
        mood: "nostalgic",
        theme: "vintage",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            "release_date.lte": "1999-12-31",
            "vote_count.gte": 2000,
            sort_by: "vote_average.desc",
          }),
      },
      {
        title: "New Releases Grid Block",
        subtitle:
          "Fresh theatrical drops hitting the streaming grid this year.",
        layout: "stacked-vertical" as const,
        mood: "curious",
        theme: "freshtracks",
        mediaType: "movie" as const,
        fetcher: () =>
          TmdbService.discoverMedia("movie", {
            primary_release_year: currentYear,
            sort_by: "popularity.desc",
          }),
      },
    ];

    // 2. High-Performance Execution: Batch data fetching via Promise.allSettled to isolate failures
    const parallelResolutions = await Promise.allSettled(
      sectionDefinitions.map((def) => def.fetcher()),
    );

    // 3. Re-map results safely back into their design schemas
    const resolvedSections: HomepageSection[] = sectionDefinitions
      .map((def, idx) => {
        const resolution = parallelResolutions[idx];
        const items = resolution.status === "fulfilled" ? resolution.value : [];
        return {
          title: def.title,
          subtitle: def.subtitle,
          layout: def.layout,
          mood: def.mood,
          theme: def.theme,
          mediaType: def.mediaType,
          items: items.slice(0, 14), // Enforce lightweight payload boundaries
        };
      })
      .filter((sec) => sec.items.length > 0); // Purge empty structural anomalies mid-flight

    // 4. Hero Banner Selection Logic
    // Scan through our top-carousel rows to find a highly rated candidate with a strong backdrop image
    const pool = resolvedSections[0]?.items || [];
    const bannerCandidates = pool.filter(
      (m) => m.backdrop_path && m.vote_count > 2000,
    );
    const heroBanner =
      bannerCandidates.length > 0
        ? bannerCandidates[Math.floor(Math.random() * bannerCandidates.length)]
        : pool[0] || null;

    return { heroBanner, sections: resolvedSections };
  },
};
