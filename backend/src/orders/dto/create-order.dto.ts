import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { OrderType } from '@prisma/client';

export class CreateOrderDto {
  @IsUUID()
  articleId: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsEnum(OrderType)
  type: OrderType;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
