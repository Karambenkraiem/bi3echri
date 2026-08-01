import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  agreedPrice?: number;
}
