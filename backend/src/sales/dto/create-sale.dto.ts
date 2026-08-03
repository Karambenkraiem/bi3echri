import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

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

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}
