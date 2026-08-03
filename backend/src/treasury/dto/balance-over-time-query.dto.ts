import { IsIn, IsOptional } from 'class-validator';

export class BalanceOverTimeQueryDto {
  @IsIn(['day', 'week', 'month'])
  @IsOptional()
  granularity?: 'day' | 'week' | 'month';
}
