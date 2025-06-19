import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}