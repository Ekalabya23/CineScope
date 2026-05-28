const VIBE_LIBRARY = [
  "Mind-Bending",
  "Emotional",
  "Atmospheric",
  "Slow Burn",
  "Intense",
  "Psychological",
  "Visually Stunning",
  "Philosophical",
  "Cyberpunk",
  "Mass Entertainer",
  "Emotional Rollercoaster",
  "High Stakes",
  "Story Rich",
  "Dark",
  "Crowd Pleaser",
];

const genreToVibes: Record<string, string[]> = {
  action: ["Mass Entertainer", "High Stakes", "Intense"],
  adventure: ["High Stakes", "Visually Stunning", "Crowd Pleaser"],
  animation: ["Emotional", "Visually Stunning", "Crowd Pleaser"],
  comedy: ["Crowd Pleaser", "Mass Entertainer", "Emotional"],
  crime: ["Intense", "Psychological", "Dark"],
  drama: ["Emotional", "Story Rich", "Emotional Rollercoaster"],
  fantasy: ["Visually Stunning", "Atmospheric", "Story Rich"],
  horror: ["Intense", "Dark", "Psychological"],
  mystery: ["Mind-Bending", "Psychological", "Slow Burn"],
  romance: ["Emotional", "Emotional Rollercoaster", "Story Rich"],
  "science fiction": ["Mind-Bending", "Philosophical", "Cyberpunk"],
  thriller: ["Intense", "Psychological", "Slow Burn"],
};

export const VibeTagGenerator = {
  generate: (media: any, textSignals: string[] = []): string[] => {
    const vibes = new Set<string>();
    const genres = (media.genres || []).map((genre: any) =>
      String(genre.name || "").toLowerCase(),
    );

    genres.forEach((genre: string) => {
      (genreToVibes[genre] || []).forEach((vibe) => vibes.add(vibe));
    });

    const haystack = `${media.overview || ""} ${textSignals.join(" ")}`.toLowerCase();
    if (haystack.includes("psychological")) vibes.add("Psychological");
    if (haystack.includes("future") || haystack.includes("space")) vibes.add("Mind-Bending");
    if (haystack.includes("love") || haystack.includes("family")) vibes.add("Emotional");
    if (haystack.includes("world") || haystack.includes("visual")) vibes.add("Visually Stunning");
    if (haystack.includes("mystery") || haystack.includes("secret")) vibes.add("Slow Burn");

    VIBE_LIBRARY.forEach((vibe) => {
      if (vibes.size < 6 && !vibes.has(vibe)) vibes.add(vibe);
    });

    return Array.from(vibes).slice(0, 6);
  },
};
