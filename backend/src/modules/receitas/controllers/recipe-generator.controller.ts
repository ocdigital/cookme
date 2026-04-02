import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { RecipeGeneratorService } from '../services/recipe-generator.service';

@ApiTags('Receitas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('receitas/gerar')
export class RecipeGeneratorController {
  constructor(private readonly recipeGeneratorService: RecipeGeneratorService) {}

  @Post()
  @ApiOperation({ summary: 'Gerar receitas baseado em ingredientes' })
  async gerar(
    @CurrentUser() user: Usuario,
    @Body() body: { ingredientes: string[] }
  ) {
    const receitas = await this.recipeGeneratorService.gerarReceitas(
      body.ingredientes
    );

    return {
      usuario_id: user.id,
      receitas_geradas: receitas.length,
      receitas,
      timestamp: new Date(),
    };
  }
}
