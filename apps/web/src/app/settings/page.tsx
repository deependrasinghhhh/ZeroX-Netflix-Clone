"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "../../features/profiles/store";
import { profilesApi } from "../../features/profiles/api";
import { ApiError } from "../../services/api-client";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [subtitlePreference, setSubtitlePreference] = useState("none");
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [autoPlayTrailers, setAutoPlayTrailers] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name);
      setLanguage(activeProfile.language);
      setSubtitlePreference(activeProfile.subtitlePreference);
      setAutoPlayNext(activeProfile.autoPlayNext);
      setAutoPlayTrailers(activeProfile.autoPlayTrailers);
    }
  }, [activeProfile]);

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-center p-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">No active profile selected</h1>
          <p className="text-zinc-400 text-sm">Please select a profile to customize settings.</p>
          <Link
            href="/profiles"
            className="inline-block px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold transition-colors"
          >
            Select Profile
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("language", language);
      formData.append("subtitlePreference", subtitlePreference);
      formData.append("autoPlayNext", String(autoPlayNext));
      formData.append("autoPlayTrailers", String(autoPlayTrailers));
      
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const updated = await profilesApi.updateProfile(activeProfile.id, formData);
      
      // Update store
      setActiveProfile(updated);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        router.push("/login");
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to update settings.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
            <p className="text-sm text-zinc-400 mt-1">Configure viewing preferences and language settings</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-semibold">
            Back to Home
          </Link>
        </div>

        {success && (
          <div className="p-3 bg-emerald-950 bg-opacity-40 border border-emerald-500 rounded-lg text-emerald-200 text-sm">
            Preferences updated successfully!
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950 bg-opacity-40 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-900 bg-opacity-40 border border-zinc-800 p-8 rounded-2xl backdrop-blur-md">
          
          {/* Avatar and Name */}
          <div className="flex flex-col md:flex-row gap-6 items-center border-b border-zinc-800 pb-8">
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeProfile.avatarUrl}
                alt={activeProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Change Avatar Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-6 border-b border-zinc-800 pb-8">
            <h3 className="text-lg font-semibold">Preferences</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Display Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="de">Deutsch (German)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Subtitle Preferences
                </label>
                <select
                  value={subtitlePreference}
                  onChange={(e) => setSubtitlePreference(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="none">Off</option>
                  <option value="white">White Text</option>
                  <option value="yellow">Yellow Text</option>
                  <option value="boxed">Black Box Background</option>
                </select>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="space-y-6 pb-4">
            <h3 className="text-lg font-semibold">Playback Controls</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Autoplay next episode</p>
                  <p className="text-xs text-zinc-500">Play the next episode of a series automatically on this profile.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPlayNext}
                  onChange={(e) => setAutoPlayNext(e.target.checked)}
                  className="h-5 w-5 rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Autoplay previews</p>
                  <p className="text-xs text-zinc-500">Play previews and trailers automatically while browsing.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPlayTrailers}
                  onChange={(e) => setAutoPlayTrailers(e.target.checked)}
                  className="h-5 w-5 rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50"
          >
            {isLoading ? "Saving changes..." : "Save Preferences"}
          </button>

        </form>

      </div>
    </div>
  );
}
