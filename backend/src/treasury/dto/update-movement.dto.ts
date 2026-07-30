import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateMovementDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  comment?: string;
}
