import { PartialType } from '@nestjs/mapped-types';
import { CreateItemListaDto } from './create-item-lista.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateItemListaDto extends PartialType(CreateItemListaDto) {
  @IsOptional()
  @IsBoolean()
  comprado?: boolean;
}
