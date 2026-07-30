import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class RestockArticleDto {
  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  cost?: number;
}
