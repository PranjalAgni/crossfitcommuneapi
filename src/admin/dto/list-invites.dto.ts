import { IsEnum, IsOptional } from "class-validator";

export class ListInvitesDto {
  @IsOptional()
  @IsEnum(["PENDING", "ACCEPTED", "REVOKED"] as const)
  status?: "PENDING" | "ACCEPTED" | "REVOKED";
}
