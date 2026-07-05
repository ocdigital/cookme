import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { ehNaoIngrediente } from '@common/nao-ingrediente.guard';

/**
 * Limpeza da despensa (admin): remove do inventário tudo que não é
 * ingrediente de receita — legado de quando a classificação assíncrona
 * deixava sabonete/lustra-móveis entrarem. Usa o MESMO guard determinístico
 * do fluxo de ingestão (fonte única de verdade).
 */
@ApiTags('Admin — Despensa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/inventario')
export class LimpezaDespensaController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Post('limpar-nao-ingredientes')
  @ApiOperation({
    summary: 'Remove não-ingredientes do inventário (guard + ingrediente_receita=false)',
  })
  @ApiQuery({ name: 'executar', required: false, description: 'true aplica; default = dry-run' })
  async limpar(@Query('executar') executar?: string) {
    const aplicar = executar === 'true';

    // Produtos presentes no inventário
    const produtos: Array<{ id: string; nome: string; nome_display: string | null; ingrediente_receita: boolean | null; itens: number }> =
      await this.dataSource.query(`
        SELECT p.id, p.nome, p.nome_display, p.ingrediente_receita, COUNT(i.id)::int AS itens
        FROM produtos p
        JOIN inventario i ON i.produto_id = p.id
        GROUP BY p.id, p.nome, p.nome_display, p.ingrediente_receita
      `);

    // SÓ o guard determinístico decide deleção. Produtos com
    // ingrediente_receita=false que NÃO casam no guard são legado da
    // classificação IA (às vezes errada: "chocolate meio amargo", "batata
    // palha") — já ficam invisíveis pelo filtro de leitura e permanecem no
    // banco para correção futura, sem perda de dado do usuário.
    const alvos = produtos.filter(
      (p) =>
        ehNaoIngrediente(p.nome) ||
        (p.nome_display ? ehNaoIngrediente(p.nome_display) : false),
    );

    let itensRemovidos = 0;
    if (aplicar && alvos.length > 0) {
      const ids = alvos.map((p) => p.id);
      await this.dataSource.query(
        `UPDATE produtos SET ingrediente_receita = false WHERE id = ANY($1)`,
        [ids],
      );
      const res = await this.dataSource.query(
        `DELETE FROM inventario WHERE produto_id = ANY($1)`,
        [ids],
      );
      itensRemovidos = Array.isArray(res) ? res[1] ?? 0 : 0;
    }

    return {
      modo: aplicar ? 'executado' : 'dry-run',
      produtos_nao_ingrediente: alvos.length,
      itens_inventario_afetados: aplicar ? itensRemovidos : alvos.reduce((s, p) => s + p.itens, 0),
      produtos: alvos.map((p) => ({ nome: p.nome_display || p.nome, itens: p.itens })),
    };
  }
}
