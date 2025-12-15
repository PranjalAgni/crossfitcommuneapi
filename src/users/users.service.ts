/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateProfile(args: { userId: string; email?: string }) {
    const now = new Date();

    // Create profile if missing; always update lastLoginAt.
    // Also set firstLoginAt only once.
    const existing = await this.prisma.profile.findUnique({
      where: { id: args.userId },
    });

    if (!existing) {
      return await this.prisma.profile.create({
        data: {
          id: args.userId,
          email: args.email ?? `${args.userId}@unknown.local`,
          firstLoginAt: now,
          lastLoginAt: now,
          // role default = member, accountStatus default = ACTIVE (from schema)
        },
      });
    }

    return await this.prisma.profile.update({
      where: { id: args.userId },
      data: {
        lastLoginAt: now,
        firstLoginAt: existing.firstLoginAt ?? now,
        // Optional: backfill email if empty
        ...(args.email && !existing.email ? { email: args.email } : {}),
      },
    });
  }
}
