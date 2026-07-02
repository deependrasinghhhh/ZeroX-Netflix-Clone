import { create } from "zustand";

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

export const useProfileStore = create<ProfileState>((set) => ({
  activeProfile: null,
  setActiveProfile: (profile) => set({ activeProfile: profile }),
  clearActiveProfile: () => set({ activeProfile: null }),
}));
