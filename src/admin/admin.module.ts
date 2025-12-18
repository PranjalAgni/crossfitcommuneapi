import { Module } from "@nestjs/common";
import { InvitesController } from "./invites.controller";
import { InvitesService } from "./invites.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  controllers: [InvitesController],
  providers: [InvitesService, PrismaService],
})
export class AdminModule {}
