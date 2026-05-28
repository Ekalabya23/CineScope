import { MoodKey, moodProfiles } from "../config/recommendation.config";

const moodAliases: Record<string, MoodKey> = {
  cerebral: "mind-bending",
  sad: "melancholic",
  melancholy: "melancholic",
  comfort: "cozy",
  hopeful: "uplifting",
  intense: "adrenaline",
  psychological: "dark",
  neon: "cyberpunk",
};

export const MoodAnalyzer = {
  normalizeMood: (rawMood?: string): MoodKey => {
    const mood = (rawMood || "mind-bending").toLowerCase().trim();
    if (mood in moodProfiles) return mood as MoodKey;
    return moodAliases[mood] || "mind-bending";
  },

  getMoodProfile: (rawMood?: string) => {
    const mood = MoodAnalyzer.normalizeMood(rawMood);
    return { mood, ...moodProfiles[mood] };
  },

  inferMoodFromText: (text = ""): MoodKey => {
    const lower = text.toLowerCase();
    const match = Object.keys(moodProfiles).find((mood) => lower.includes(mood));
    if (match) return match as MoodKey;
    if (/(sad|cry|heartbreak|emotional)/.test(lower)) return "emotional";
    if (/(dark|serial|crime|psychological)/.test(lower)) return "dark";
    if (/(action|fast|rush|fight)/.test(lower)) return "adrenaline";
    if (/(future|neon|robot|ai|cyber)/.test(lower)) return "cyberpunk";
    return "mind-bending";
  },
};
