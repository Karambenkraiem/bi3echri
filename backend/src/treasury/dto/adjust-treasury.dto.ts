import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class AdjustTreasuryDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}
