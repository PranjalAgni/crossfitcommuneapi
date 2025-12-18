import { IsEmail, IsEnum, IsISO8601, IsOptional } from "class-validator";

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(["member", "admin"] as const)
  role?: "member" | "admin";

  // optional expiry like "2025-12-31T00:00:00.000Z"
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
