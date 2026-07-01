import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
  isReelPlaying: boolean;
  setReelPlaying: (playing: boolean) => void;
}

export const useStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  user: JSON.parse(localStorage.getItem("user") || "null"),
  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },
  isReelPlaying: false,
  setReelPlaying: (playing) => set({ isReelPlaying: playing }),
}));
