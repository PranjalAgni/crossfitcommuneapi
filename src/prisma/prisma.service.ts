/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>("DATABASE_URL")!;
    if (!databaseUrl) {
      throw new Error("Missing DATABASE_URL in environment");
    }
    super({
        adapter: new PrismaPg({
            connectionString: databaseUrl,
        }),
    });
  }

    async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
