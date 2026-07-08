import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { EngineService } from './engine.service';
import { ItemEntrada } from './engine.types';

/**
 * Playground da Engine — o "demo ao vivo" do roteiro de vendas
 * (ONE_PAGER_API.md): cola 3 linhas sujas de cupom, recebe o JSON na hora.
 * Admin-only por enquanto; vira a API pública com auth por API key quando
 * houver design partner (gatilho no ANALISE_API_CANONIZACAO.md §8).
 */
@ApiTags('Engine — Canonização')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('engine')
export class EngineController {
  constructor(private readonly engine: EngineService) {}

  @Post('canonizar')
  @Throttle({ global: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Canoniza itens de cupom (demo/playground da API B2B)' })
  async canonizar(@Body() body: { itens: Array<ItemEntrada | string> }) {
    if (!Array.isArray(body?.itens) || body.itens.length === 0) {
      throw new BadRequestException('Envie { itens: [...] } — strings ou objetos {descricao, ean?}');
    }
    if (body.itens.length > 100) {
      throw new BadRequestException('Máximo de 100 itens por chamada');
    }
    const entrada: ItemEntrada[] = body.itens.map((i) =>
      typeof i === 'string' ? { descricao: i } : i,
    );
    const inicio = Date.now();
    const itens = await this.engine.canonizarLote(entrada);
    return {
      itens,
      total: itens.length,
      latencia_ms: Date.now() - inicio,
      confianca_media: Math.round((itens.reduce((s, i) => s + i.confianca, 0) / itens.length) * 100) / 100,
    };
  }
}
