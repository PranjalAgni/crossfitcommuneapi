import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, CanActivate } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import type { AuthUser } from "../auth/types";

// Mock the SupabaseAuthGuard to avoid ESM import issues with jose
jest.mock("../auth/supabase-auth.guard", () => {
  class MockSupabaseAuthGuard implements CanActivate {
    canActivate() {
      return true;
    }
  }
  return {
    SupabaseAuthGuard: MockSupabaseAuthGuard,
  };
});

// Import after mock is set up
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";

describe("UsersController", () => {
  let controller: UsersController;

  const mockUsersService = {
    getOrCreateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /me", () => {
    it("should return user profile data when account is ACTIVE", async () => {
      const mockAuthUser: AuthUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        fullName: "Test User",
        phone: "+1234567890",
        role: "member" as const,
        accountStatus: "ACTIVE" as const,
        firstLoginAt: new Date("2024-01-01"),
        lastLoginAt: new Date("2024-01-15"),
        onboardingCompletedAt: new Date("2024-01-10"),
        units: "imperial",
      };

      mockUsersService.getOrCreateProfile.mockResolvedValue(mockProfile);

      const result = await controller.me(mockAuthUser);

      expect(mockUsersService.getOrCreateProfile).toHaveBeenCalledWith({
        userId: "user-123",
        email: "test@example.com",
      });
      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        fullName: "Test User",
        phone: "+1234567890",
        role: "member",
        accountStatus: "ACTIVE",
        firstLoginAt: mockProfile.firstLoginAt,
        lastLoginAt: mockProfile.lastLoginAt,
        onboardingCompletedAt: mockProfile.onboardingCompletedAt,
        units: "imperial",
      });
    });

    it("should throw ForbiddenException when account is INACTIVE", async () => {
      const mockAuthUser: AuthUser = {
        id: "user-456",
        email: "inactive@example.com",
      };

      const mockProfile = {
        id: "user-456",
        email: "inactive@example.com",
        fullName: "Inactive User",
        phone: null,
        role: "member" as const,
        accountStatus: "INACTIVE" as const,
        firstLoginAt: new Date("2024-01-01"),
        lastLoginAt: new Date("2024-01-15"),
        onboardingCompletedAt: null,
        units: null,
      };

      mockUsersService.getOrCreateProfile.mockResolvedValue(mockProfile);

      await expect(async () => controller.me(mockAuthUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(async () => controller.me(mockAuthUser)).rejects.toThrow(
        "Account is inactive",
      );

      expect(mockUsersService.getOrCreateProfile).toHaveBeenCalledWith({
        userId: "user-456",
        email: "inactive@example.com",
      });
    });
  });
});
