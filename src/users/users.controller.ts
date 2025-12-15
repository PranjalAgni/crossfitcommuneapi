/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, UseGuards, ForbiddenException } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { AuthUserDecorator } from "../auth/auth-user.decorator";
import type { AuthUser } from "../auth/types";
import { UsersService } from "./users.service";

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get("/me")
  async me(@AuthUserDecorator() user: AuthUser) {
    const profile = await this.users.getOrCreateProfile({
      userId: user.id,
      email: user.email,
    });

    // If you want to block login for INACTIVE/BANNED accounts:
    if (profile.accountStatus !== "ACTIVE") {
      throw new ForbiddenException("Account is inactive");
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phone,
      role: profile.role,
      accountStatus: profile.accountStatus,
      firstLoginAt: profile.firstLoginAt,
      lastLoginAt: profile.lastLoginAt,
      onboardingCompletedAt: profile.onboardingCompletedAt,
      units: profile.units,
    };
  }
}
