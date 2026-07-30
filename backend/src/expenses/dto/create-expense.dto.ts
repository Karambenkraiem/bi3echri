import { IsNotEmpty, IsPositive, IsNumber, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
