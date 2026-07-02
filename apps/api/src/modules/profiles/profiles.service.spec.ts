import { Test, TestingModule } from "@nestjs/testing";
import { ProfilesService } from "./profiles.service";
import { ProfilesRepository } from "./profiles.repository";
import { CloudinaryService } from "../../common/storage/cloudinary.service";
import { BadRequestException } from "@nestjs/common";

describe("ProfilesService", () => {
  let service: ProfilesService;
  let repository: ProfilesRepository;

  const mockRepository = {
    count: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  const mockCloudinary = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: ProfilesRepository, useValue: mockRepository },
        { provide: CloudinaryService, useValue: mockCloudinary },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    repository = module.get<ProfilesRepository>(ProfilesRepository);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should throw BadRequestException if profile limit of 5 is exceeded", async () => {
      mockRepository.count.mockResolvedValue(5);

      await expect(service.create("user-1", "Profile 6", false)).rejects.toThrow(
        BadRequestException
      );
      expect(mockRepository.count).toHaveBeenCalledWith("user-1");
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should create profile with default avatar if file is not provided", async () => {
      mockRepository.count.mockResolvedValue(2);
      mockRepository.create.mockResolvedValue({ id: "prof-123", name: "New Profile" });

      const result = await service.create("user-1", "New Profile", false);
      expect(result.name).toBe("New Profile");
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          name: "New Profile",
          isKids: false,
          avatarUrl: expect.stringContaining("dicebear.com"),
        })
      );
    });
  });
});
