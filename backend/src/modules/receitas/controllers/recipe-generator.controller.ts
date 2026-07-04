import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { RecipeGeneratorService } from '../services/recipe-generator.service';
import { InventarioService } from '@modules/inventario/inventario.service';
import { PushNotificationService } from '@modules/notificacoes/services/push-notification.service';
import { runWithRequestId } from '@common/request-context';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preferencia } from '@modules/usuarios/entities/preferencia.entity';

@ApiTags('Receitas')
@Controller('receitas/gerar')
export class RecipeGeneratorController {
  constructor(
    private readonly recipeGeneratorService: RecipeGeneratorService,
    private readonly inventarioService: InventarioService,
    private readonly push: PushNotificationService,
    @InjectRepository(Preferencia)
    private readonly preferenciaRepo: Repository<Preferencia>,
  ) {}

  @Post()
  @Throttle({ ia: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Gerar receitas baseado em ingredientes' })
  async gerar(
    @CurrentUser() user: Usuario,
    @Body() body: { ingredientes?: string[]; forcar_ia?: boolean }
  ) {
    const disponiveis = await this.inventarioService.ingredientesDisponiveis(user.id);
    const ingredientes = (body.ingredientes?.length ?? 0) > 0
      ? body.ingredientes!.filter((ing) => {
          const ingNorm = ing.toLowerCase();
          return disponiveis.some((d) => d.toLowerCase().includes(ingNorm) || ingNorm.includes(d.toLowerCase()));
        })
      : disponiveis;

    const forcarIA = body.forcar_ia === true;
    const ingredientesFinais = ingredientes.length > 0 ? ingredientes : disponiveis;
    const pref = await this.preferenciaRepo.findOne({ where: { usuario_id: user.id } });
    const modoAlimentar = pref?.modo_alimentar || 'normal';
    const receitas = await runWithRequestId(() =>
      this.recipeGeneratorService.gerarReceitas(ingredientesFinais, forcarIA, modoAlimentar),
    );

    if (receitas.length > 0) {
      this.push.enviarParaUsuario(
        user.id,
        '👨‍🍳 Receitas prontas!',
        `Encontramos ${receitas.length} receita${receitas.length > 1 ? 's' : ''} com o que você tem em casa.`,
        { tipo: 'receitas_geradas', rota: '/(app)/(tabs)/receitas' },
      ).catch(() => {});
    }

    return {
      usuario_id: user.id,
      receitas_geradas: receitas.length,
      receitas,
      timestamp: new Date(),
    };
  }

  @Post('test')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'TEST: Gerar receitas sem autenticação' })
  async gerarTest(
    @Body() body: { ingredientes: string[] }
  ) {
    const receitas = await this.recipeGeneratorService.gerarReceitas(
      body.ingredientes
    );

    return {
      usuario_id: 'test-user',
      receitas_geradas: receitas.length,
      receitas,
      timestamp: new Date(),
    };
  }
}
