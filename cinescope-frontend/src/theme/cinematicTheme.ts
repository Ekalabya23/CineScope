export type MoodTheme = {
  name: string;
  glow: string;
  accent: string;
  soft: string;
  gradient: string;
  border: string;
  text: string;
};

const themes: Record<string, MoodTheme> = {
  cyberpunk: {
    name: "Cyberpunk",
    glow: "rgba(34, 211, 238, 0.38)",
    accent: "#22d3ee",
    soft: "rgba(124, 58, 237, 0.18)",
    gradient: "linear-gradient(135deg, rgba(14,165,233,.32), rgba(124,58,237,.24), rgba(2,6,23,.82))",
    border: "rgba(34,211,238,.28)",
    text: "text-cyan-200",
  },
  emotional: {
    name: "Emotional",
    glow: "rgba(251, 146, 60, 0.34)",
    accent: "#fb923c",
    soft: "rgba(244, 63, 94, 0.14)",
    gradient: "linear-gradient(135deg, rgba(251,146,60,.28), rgba(244,63,94,.16), rgba(10,10,12,.86))",
    border: "rgba(251,146,60,.3)",
    text: "text-orange-200",
  },
  melancholic: {
    name: "Melancholic",
    glow: "rgba(96, 165, 250, 0.3)",
    accent: "#60a5fa",
    soft: "rgba(99,102,241,.16)",
    gradient: "linear-gradient(135deg, rgba(37,99,235,.22), rgba(99,102,241,.15), rgba(6,7,12,.9))",
    border: "rgba(96,165,250,.28)",
    text: "text-blue-200",
  },
  dark: {
    name: "Dark",
    glow: "rgba(239, 68, 68, 0.3)",
    accent: "#ef4444",
    soft: "rgba(127, 29, 29, 0.2)",
    gradient: "linear-gradient(135deg, rgba(127,29,29,.34), rgba(24,24,27,.45), rgba(0,0,0,.88))",
    border: "rgba(239,68,68,.24)",
    text: "text-red-200",
  },
  adrenaline: {
    name: "Adrenaline",
    glow: "rgba(248, 113, 113, 0.36)",
    accent: "#f87171",
    soft: "rgba(250,204,21,.12)",
    gradient: "linear-gradient(135deg, rgba(220,38,38,.3), rgba(250,204,21,.12), rgba(7,7,9,.9))",
    border: "rgba(248,113,113,.32)",
    text: "text-red-100",
  },
  cozy: {
    name: "Cozy",
    glow: "rgba(253, 186, 116, 0.28)",
    accent: "#fdba74",
    soft: "rgba(250,204,21,.1)",
    gradient: "linear-gradient(135deg, rgba(253,186,116,.22), rgba(217,119,6,.12), rgba(12,10,9,.88))",
    border: "rgba(253,186,116,.24)",
    text: "text-amber-100",
  },
  dystopian: {
    name: "Dystopian",
    glow: "rgba(20, 184, 166, 0.26)",
    accent: "#14b8a6",
    soft: "rgba(51,65,85,.22)",
    gradient: "linear-gradient(135deg, rgba(20,184,166,.22), rgba(51,65,85,.28), rgba(2,6,23,.9))",
    border: "rgba(20,184,166,.26)",
    text: "text-teal-100",
  },
  philosophical: {
    name: "Philosophical",
    glow: "rgba(167, 139, 250, 0.28)",
    accent: "#a78bfa",
    soft: "rgba(79,70,229,.16)",
    gradient: "linear-gradient(135deg, rgba(109,40,217,.24), rgba(30,64,175,.14), rgba(5,6,12,.9))",
    border: "rgba(167,139,250,.27)",
    text: "text-violet-100",
  },
  uplifting: {
    name: "Uplifting",
    glow: "rgba(74, 222, 128, 0.26)",
    accent: "#4ade80",
    soft: "rgba(250,204,21,.12)",
    gradient: "linear-gradient(135deg, rgba(34,197,94,.2), rgba(250,204,21,.12), rgba(7,10,8,.88))",
    border: "rgba(74,222,128,.25)",
    text: "text-emerald-100",
  },
  "mind-bending": {
    name: "Mind Bending",
    glow: "rgba(168, 85, 247, 0.3)",
    accent: "#a855f7",
    soft: "rgba(6,182,212,.15)",
    gradient: "linear-gradient(135deg, rgba(168,85,247,.27), rgba(6,182,212,.14), rgba(4,6,12,.9))",
    border: "rgba(168,85,247,.28)",
    text: "text-purple-100",
  },
  "slow-burn": {
    name: "Slow Burn",
    glow: "rgba(148, 163, 184, 0.25)",
    accent: "#94a3b8",
    soft: "rgba(71,85,105,.16)",
    gradient: "linear-gradient(135deg, rgba(71,85,105,.28), rgba(15,23,42,.34), rgba(3,4,7,.9))",
    border: "rgba(148,163,184,.25)",
    text: "text-slate-100",
  },
};

export const getMoodTheme = (mood?: string): MoodTheme => {
  const key = (mood || "mind-bending").toLowerCase();
  return themes[key] || themes["mind-bending"];
};

export const moodShortcuts = [
  "mind-bending",
  "emotional",
  "cyberpunk",
  "dark",
  "cozy",
  "adrenaline",
  "dystopian",
  "slow-burn",
];
