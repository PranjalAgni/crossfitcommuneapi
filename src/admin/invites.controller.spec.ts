import { Test, TestingModule } from "@nestjs/testing";
import { CanActivate, ForbiddenException } from "@nestjs/common";
import { InvitesController } from "./invites.controller";
import { InvitesService } from "./invites.service";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/types";
import type { CreateInviteDto } from "./dto/create-invite.dto";

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

describe("InvitesController", () => {
  let controller: InvitesController;

  const mockInvitesService = {
    createOrResetInvite: jest.fn(),
    listInvites: jest.fn(),
    revokeInvite: jest.fn(),
  };

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitesController],
      providers: [
        {
          provide: InvitesService,
          useValue: mockInvitesService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InvitesController>(InvitesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /admin/invites", () => {
    it("should create an invite when admin is ACTIVE", async () => {
      const adminUser: AuthUser = {
        id: "admin-1",
        email: "admin@example.com",
      };
      const dto: CreateInviteDto = {
        email: "new.member@example.com",
        role: "member",
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "admin-1",
        role: "admin",
        accountStatus: "ACTIVE",
      });
      mockInvitesService.createOrResetInvite.mockResolvedValue({
        email: "new.member@example.com",
        status: "PENDING",
      });

      const result = await controller.createInvite(adminUser, dto);

      expect(mockPrismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { id: "admin-1" },
      });
      expect(mockInvitesService.createOrResetInvite).toHaveBeenCalledWith(
        dto,
        "admin-1",
      );
      expect(result).toEqual({
        email: "new.member@example.com",
        status: "PENDING",
      });
    });
  });

  describe("GET /admin/invites", () => {
    it("should throw ForbiddenException when user is not admin", async () => {
      const user: AuthUser = {
        id: "user-1",
        email: "user@example.com",
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "user-1",
        role: "member",
        accountStatus: "ACTIVE",
      });

      await expect(async () =>
        controller.list(user, { status: "PENDING" }),
      ).rejects.toThrow(ForbiddenException);
      await expect(async () =>
        controller.list(user, { status: "PENDING" }),
      ).rejects.toThrow("Admin only");

      expect(mockInvitesService.listInvites).not.toHaveBeenCalled();
    });
  });
});
