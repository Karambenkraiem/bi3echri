import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { SupplierType } from '@prisma/client';

export class CreateSupplierDto {
  @IsEnum(SupplierType)
  type: SupplierType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateIf((dto) => dto.type === SupplierType.PARTICULIER)
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis pour un particulier' })
  phone?: string;

  @ValidateIf((dto) => dto.type === SupplierType.PARTICULIER)
  @IsString()
  @IsNotEmpty({ message: 'Le lieu est requis pour un particulier' })
  location?: string;
}
