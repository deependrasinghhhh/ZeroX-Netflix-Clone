import { apiClient } from "../../services/api-client";

export interface MovieResponse {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  durationMinutes: number;
  videoAssetId: string | null;
  backdropUrl: string;
  posterUrl: string;
  rating: string;
  viewsCount: number;
  averageRating: number;
}

export interface MovieDetailsResponse extends MovieResponse {
  genres: Array<{ genre: GenreResponse }>;
  cast: Array<{ id: string; characterName: string; cast: { id: string; name: string; avatarUrl?: string } }>;
  crew: Array<{ id: string; role: string; crew: { id: string; name: string } }>;
  videoAsset?: { id: string; hlsUrl: string } | null;
}

export interface EpisodeResponse {
  id: string;
  episodeNumber: number;
  title: string;
  description: string;
  durationMinutes: number;
  videoAsset?: { id: string; hlsUrl: string } | null;
}

export interface SeasonResponse {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: EpisodeResponse[];
}

export interface ShowDetailsResponse {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  backdropUrl: string;
  posterUrl: string;
  rating: string;
  viewsCount: number;
  averageRating: number;
  genres: Array<{ genre: GenreResponse }>;
  cast: Array<{ id: string; characterName: string; cast: { id: string; name: string; avatarUrl?: string } }>;
  crew: Array<{ id: string; role: string; crew: { id: string; name: string } }>;
  seasons: SeasonResponse[];
}

export interface GenreResponse {
  id: string;
  name: string;
  slug: string;
}

export interface ReviewResponse {
  id: string;
  profileId: string;
  rating: number;
  comment: string;
  createdAt: string;
  profile: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}

export const moviesApi = {
  getGenres: async () => {
    return apiClient<GenreResponse[]>("/movies/genres");
  },

  getTrending: async (profileId: string) => {
    return apiClient<MovieResponse[]>("/movies/trending", {
      headers: { "x-profile-id": profileId },
    });
  },

  getPopular: async (profileId: string) => {
    return apiClient<MovieResponse[]>("/movies/popular", {
      headers: { "x-profile-id": profileId },
    });
  },

  getTopRated: async (profileId: string) => {
    return apiClient<MovieResponse[]>("/movies/top-rated", {
      headers: { "x-profile-id": profileId },
    });
  },

  getUpcoming: async (profileId: string) => {
    return apiClient<MovieResponse[]>("/movies/upcoming", {
      headers: { "x-profile-id": profileId },
    });
  },

  getMovieDetails: async (id: string, profileId: string) => {
    return apiClient<MovieDetailsResponse>(`/movies/${id}`, {
      headers: { "x-profile-id": profileId },
    });
  },

  getShowDetails: async (id: string, profileId: string) => {
    return apiClient<ShowDetailsResponse>(`/shows/${id}`, {
      headers: { "x-profile-id": profileId },
    });
  },

  getRecommendations: async (id: string, profileId: string) => {
    return apiClient<MovieResponse[]>(`/movies/${id}/recommendations`, {
      headers: { "x-profile-id": profileId },
    });
  },

  getReviews: async (params: { movieId?: string; showId?: string }) => {
    const query = params.movieId ? `?movieId=${params.movieId}` : `?showId=${params.showId}`;
    return apiClient<ReviewResponse[]>(`/reviews${query}`);
  },

  createReview: async (data: {
    profileId: string;
    rating: number;
    comment: string;
    movieId?: string;
    showId?: string;
  }) => {
    return apiClient<ReviewResponse>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
