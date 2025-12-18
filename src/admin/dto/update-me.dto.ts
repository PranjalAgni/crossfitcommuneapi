import { IsOptional, IsString, IsIn } from "class-validator";

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(["KG", "LB"])
  units?: string;
}
