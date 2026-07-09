import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { EngineService } from './engine.service';
import { ItemEntrada } from './engine.types';
import { CanonizarRequestDto, CanonizarResponseDto } from './engine.dto';

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
  @ApiOperation({
    summary: 'Canoniza itens de cupom fiscal',
    description:
      'Recebe descrições sujas de itens de cupom fiscal brasileiro e devolve, por item: ' +
      'nome canônico do produto, marca, flag de alimento, confiança (0–1) e o estágio do ' +
      'pipeline que resolveu (EAN → dicionário → base de conhecimento → fuzzy → regex → IA → fallback). ' +
      'Itens que a cadeia determinística não resolve com confiança passam por IA e o resultado ' +
      'é aprendido na base compartilhada — o mesmo item nunca custa IA duas vezes.',
  })
  @ApiBody({ type: CanonizarRequestDto })
  @ApiOkResponse({ type: CanonizarResponseDto })
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

  @Post('corrigir')
  @Throttle({ global: { ttl: 60000, limit: 60 } })
  @ApiOperation({
    summary: 'Corrige a canonização de um item — a base APRENDE (flywheel)',
    description:
      'Ensina a Engine: o par (descrição suja → produto canônico correto) grava na base ' +
      'com prioridade máxima. A próxima vez que esse item aparecer, resolve corretamente — ' +
      'para todos os clientes. É o mecanismo que torna a Engine mais precisa com o uso.',
  })
  async corrigir(@Body() body: { descricao: string; produto_canonico: string; ean?: string }) {
    if (!body?.descricao || !body?.produto_canonico) {
      throw new BadRequestException('Envie { descricao, produto_canonico, ean? }');
    }
    await this.engine.corrigir(body.descricao, body.produto_canonico, body.ean);
    return { ok: true, aprendido: { descricao: body.descricao, produto_canonico: body.produto_canonico } };
  }
}
