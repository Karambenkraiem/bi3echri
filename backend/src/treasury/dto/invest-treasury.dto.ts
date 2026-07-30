import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class InvestTreasuryDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
