import { PartialType } from '@nestjs/mapped-types';
import { CreateListaDto } from './create-lista.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ListaStatus } from '../entities/lista.entity';

export class UpdateListaDto extends PartialType(CreateListaDto) {
  @IsOptional()
  @IsEnum(ListaStatus)
  status?: ListaStatus;
}
