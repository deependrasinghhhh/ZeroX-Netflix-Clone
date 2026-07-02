import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
} from "@nestjs/common";
import { ProfilesService } from "./profiles.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import * as express from "express";

@UseGuards(JwtAuthGuard)
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor("avatar"))
  async create(
    @Req() request: express.Request,
    @Body("name") name: string,
    @Body("isKids") isKids: string, // multipart transmits as string
    @UploadedFile() avatar?: Express.Multer.File
  ) {
    const userId = (request as any).user.id;
    const isKidsBool = isKids === "true";
    return this.profilesService.create(userId, name, isKidsBool, avatar);
  }

  @Get()
  async findAll(@Req() request: express.Request) {
    const userId = (request as any).user.id;
    return this.profilesService.findAll(userId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Req() request: express.Request) {
    const userId = (request as any).user.id;
    return this.profilesService.findOne(userId, id);
  }

  @Put(":id")
  @UseInterceptors(FileInterceptor("avatar"))
  async update(
    @Param("id") id: string,
    @Req() request: express.Request,
    @Body() body: any,
    @UploadedFile() avatar?: Express.Multer.File
  ) {
    const userId = (request as any).user.id;
    
    // Parse preference fields if they are sent in body
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.isKids !== undefined) updateData.isKids = body.isKids === "true";
    if (body.language !== undefined) updateData.language = body.language;
    if (body.subtitlePreference !== undefined) updateData.subtitlePreference = body.subtitlePreference;
    if (body.autoPlayNext !== undefined) updateData.autoPlayNext = body.autoPlayNext === "true";
    if (body.autoPlayTrailers !== undefined) updateData.autoPlayTrailers = body.autoPlayTrailers === "true";

    return this.profilesService.update(userId, id, updateData, avatar);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() request: express.Request) {
    const userId = (request as any).user.id;
    return this.profilesService.remove(userId, id);
  }

  // Favorites
  @Get(":profileId/favorites")
  async getFavorites(@Param("profileId") profileId: string, @Req() request: express.Request) {
    const userId = (request as any).user.id;
    return this.profilesService.getFavorites(userId, profileId);
  }

  @Post(":profileId/favorites")
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(
    @Param("profileId") profileId: string,
    @Req() request: express.Request,
    @Body("movieId") movieId?: string,
    @Body("showId") showId?: string
  ) {
    const userId = (request as any).user.id;
    return this.profilesService.toggleFavorite(userId, profileId, movieId, showId);
  }

  // Watch Later
  @Get(":profileId/watch-later")
  async getWatchLater(@Param("profileId") profileId: string, @Req() request: express.Request) {
    const userId = (request as any).user.id;
    return this.profilesService.getWatchLater(userId, profileId);
  }

  @Post(":profileId/watch-later")
  @HttpCode(HttpStatus.OK)
  async toggleWatchLater(
    @Param("profileId") profileId: string,
    @Req() request: express.Request,
    @Body("movieId") movieId?: string,
    @Body("showId") showId?: string
  ) {
    const userId = (request as any).user.id;
    return this.profilesService.toggleWatchLater(userId, profileId, movieId, showId);
  }

  // Watch History
  @Get(":profileId/history")
  async getHistory(@Param("profileId") profileId: string, @Req() request: express.Request) {
    const userId = (request as any).user.id;
    return this.profilesService.getHistory(userId, profileId);
  }

  @Post(":profileId/history")
  @HttpCode(HttpStatus.CREATED)
  async addHistory(
    @Param("profileId") profileId: string,
    @Req() request: express.Request,
    @Body("watchedSeconds") watchedSeconds: number,
    @Body("durationSeconds") durationSeconds: number,
    @Body("movieId") movieId?: string,
    @Body("episodeId") episodeId?: string
  ) {
    const userId = (request as any).user.id;
    return this.profilesService.addHistory(userId, profileId, watchedSeconds, durationSeconds, movieId, episodeId);
  }

  // Notifications
  @Get(":profileId/notifications")
  async getNotifications(@Param("profileId") profileId: string, @Req() request: express.Request) {
    const userId = (request as any).user.id;
    return this.profilesService.getNotifications(userId, profileId);
  }

  @Post(":profileId/notifications/:notificationId/read")
  @HttpCode(HttpStatus.OK)
  async markNotificationRead(
    @Param("profileId") profileId: string,
    @Param("notificationId") notificationId: string,
    @Req() request: express.Request
  ) {
    const userId = (request as any).user.id;
    return this.profilesService.markNotificationRead(userId, profileId, notificationId);
  }
}
