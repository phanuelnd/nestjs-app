import { IsEmail, IsString, IsEnum, IsOptional } from "class-validator";
import { UserRole } from "../entities/user.entity";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}