import { apiClient } from "../../services/api-client";

export interface ProfileResponse {
  id: string;
  name: string;
  avatarUrl: string;
  isKids: boolean;
  language: string;
  subtitlePreference: string;
  autoPlayNext: boolean;
  autoPlayTrailers: boolean;
}

export const profilesApi = {
  listProfiles: async () => {
    return apiClient<ProfileResponse[]>("/profiles", {
      method: "GET",
    });
  },

  createProfile: async (formData: FormData) => {
    // Note: Do not set Content-Type header manually for FormData,
    // fetch will automatically specify boundary headers.
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/profiles`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to create profile" }));
      throw new Error(errorData.message || "Failed to create profile");
    }

    return response.json() as Promise<ProfileResponse>;
  },

  updateProfile: async (id: string, formData: FormData) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/profiles/${id}`;
    const response = await fetch(url, {
      method: "PUT",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to update profile" }));
      throw new Error(errorData.message || "Failed to update profile");
    }

    return response.json() as Promise<ProfileResponse>;
  },

  deleteProfile: async (id: string) => {
    return apiClient<ProfileResponse>(`/profiles/${id}`, {
      method: "DELETE",
    });
  },
};
