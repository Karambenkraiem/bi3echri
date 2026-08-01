import { IsBooleanString, IsOptional, IsUUID } from 'class-validator';

export class QueryPublicProductsDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsBooleanString()
  isNew?: string;
}
