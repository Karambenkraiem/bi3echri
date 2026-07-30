import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Condition } from '@prisma/client';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  categoryId: string;

  @IsEnum(Condition)
  @IsOptional()
  condition?: Condition;

  @IsNumber()
  @IsPositive()
  purchasePrice: number;

  @IsDateString()
  purchaseDate: string;

  @IsString()
  @IsOptional()
  purchaseSource?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  expectedSalePrice?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsObject()
  @IsOptional()
  specs?: Record<string, string | number | undefined>;
}
