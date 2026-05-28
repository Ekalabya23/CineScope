export type MediaType = "movie" | "tv" | "mixed";

export type LayoutType =
  | "poster-row"
  | "large-carousel"
  | "featured-split"
  | "bento-grid"
  | "cinematic-banner"
  | "stacked-vertical";

export type MoodKey =
  | "mind-bending"
  | "emotional"
  | "cozy"
  | "dystopian"
  | "philosophical"
  | "dark"
  | "uplifting"
  | "melancholic"
  | "adrenaline"
  | "cyberpunk"
  | "slow-burn";

export interface CollectionConfig {
  title: string;
  subtitle: string;
  mood: MoodKey;
  emotionalTone: string;
  layout: LayoutType;
  mediaType: MediaType;
  theme: string;
  visualTheme: string;
  genres?: string;
  keywords?: string;
  sorting: string;
  minVoteAverage?: number;
  minVoteCount?: number;
  source?: "trending-week" | "trending-day" | "top-rated" | "new-releases" | "most-watched";
  aiStrategy: string;
  recommendationReason: string;
}

export const genreNamesById: Record<number, string> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  53: "Thriller",
  80: "Crime",
  878: "Sci-Fi",
  9648: "Mystery",
  10402: "Music",
  10749: "Romance",
  10751: "Family",
  10765: "Sci-Fi & Fantasy",
};

export const moodProfiles: Record<
  MoodKey,
  {
    genres: string;
    keywords: string;
    themes: string[];
    emotionalTone: string;
    visualTheme: string;
    sorting: string;
  }
> = {
  "mind-bending": {
    genres: "878,53,9648",
    keywords: "4379|193019|9715|14819",
    themes: ["time travel", "alternate reality", "psychological paradox"],
    emotionalTone: "cerebral tension",
    visualTheme: "fractured neon",
    sorting: "popularity.desc",
  },
  emotional: {
    genres: "18,10749",
    keywords: "818|9673|207928",
    themes: ["heartbreak", "family wounds", "longing"],
    emotionalTone: "intimate ache",
    visualTheme: "warm contrast",
    sorting: "vote_count.desc",
  },
  cozy: {
    genres: "35,10751,16",
    keywords: "9714|18035",
    themes: ["comfort", "found family", "gentle humor"],
    emotionalTone: "soft comfort",
    visualTheme: "sunlit interiors",
    sorting: "popularity.desc",
  },
  dystopian: {
    genres: "878,18,53",
    keywords: "4565|210314|4458",
    themes: ["surveillance", "collapse", "authoritarian futures"],
    emotionalTone: "oppressive dread",
    visualTheme: "industrial noir",
    sorting: "popularity.desc",
  },
  philosophical: {
    genres: "18,878,9648",
    keywords: "14544|14819|160170",
    themes: ["identity", "free will", "existential mystery"],
    emotionalTone: "reflective unease",
    visualTheme: "minimal cosmic",
    sorting: "vote_average.desc",
  },
  dark: {
    genres: "53,80,27",
    keywords: "12377|13015|186354",
    themes: ["obsession", "crime", "moral decay"],
    emotionalTone: "shadow pressure",
    visualTheme: "noir contrast",
    sorting: "popularity.desc",
  },
  uplifting: {
    genres: "35,18,10751",
    keywords: "18035|9714|1701",
    themes: ["hope", "second chances", "triumph"],
    emotionalTone: "earned optimism",
    visualTheme: "bright cinematic",
    sorting: "vote_count.desc",
  },
  melancholic: {
    genres: "18,10749",
    keywords: "818|9673|180547",
    themes: ["memory", "loss", "quiet longing"],
    emotionalTone: "bittersweet sadness",
    visualTheme: "blue hour",
    sorting: "vote_average.desc",
  },
  adrenaline: {
    genres: "28,12,53",
    keywords: "9748|9663|1568",
    themes: ["survival", "missions", "kinetic spectacle"],
    emotionalTone: "high voltage",
    visualTheme: "impact red",
    sorting: "popularity.desc",
  },
  cyberpunk: {
    genres: "878,28,53",
    keywords: "210314|4565|12349",
    themes: ["synthetics", "neon cities", "corporate dystopia"],
    emotionalTone: "synthetic alienation",
    visualTheme: "neon noir",
    sorting: "popularity.desc",
  },
  "slow-burn": {
    genres: "18,53,9648",
    keywords: "12565|6152|158718",
    themes: ["quiet dread", "character study", "delayed revelation"],
    emotionalTone: "patient tension",
    visualTheme: "muted prestige",
    sorting: "vote_average.desc",
  },
};

export const defaultCollectionConfigs: CollectionConfig[] = [
  {
    title: "Trending This Week",
    subtitle: "The titles driving the biggest cultural momentum this week.",
    mood: "adrenaline",
    emotionalTone: "high momentum",
    layout: "large-carousel",
    mediaType: "movie",
    theme: "weekly trending",
    visualTheme: "premiere glow",
    sorting: "popularity.desc",
    source: "trending-week",
    aiStrategy: "rank current cultural velocity and broad audience pull",
    recommendationReason: "Trending globally this week with strong discovery velocity.",
  },
  {
    title: "Popular Right Now",
    subtitle: "Mainstream hits currently dominating watch intent.",
    mood: "uplifting",
    emotionalTone: "crowd energy",
    layout: "poster-row",
    mediaType: "movie",
    theme: "popular now",
    visualTheme: "spotlight red",
    sorting: "popularity.desc",
    source: "trending-day",
    aiStrategy: "prioritize immediate popularity and broad appeal",
    recommendationReason: "High current popularity and strong audience attention.",
  },
  {
    title: "Top Rated",
    subtitle: "Audience-approved classics and modern masterpieces.",
    mood: "philosophical",
    emotionalTone: "prestige confidence",
    layout: "poster-row",
    mediaType: "movie",
    theme: "critical acclaim",
    visualTheme: "award glow",
    sorting: "vote_average.desc",
    minVoteAverage: 7.8,
    minVoteCount: 1500,
    source: "top-rated",
    aiStrategy: "surface highly rated titles with enough vote confidence",
    recommendationReason: "High ratings with enough audience volume to trust the signal.",
  },
  {
    title: "New Releases",
    subtitle: "Fresh releases with enough momentum to enter your watch queue.",
    mood: "uplifting",
    emotionalTone: "fresh discovery",
    layout: "poster-row",
    mediaType: "movie",
    theme: "new releases",
    visualTheme: "fresh premiere",
    sorting: "popularity.desc",
    minVoteCount: 100,
    source: "new-releases",
    aiStrategy: "favor recent release windows and early popularity",
    recommendationReason: "Recent releases gaining traction with early audience signals.",
  },
  {
    title: "Most Watched",
    subtitle: "High-volume audience magnets with proven rewatch value.",
    mood: "adrenaline",
    emotionalTone: "mass appeal",
    layout: "poster-row",
    mediaType: "movie",
    theme: "watch volume",
    visualTheme: "cinematic pulse",
    sorting: "vote_count.desc",
    minVoteCount: 3000,
    source: "most-watched",
    aiStrategy: "use vote volume as a proxy for watch penetration",
    recommendationReason: "Large audience footprint and durable popularity.",
  },
  {
    title: "Mind-Bending Sci-Fi",
    subtitle: "Psychological paradoxes, fractured timelines, and unstable realities.",
    mood: "mind-bending",
    emotionalTone: "cerebral tension",
    layout: "large-carousel",
    mediaType: "movie",
    theme: "time and identity",
    visualTheme: "fractured neon",
    genres: "878,53,9648",
    keywords: "4379|193019|9715",
    sorting: "popularity.desc",
    minVoteAverage: 7,
    minVoteCount: 700,
    aiStrategy: "prioritize concept density and repeat rewatch value",
    recommendationReason: "Dense sci-fi and thriller patterns match late-night curiosity loops.",
  },
  {
    title: "Emotional Stories",
    subtitle: "Intimate dramas built around longing, grief, and impossible choices.",
    mood: "emotional",
    emotionalTone: "intimate ache",
    layout: "poster-row",
    mediaType: "movie",
    theme: "heartbreak",
    visualTheme: "warm contrast",
    genres: "18,10749",
    sorting: "vote_count.desc",
    minVoteCount: 500,
    aiStrategy: "surface cathartic crowd favorites with strong character arcs",
    recommendationReason: "Emotionally resonant drama with high audience validation.",
  },
  {
    title: "Dark Psychological Thrillers",
    subtitle: "Shadowy mysteries, obsession loops, and slow-burning dread.",
    mood: "dark",
    emotionalTone: "shadow pressure",
    layout: "stacked-vertical",
    mediaType: "movie",
    theme: "psychological thriller",
    visualTheme: "noir contrast",
    genres: "53,9648,80",
    sorting: "popularity.desc",
    minVoteAverage: 6.8,
    minVoteCount: 500,
    aiStrategy: "favor suspense, mystery loops, and darker tonal signatures",
    recommendationReason: "Psychological suspense performs well for late-session viewing.",
  },
  {
    title: "Cozy Weekend Picks",
    subtitle: "Low-friction comfort watches for relaxed weekend browsing.",
    mood: "cozy",
    emotionalTone: "soft comfort",
    layout: "poster-row",
    mediaType: "mixed",
    theme: "weekend comfort",
    visualTheme: "warm blur",
    genres: "35,18,10751",
    sorting: "popularity.desc",
    minVoteCount: 300,
    aiStrategy: "balance comfort, quality, and broad accessibility",
    recommendationReason: "A lighter row designed for easy commitment after browsing fatigue.",
  },
  {
    title: "Adrenaline Rush",
    subtitle: "Fast, explosive, and built around momentum.",
    mood: "adrenaline",
    emotionalTone: "high voltage",
    layout: "cinematic-banner",
    mediaType: "movie",
    theme: "action spectacle",
    visualTheme: "impact red",
    genres: "28,12,53",
    sorting: "popularity.desc",
    minVoteCount: 1000,
    aiStrategy: "maximize velocity, spectacle, and immediate hook",
    recommendationReason: "Action-heavy titles with high cultural traction.",
  },
  {
    title: "Feel-Good Escapes",
    subtitle: "Hopeful, uplifting stories with bright emotional payoff.",
    mood: "uplifting",
    emotionalTone: "earned optimism",
    layout: "poster-row",
    mediaType: "movie",
    theme: "feel good",
    visualTheme: "bright cinematic",
    genres: "35,18,10751",
    keywords: "18035|9714|1701",
    sorting: "vote_count.desc",
    minVoteCount: 350,
    aiStrategy: "prioritize optimistic tone and easy emotional payoff",
    recommendationReason: "Uplifting stories tuned for relaxed emotional recovery.",
  },
  {
    title: "Cyberpunk",
    subtitle: "Neon cities, synthetic identity, and corporate dystopias.",
    mood: "cyberpunk",
    emotionalTone: "synthetic alienation",
    layout: "large-carousel",
    mediaType: "movie",
    theme: "cyberpunk",
    visualTheme: "neon noir",
    genres: "878,28",
    keywords: "210314|4565|12349",
    sorting: "popularity.desc",
    minVoteCount: 250,
    aiStrategy: "blend visual intensity with speculative technology themes",
    recommendationReason: "High-fit dystopian sci-fi with a strong visual signature.",
  },
  {
    title: "Crime Masterpieces",
    subtitle: "Moral ambiguity, syndicates, investigations, and pressure-cooker stakes.",
    mood: "dark",
    emotionalTone: "moral tension",
    layout: "poster-row",
    mediaType: "movie",
    theme: "crime",
    visualTheme: "noir contrast",
    genres: "80,53,18",
    sorting: "vote_average.desc",
    minVoteAverage: 7.2,
    minVoteCount: 900,
    aiStrategy: "prioritize acclaimed crime dramas and thrillers",
    recommendationReason: "Crime stories with strong quality and audience trust signals.",
  },
  {
    title: "Space Adventures",
    subtitle: "Cosmic voyages, interstellar danger, and awe-scale spectacle.",
    mood: "philosophical",
    emotionalTone: "cosmic wonder",
    layout: "large-carousel",
    mediaType: "movie",
    theme: "space",
    visualTheme: "cosmic cyan",
    genres: "878,12",
    keywords: "9882|3801|161172",
    sorting: "popularity.desc",
    minVoteCount: 300,
    aiStrategy: "surface space-scale spectacle and existential sci-fi",
    recommendationReason: "Space stories with strong cinematic scale and discovery pull.",
  },
  {
    title: "Time Travel Stories",
    subtitle: "Temporal loops, broken chronology, and causality puzzles.",
    mood: "mind-bending",
    emotionalTone: "temporal unease",
    layout: "poster-row",
    mediaType: "movie",
    theme: "time travel",
    visualTheme: "fractured neon",
    genres: "878,53,18",
    keywords: "4379|193019",
    sorting: "popularity.desc",
    minVoteCount: 250,
    aiStrategy: "rank temporal concepts and puzzle-box storytelling",
    recommendationReason: "Time-loop and causality stories for mind-bending discovery.",
  },
  {
    title: "Neo-Noir",
    subtitle: "Rain-slick cities, compromised heroes, and stylish corruption.",
    mood: "dark",
    emotionalTone: "stylized dread",
    layout: "featured-split",
    mediaType: "movie",
    theme: "neo-noir",
    visualTheme: "noir contrast",
    genres: "80,53,9648",
    keywords: "186354",
    sorting: "popularity.desc",
    minVoteCount: 250,
    aiStrategy: "combine crime, mystery, and noir visual language",
    recommendationReason: "Noir-toned mysteries with high mood alignment.",
  },
  {
    title: "Survival Movies",
    subtitle: "Isolation, hostile environments, and raw endurance.",
    mood: "adrenaline",
    emotionalTone: "survival pressure",
    layout: "poster-row",
    mediaType: "movie",
    theme: "survival",
    visualTheme: "impact red",
    genres: "12,18,53",
    keywords: "155787|10477",
    sorting: "popularity.desc",
    minVoteCount: 250,
    aiStrategy: "prioritize high-stakes environment and endurance narratives",
    recommendationReason: "Survival stories with immediate stakes and strong tension.",
  },
];
