import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from "@nestjs/common";
import { MoviesService } from "./movies.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller()
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get("movies/genres")
  async getGenres() {
    return this.moviesService.getGenres();
  }

  @Get("movies/trending")
  async getTrending(
    @Headers("x-profile-id") profileId?: string,
    @Query("limit") limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.moviesService.getTrending(profileId, limitNum);
  }

  @Get("movies/popular")
  async getPopular(
    @Headers("x-profile-id") profileId?: string,
    @Query("limit") limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.moviesService.getPopular(profileId, limitNum);
  }

  @Get("movies/top-rated")
  async getTopRated(
    @Headers("x-profile-id") profileId?: string,
    @Query("limit") limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.moviesService.getTopRated(profileId, limitNum);
  }

  @Get("movies/upcoming")
  async getUpcoming(
    @Headers("x-profile-id") profileId?: string,
    @Query("limit") limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.moviesService.getUpcoming(profileId, limitNum);
  }

  @Get("movies/:id")
  async getMovie(
    @Param("id") id: string,
    @Headers("x-profile-id") profileId?: string
  ) {
    return this.moviesService.findMovie(id, profileId);
  }

  @Get("shows/:id")
  async getShow(
    @Param("id") id: string,
    @Headers("x-profile-id") profileId?: string
  ) {
    return this.moviesService.findShow(id, profileId);
  }

  @Get("movies/:id/recommendations")
  async getRecommendations(
    @Param("id") id: string,
    @Headers("x-profile-id") profileId?: string,
    @Query("limit") limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.moviesService.getRecommendations(id, profileId, limitNum);
  }

  // General Filtered Catalogue
  @Get("movies")
  async listMovies(
    @Headers("x-profile-id") profileId?: string,
    @Query("genre") genreSlug?: string,
    @Query("year") year?: string,
    @Query("search") search?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const pageNum = page ? parseInt(page, 10) : 1;
    const yearNum = year ? parseInt(year, 10) : undefined;

    return this.moviesService.listMovies({
      profileId,
      genreSlug,
      releaseYear: yearNum,
      searchQuery: search,
      limit: limitNum,
      page: pageNum,
    });
  }

  // Reviews System
  @Get("reviews")
  async getReviews(
    @Query("movieId") movieId?: string,
    @Query("showId") showId?: string
  ) {
    return this.moviesService.getReviews({ movieId, showId });
  }

  @Post("reviews")
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Body("profileId") profileId: string,
    @Body("rating") rating: number,
    @Body("comment") comment: string,
    @Body("movieId") movieId?: string,
    @Body("showId") showId?: string
  ) {
    return this.moviesService.createReview({
      profileId,
      rating,
      comment,
      movieId,
      showId,
    });
  }
}
