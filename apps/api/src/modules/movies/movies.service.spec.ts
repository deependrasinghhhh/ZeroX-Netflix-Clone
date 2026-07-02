import { Test, TestingModule } from "@nestjs/testing";
import { MoviesService } from "./movies.service";
import { MoviesRepository } from "./movies.repository";
import { PrismaService } from "../../database/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("MoviesService", () => {
  let service: MoviesService;
  let repository: MoviesRepository;
  let prisma: PrismaService;

  const mockRepository = {
    findMovieById: jest.fn(),
    getTrending: jest.fn(),
  };

  const mockPrisma = {
    profile: {
      findUnique: jest.fn(),
    },
    movie: {
      update: jest.fn().mockReturnValue({ catch: jest.fn() }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: MoviesRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get<MoviesRepository>(MoviesRepository);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findMovie", () => {
    it("should return movie details if rating is allowed for the profile", async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({ id: "prof-1", isKids: false });
      mockRepository.findMovieById.mockResolvedValue({ id: "mov-1", title: "Mature Title", rating: "R" });
      mockPrisma.movie.update.mockReturnValue(Promise.resolve({}));

      const result = await service.findMovie("mov-1", "prof-1");
      expect(result.title).toBe("Mature Title");
      expect(mockRepository.findMovieById).toHaveBeenCalledWith("mov-1");
    });

    it("should throw NotFoundException if movie rating is R and profile is a kids profile", async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({ id: "prof-child", isKids: true });
      mockRepository.findMovieById.mockResolvedValue({ id: "mov-1", title: "Mature Title", rating: "R" });

      await expect(service.findMovie("mov-1", "prof-child")).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
