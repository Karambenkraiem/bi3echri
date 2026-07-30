import { IsBoolean } from 'class-validator';

export class UpdateDemoModeDto {
  @IsBoolean()
  enabled: boolean;
}
