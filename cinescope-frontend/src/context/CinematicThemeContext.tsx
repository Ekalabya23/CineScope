import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { getMoodTheme, MoodTheme } from "../theme/cinematicTheme";

type CinematicThemeState = {
  mood: string;
  backdrop?: string;
  theme: MoodTheme;
  setCinematicMood: (mood?: string, backdrop?: string) => void;
};

const CinematicThemeContext = createContext<CinematicThemeState | null>(null);

export const CinematicThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mood, setMood] = useState("mind-bending");
  const [backdrop, setBackdrop] = useState<string | undefined>();
  const setCinematicMood = useCallback(
    (nextMood = "mind-bending", nextBackdrop?: string) => {
      setMood((currentMood) => (currentMood === nextMood ? currentMood : nextMood));
      if (nextBackdrop) {
        setBackdrop((currentBackdrop) =>
          currentBackdrop === nextBackdrop ? currentBackdrop : nextBackdrop,
        );
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      mood,
      backdrop,
      theme: getMoodTheme(mood),
      setCinematicMood,
    }),
    [mood, backdrop, setCinematicMood],
  );

  return (
    <CinematicThemeContext.Provider value={value}>
      {children}
    </CinematicThemeContext.Provider>
  );
};

export const useCinematicTheme = () => {
  const context = useContext(CinematicThemeContext);
  if (!context) {
    throw new Error("useCinematicTheme must be used inside CinematicThemeProvider");
  }
  return context;
};
