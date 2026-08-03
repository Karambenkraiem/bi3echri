import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  body?: string;
}
