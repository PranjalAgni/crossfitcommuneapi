/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInviteDto } from "./dto/create-invite.dto";

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrResetInvite(dto: CreateInviteDto, adminId: string) {
    const email = dto.email.trim().toLowerCase();

    return this.prisma.memberInvite.upsert({
      where: { email },
      update: {
        role: dto.role ?? "member",
        status: "PENDING",
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        acceptedAt: null,
        createdBy: adminId,
        invitedAt: new Date(),
      },
      create: {
        email,
        role: dto.role ?? "member",
        status: "PENDING",
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: adminId,
      },
    });
  }

  async listInvites(status?: "PENDING" | "ACCEPTED" | "REVOKED") {
    return this.prisma.memberInvite.findMany({
      where: status ? { status } : undefined,
      orderBy: { invitedAt: "desc" },
      take: 200,
    });
  }

  async revokeInvite(emailParam: string) {
    const email = emailParam.trim().toLowerCase();

    return this.prisma.memberInvite.update({
      where: { email },
      data: {
        status: "REVOKED",
      },
    });
  }
}
