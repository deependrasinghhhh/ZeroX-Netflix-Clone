import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ActiveProfile {
  id: string;
  name: string;
  isKids: boolean;
  avatarUrl?: string;
  language: string;
  subtitlePreference: string;
  autoPlayNext: boolean;
  autoPlayTrailers: boolean;
}

interface ProfileState {
  activeProfile: ActiveProfile | null;
  setActiveProfile: (profile: ActiveProfile | null) => void;
  clearActiveProfile: () => void;
}

// SSR-safe storage — falls back to no-op on server, localStorage in browser
const safeStorage =
  typeof window !== "undefined"
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }));

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      activeProfile: null,
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      clearActiveProfile: () => set({ activeProfile: null }),
    }),
    {
      name: "zerox-active-profile",
      storage: safeStorage,
    }
  )
);
