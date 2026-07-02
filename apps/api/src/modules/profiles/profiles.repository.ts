import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Profile, Prisma, Favorite, WatchLater, ProfileWatchHistory, Notification } from "@prisma/client";

@Injectable()
export class ProfilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> {
    return this.prisma.profile.create({ data });
  }

  async findAll(userId: string): Promise<Profile[]> {
    return this.prisma.profile.findMany({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  async findById(id: string): Promise<Profile | null> {
    return this.prisma.profile.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async update(id: string, data: Prisma.ProfileUpdateInput): Promise<Profile> {
    return this.prisma.profile.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Profile> {
    return this.prisma.profile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(userId: string): Promise<number> {
    return this.prisma.profile.count({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  // Favorites Operations
  async getFavorites(profileId: string): Promise<Favorite[]> {
    return this.prisma.favorite.findMany({
      where: { profileId },
      include: {
        movie: true,
        show: true,
      },
    });
  }

  async toggleFavorite(profileId: string, movieId?: string, showId?: string) {
    const existing = await this.prisma.favorite.findFirst({
      where: {
        profileId,
        movieId: movieId || null,
        showId: showId || null,
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { action: "REMOVED" };
    } else {
      await this.prisma.favorite.create({
        data: {
          profileId,
          movieId: movieId || null,
          showId: showId || null,
        },
      });
      return { action: "ADDED" };
    }
  }

  // Watch Later Operations
  async getWatchLater(profileId: string): Promise<WatchLater[]> {
    return this.prisma.watchLater.findMany({
      where: { profileId },
      include: {
        movie: true,
        show: true,
      },
    });
  }

  async toggleWatchLater(profileId: string, movieId?: string, showId?: string) {
    const existing = await this.prisma.watchLater.findFirst({
      where: {
        profileId,
        movieId: movieId || null,
        showId: showId || null,
      },
    });

    if (existing) {
      await this.prisma.watchLater.delete({ where: { id: existing.id } });
      return { action: "REMOVED" };
    } else {
      await this.prisma.watchLater.create({
        data: {
          profileId,
          movieId: movieId || null,
          showId: showId || null,
        },
      });
      return { action: "ADDED" };
    }
  }

  // Watch History Operations
  async getHistory(profileId: string): Promise<ProfileWatchHistory[]> {
    return this.prisma.profileWatchHistory.findMany({
      where: { profileId },
      orderBy: { lastWatchedAt: "desc" },
      include: {
        movie: true,
        episode: true,
      },
    });
  }

  async addHistory(
    profileId: string,
    watchedSeconds: number,
    durationSeconds: number,
    movieId?: string,
    episodeId?: string
  ): Promise<ProfileWatchHistory> {
    const isFinished = watchedSeconds >= durationSeconds * 0.9; // Finished if 90% watched
    return this.prisma.profileWatchHistory.create({
      data: {
        profileId,
        movieId: movieId || null,
        episodeId: episodeId || null,
        watchedSeconds,
        durationSeconds,
        isFinished,
      },
    });
  }

  // Notifications Operations
  async getNotifications(profileId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        OR: [
          { profileId },
          { profileId: null }, // broadcast system alerts
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async markNotificationRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
