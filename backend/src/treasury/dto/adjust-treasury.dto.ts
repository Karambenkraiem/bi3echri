import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AdjustTreasuryDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
