import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class BalanceOverTimeQueryDto {
  @IsIn(['day', 'week', 'month'])
  @IsOptional()
  granularity?: 'day' | 'week' | 'month';

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
