import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { ProfilesRepository } from "./profiles.repository";
import { CloudinaryService } from "../../common/storage/cloudinary.service";
import { Profile } from "@prisma/client";

@Injectable()
export class ProfilesService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async create(userId: string, name: string, isKids: boolean, avatarFile?: Express.Multer.File): Promise<Profile> {
    const count = await this.profilesRepository.count(userId);
    if (count >= 5) {
      throw new BadRequestException("Maximum limit of 5 profiles reached.");
    }

    let avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;

    if (avatarFile) {
      const uploadResult = await this.cloudinaryService.uploadFile(avatarFile);
      avatarUrl = uploadResult.secure_url;
    }

    return this.profilesRepository.create({
      userId,
      name,
      isKids,
      avatarUrl,
    });
  }

  async findAll(userId: string): Promise<Profile[]> {
    return this.profilesRepository.findAll(userId);
  }

  async findOne(userId: string, profileId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findById(profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found.");
    }
    if (profile.userId !== userId) {
      throw new ForbiddenException("Unauthorized access to this profile.");
    }
    return profile;
  }

  async update(
    userId: string,
    profileId: string,
    data: { name?: string; isKids?: boolean; language?: string; subtitlePreference?: string; autoPlayNext?: boolean; autoPlayTrailers?: boolean },
    avatarFile?: Express.Multer.File
  ): Promise<Profile> {
    const profile = await this.findOne(userId, profileId);

    const updateData: any = { ...data };

    if (avatarFile) {
      const uploadResult = await this.cloudinaryService.uploadFile(avatarFile);
      updateData.avatarUrl = uploadResult.secure_url;
    }

    return this.profilesRepository.update(profile.id, updateData);
  }

  async remove(userId: string, profileId: string): Promise<Profile> {
    const profile = await this.findOne(userId, profileId);
    return this.profilesRepository.softDelete(profile.id);
  }

  // Favorites
  async getFavorites(userId: string, profileId: string) {
    await this.findOne(userId, profileId);
    return this.profilesRepository.getFavorites(profileId);
  }

  async toggleFavorite(userId: string, profileId: string, movieId?: string, showId?: string) {
    await this.findOne(userId, profileId);
    return this.profilesRepository.toggleFavorite(profileId, movieId, showId);
  }

  // Watch Later
  async getWatchLater(userId: string, profileId: string) {
    await this.findOne(userId, profileId);
    return this.profilesRepository.getWatchLater(profileId);
  }

  async toggleWatchLater(userId: string, profileId: string, movieId?: string, showId?: string) {
    await this.findOne(userId, profileId);
    return this.profilesRepository.toggleWatchLater(profileId, movieId, showId);
  }

  // Watch History
  async getHistory(userId: string, profileId: string) {
    await this.findOne(userId, profileId);
    return this.profilesRepository.getHistory(profileId);
  }

  async addHistory(userId: string, profileId: string, watchedSeconds: number, durationSeconds: number, movieId?: string, episodeId?: string) {
    await this.findOne(userId, profileId);
    return this.profilesRepository.addHistory(profileId, watchedSeconds, durationSeconds, movieId, episodeId);
  }

  // Notifications
  async getNotifications(userId: string, profileId: string) {
    await this.findOne(userId, profileId);
    return this.profilesRepository.getNotifications(profileId);
  }

  async markNotificationRead(userId: string, profileId: string, notificationId: string) {
    await this.findOne(userId, profileId);
    return this.profilesRepository.markNotificationRead(notificationId);
  }
}
