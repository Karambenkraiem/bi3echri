import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateSaleDto {
  @IsNumber()
  @IsPositive()
  salePrice: number;

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
  @IsNotEmpty()
  adChannel: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
