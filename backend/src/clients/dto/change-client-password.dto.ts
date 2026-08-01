import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeClientPasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
