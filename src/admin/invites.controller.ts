/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { AuthUserDecorator } from "../auth/auth-user.decorator";
import type { AuthUser } from "../auth/types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInviteDto } from "./dto/create-invite.dto";
import { ListInvitesDto } from "./dto/list-invites.dto";
import { InvitesService } from "./invites.service";

@Controller("admin/invites")
@UseGuards(SupabaseAuthGuard)
export class InvitesController {
  constructor(
    private readonly invites: InvitesService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAdmin(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });
    if (!profile || profile.role !== "admin")
      throw new ForbiddenException("Admin only");
    if (profile.accountStatus !== "ACTIVE")
      throw new ForbiddenException("Account inactive");
  }

  @Post()
  async createInvite(
    @AuthUserDecorator() user: AuthUser,
    @Body() dto: CreateInviteDto,
  ) {
    await this.assertAdmin(user.id);
    return this.invites.createOrResetInvite(dto, user.id);
  }

  @Get()
  async list(@AuthUserDecorator() user: AuthUser, @Query() q: ListInvitesDto) {
    await this.assertAdmin(user.id);
    return this.invites.listInvites(q.status);
  }

  @Patch(":email/revoke")
  async revoke(
    @AuthUserDecorator() user: AuthUser,
    @Param("email") email: string,
  ) {
    await this.assertAdmin(user.id);
    return this.invites.revokeInvite(email);
  }
}
