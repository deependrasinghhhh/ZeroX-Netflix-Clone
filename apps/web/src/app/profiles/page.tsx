"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { profilesApi, ProfileResponse } from "../../features/profiles/api";
import { useProfileStore } from "../../features/profiles/store";
import { ApiError } from "../../services/api-client";

export default function ProfilesPage() {
  const router = useRouter();
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);

  const [profiles, setProfiles] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals and modes
  const [isManageMode, setIsManageMode] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileResponse | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [isKids, setIsKids] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profilesApi.listProfiles();
      setProfiles(data);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        router.push("/login");
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to load profiles.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSelectProfile = (profile: ProfileResponse) => {
    if (isManageMode) {
      // Open Edit Modal
      setSelectedProfile(profile);
      setName(profile.name);
      setIsKids(profile.isKids);
      setAvatarFile(null);
      setIsEditOpen(true);
    } else {
      // Select Profile & go to home
      setActiveProfile(profile);
      router.push("/");
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("isKids", String(isKids));
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await profilesApi.createProfile(formData);
      setIsCreateOpen(false);
      resetForm();
      fetchProfiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create profile.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("isKids", String(isKids));
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await profilesApi.updateProfile(selectedProfile.id, formData);
      setIsEditOpen(false);
      resetForm();
      fetchProfiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this profile? All history will be lost.")) return;
    setError(null);
    try {
      await profilesApi.deleteProfile(id);
      setIsEditOpen(false);
      resetForm();
      fetchProfiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete profile.";
      setError(message);
    }
  };

  const resetForm = () => {
    setName("");
    setIsKids(false);
    setAvatarFile(null);
    setSelectedProfile(null);
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col justify-center items-center px-4 text-white">
      {/* Background radial gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />

      <div className="relative z-10 w-full max-w-4xl text-center">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-wide mb-12">
          {isManageMode ? "Manage Profiles" : "Who's watching?"}
        </h1>

        {error && (
          <div className="max-w-md mx-auto p-3 mb-8 bg-red-950 bg-opacity-40 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-zinc-500 text-lg">Loading profiles...</div>
        ) : (
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                className="group cursor-pointer text-center space-y-4"
              >
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-white transition-all transform group-hover:scale-105 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                  {isManageMode && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white text-2xl">✎</span>
                    </div>
                  )}
                  {profile.isKids && (
                    <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Kids
                    </div>
                  )}
                </div>
                <p className="text-zinc-400 group-hover:text-white text-sm md:text-base font-medium transition-colors">
                  {profile.name}
                </p>
              </div>
            ))}

            {/* Add Profile Card */}
            {!isManageMode && profiles.length < 5 && (
              <div
                onClick={() => {
                  resetForm();
                  setIsCreateOpen(true);
                }}
                className="group cursor-pointer text-center space-y-4"
              >
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center hover:border-zinc-400 hover:bg-zinc-900 transition-all transform hover:scale-105 shadow-lg">
                  <span className="text-zinc-500 group-hover:text-zinc-300 text-5xl">+</span>
                </div>
                <p className="text-zinc-500 group-hover:text-zinc-300 text-sm md:text-base font-medium transition-colors">
                  Add Profile
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setIsManageMode(!isManageMode)}
          className="border border-zinc-600 hover:border-white text-zinc-500 hover:text-white px-6 py-2 rounded text-sm tracking-wider uppercase transition-colors"
        >
          {isManageMode ? "Done" : "Manage Profiles"}
        </button>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-6">
            <h2 className="text-2xl font-bold">Add Profile</h2>
            <form onSubmit={handleCreateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="kidsCheck"
                  type="checkbox"
                  checked={isKids}
                  onChange={(e) => setIsKids(e.target.checked)}
                  className="h-4 w-4 rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="kidsCheck" className="ml-2 text-sm text-zinc-400">
                  Kids Profile? (Restricts content to TV-PG/PG and below)
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Avatar Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Edit Profile</h2>
              <button
                type="button"
                onClick={() => handleDeleteProfile(selectedProfile.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Delete Profile
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
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

              <div className="flex items-center">
                <input
                  id="kidsCheckEdit"
                  type="checkbox"
                  checked={isKids}
                  onChange={(e) => setIsKids(e.target.checked)}
                  className="h-4 w-4 rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="kidsCheckEdit" className="ml-2 text-sm text-zinc-400">
                  Kids Profile?
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Change Avatar (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
