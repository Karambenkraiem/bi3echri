import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackVisitDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sessionId: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  path?: string;
}
