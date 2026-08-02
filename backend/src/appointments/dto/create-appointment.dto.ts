import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { AppointmentType } from '@prisma/client';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  articleName: string;

  @IsString()
  @IsOptional()
  specs?: string;

  @IsEnum(AppointmentType)
  @IsOptional()
  type?: AppointmentType;

  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  @IsOptional()
  reminderAt?: string | null;
}
