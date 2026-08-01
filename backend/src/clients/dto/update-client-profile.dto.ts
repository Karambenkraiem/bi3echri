import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClientProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;
}
