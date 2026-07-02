import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Movie, Show, Episode, Genre, Review, Prisma } from "@prisma/client";

@Injectable()
export class MoviesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // List of all genres
  async getGenres(): Promise<Genre[]> {
    return this.prisma.genre.findMany({
      orderBy: { name: "asc" },
    });
  }

  // Find movie by ID with cast, crew, and genres
  async findMovieById(id: string): Promise<any | null> {
    return this.prisma.movie.findFirst({
      where: { id, deletedAt: null },
      include: {
        genres: { include: { genre: true } },
        cast: { include: { cast: true } },
        crew: { include: { crew: true } },
        videoAsset: true,
      },
    });
  }

  // Find show by ID with seasons, genres, cast, crew
  async findShowById(id: string): Promise<any | null> {
    return this.prisma.show.findFirst({
      where: { id, deletedAt: null },
      include: {
        genres: { include: { genre: true } },
        cast: { include: { cast: true } },
        crew: { include: { crew: true } },
        seasons: {
          where: { deletedAt: null },
          orderBy: { seasonNumber: "asc" },
          include: {
            episodes: {
              where: { deletedAt: null },
              orderBy: { episodeNumber: "asc" },
              include: { videoAsset: true },
            },
          },
        },
      },
    });
  }

  // Get episodes for a season
  async findEpisodesBySeason(seasonId: string): Promise<Episode[]> {
    return this.prisma.episode.findMany({
      where: { seasonId, deletedAt: null },
      orderBy: { episodeNumber: "asc" },
      include: { videoAsset: true },
    });
  }

  // Main filtered query supporting rating gating
  async findAllMovies(params: {
    genreSlug?: string;
    releaseYear?: number;
    searchQuery?: string;
    ageRatings: string[];
    limit: number;
    offset: number;
  }): Promise<Movie[]> {
    const where: Prisma.MovieWhereInput = {
      deletedAt: null,
      rating: { in: params.ageRatings },
    };

    if (params.genreSlug) {
      where.genres = {
        some: {
          genre: { slug: params.genreSlug },
        },
      };
    }

    if (params.releaseYear) {
      where.releaseDate = {
        gte: new Date(`${params.releaseYear}-01-01`),
        lte: new Date(`${params.releaseYear}-12-31`),
      };
    }

    if (params.searchQuery) {
      where.title = {
        contains: params.searchQuery,
        mode: "insensitive",
      };
    }

    return this.prisma.movie.findMany({
      where,
      take: params.limit,
      skip: params.offset,
      orderBy: { releaseDate: "desc" },
    });
  }

  // Catalogue lists
  async getTrending(ageRatings: string[], limit = 10): Promise<Movie[]> {
    // Trending sorted by viewsCount
    return this.prisma.movie.findMany({
      where: { deletedAt: null, rating: { in: ageRatings } },
      take: limit,
      orderBy: { viewsCount: "desc" },
    });
  }

  async getPopular(ageRatings: string[], limit = 10): Promise<Movie[]> {
    return this.prisma.movie.findMany({
      where: { deletedAt: null, rating: { in: ageRatings } },
      take: limit,
      orderBy: { viewsCount: "desc" },
    });
  }

  async getTopRated(ageRatings: string[], limit = 10): Promise<Movie[]> {
    return this.prisma.movie.findMany({
      where: { deletedAt: null, rating: { in: ageRatings } },
      take: limit,
      orderBy: { averageRating: "desc" },
    });
  }

  async getUpcoming(ageRatings: string[], limit = 10): Promise<Movie[]> {
    return this.prisma.movie.findMany({
      where: {
        deletedAt: null,
        rating: { in: ageRatings },
        releaseDate: { gte: new Date() },
      },
      take: limit,
      orderBy: { releaseDate: "asc" },
    });
  }

  // Similar titles recommendations based on shared genres
  async getRecommendations(movieId: string, ageRatings: string[], limit = 10): Promise<Movie[]> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: { genres: true },
    });

    if (!movie) return [];

    const genreIds = movie.genres.map((g) => g.genreId);

    return this.prisma.movie.findMany({
      where: {
        id: { not: movieId },
        deletedAt: null,
        rating: { in: ageRatings },
        genres: {
          some: {
            genreId: { in: genreIds },
          },
        },
      },
      take: limit,
      orderBy: { averageRating: "desc" },
    });
  }

  // Reviews System
  async getReviews(params: { movieId?: string; showId?: string }): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: {
        movieId: params.movieId || null,
        showId: params.showId || null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
      },
    });
  }

  async createReview(data: {
    profileId: string;
    rating: number;
    comment: string;
    movieId?: string;
    showId?: string;
  }): Promise<Review> {
    return this.prisma.$transaction(async (tx) => {
      // Create review
      const review = await tx.review.create({
        data: {
          profileId: data.profileId,
          rating: data.rating,
          comment: data.comment,
          movieId: data.movieId || null,
          showId: data.showId || null,
        },
      });

      // Recalculate average rating
      if (data.movieId) {
        const aggregates = await tx.review.aggregate({
          where: { movieId: data.movieId },
          _avg: { rating: true },
        });

        const newAverage = aggregates._avg.rating || 0;

        await tx.movie.update({
          where: { id: data.movieId },
          data: { averageRating: parseFloat(newAverage.toFixed(1)) },
        });
      } else if (data.showId) {
        const aggregates = await tx.review.aggregate({
          where: { showId: data.showId },
          _avg: { rating: true },
        });

        const newAverage = aggregates._avg.rating || 0;

        await tx.show.update({
          where: { id: data.showId },
          data: { averageRating: parseFloat(newAverage.toFixed(1)) },
        });
      }

      return review;
    });
  }
}
