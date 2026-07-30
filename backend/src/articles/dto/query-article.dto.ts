import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ArticleStatus } from '@prisma/client';

export class QueryArticleDto {
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
