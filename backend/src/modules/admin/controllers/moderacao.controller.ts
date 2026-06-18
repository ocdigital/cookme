import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { ModeracaoService } from '@modules/receitas/services/moderacao.service';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

class RejeitarFotoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  motivo: string;
}

@ApiTags('Admin — Moderação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/moderacao')
export class ModeracaoAdminController {
  constructor(private readonly moderacaoService: ModeracaoService) {}

  @Get('fotos')
  @ApiOperation({ summary: 'Lista fila de fotos aguardando moderação' })
  listarFila() {
    return this.moderacaoService.listarFilaModeracao();
  }

  @Patch('fotos/:id/aprovar')
  @ApiOperation({ summary: 'Aprova foto sugerida pela comunidade' })
  aprovar(@Param('id') id: string) {
    return this.moderacaoService.aprovarFoto(id);
  }

  @Patch('fotos/:id/rejeitar')
  @ApiOperation({ summary: 'Rejeita foto com motivo' })
  rejeitar(@Param('id') id: string, @Body() dto: RejeitarFotoDto) {
    return this.moderacaoService.rejeitarFoto(id, dto.motivo);
  }
}
