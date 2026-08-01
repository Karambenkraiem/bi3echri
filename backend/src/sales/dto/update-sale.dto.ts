import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateSaleDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  salePrice?: number;

  @IsDateString()
  @IsOptional()
  saleDate?: string;

  @IsString()
  @IsOptional()
  buyerName?: string;

  @IsString()
  @IsOptional()
  buyerContact?: string;

  @IsString()
  @IsOptional()
  adChannel?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
