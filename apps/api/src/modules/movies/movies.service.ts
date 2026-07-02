import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { MoviesRepository } from "./movies.repository";
import { PrismaService } from "../../database/prisma.service";
import { Movie, Show, Genre, Review } from "@prisma/client";

@Injectable()
export class MoviesService {
  constructor(
    private readonly moviesRepository: MoviesRepository,
    private readonly prisma: PrismaService
  ) {}

  // Helper to resolve age rating list based on selected profile ID
  private async getAgeRatingsForProfile(profileId?: string): Promise<string[]> {
    const adultRatings = ["G", "PG", "PG-13", "R", "NC-17", "TV-Y", "TV-G", "TV-PG", "TV-14", "TV-MA"];
    const kidsRatings = ["G", "PG", "TV-Y", "TV-G", "TV-PG"];

    if (!profileId) {
      return adultRatings; // default to adult if profile not set (e.g. admin panels)
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found.");
    }

    return profile.isKids ? kidsRatings : adultRatings;
  }

  async getGenres(): Promise<Genre[]> {
    return this.moviesRepository.getGenres();
  }

  async findMovie(id: string, profileId?: string): Promise<Movie> {
    const ageRatings = await this.getAgeRatingsForProfile(profileId);
    const movie = await this.moviesRepository.findMovieById(id);

    if (!movie) {
      throw new NotFoundException("Movie not found.");
    }

    // Assert profile is allowed to view this rating
    if (!ageRatings.includes(movie.rating)) {
      throw new NotFoundException("Content is not available on this profile.");
    }

    // Increment view count asynchronously
    this.prisma.movie.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    return movie;
  }

  async findShow(id: string, profileId?: string): Promise<Show> {
    const ageRatings = await this.getAgeRatingsForProfile(profileId);
    const show = await this.moviesRepository.findShowById(id);

    if (!show) {
      throw new NotFoundException("Series not found.");
    }

    if (!ageRatings.includes(show.rating)) {
      throw new NotFoundException("Content is not available on this profile.");
    }

    this.prisma.show.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    return show;
  }

  async listMovies(params: {
    profileId?: string;
    genreSlug?: string;
    releaseYear?: number;
    searchQuery?: string;
    limit?: number;
    page?: number;
  }) {
    const ageRatings = await this.getAgeRatingsForProfile(params.profileId);
    const limit = params.limit || 20;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    return this.moviesRepository.findAllMovies({
      genreSlug: params.genreSlug,
      releaseYear: params.releaseYear,
      searchQuery: params.searchQuery,
      ageRatings,
      limit,
      offset,
    });
  }

  async getTrending(profileId?: string, limit?: number): Promise<Movie[]> {
    const ageRatings = await this.getAgeRatingsForProfile(profileId);
    return this.moviesRepository.getTrending(ageRatings, limit);
  }

  async getPopular(profileId?: string, limit?: number): Promise<Movie[]> {
    const ageRatings = await this.getAgeRatingsForProfile(profileId);
    return this.moviesRepository.getPopular(ageRatings, limit);
  }

  async getTopRated(profileId?: string, limit?: number): Promise<Movie[]> {
    const ageRatings = await this.getAgeRatingsForProfile(profileId);
    return this.moviesRepository.getTopRated(ageRatings, limit);
  }

  async getUpcoming(profileId?: string, limit?: number): Promise<Movie[]> {
    const ageRatings = await this.getAgeRatingsForProfile(profileId);
    return this.moviesRepository.getUpcoming(ageRatings, limit);
  }

  async getRecommendations(movieId: string, profileId?: string, limit?: number): Promise<Movie[]> {
    const ageRatings = await this.getAgeRatingsForProfile(profileId);
    return this.moviesRepository.getRecommendations(movieId, ageRatings, limit);
  }

  // Reviews System
  async getReviews(params: { movieId?: string; showId?: string }): Promise<Review[]> {
    return this.moviesRepository.getReviews(params);
  }

  async createReview(data: {
    profileId: string;
    rating: number;
    comment: string;
    movieId?: string;
    showId?: string;
  }): Promise<Review> {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException("Rating must be between 1 and 5.");
    }
    return this.moviesRepository.createReview(data);
  }
}
