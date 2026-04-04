import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { RecipeGeneratorService } from '../services/recipe-generator.service';

@ApiTags('Receitas')
@Controller('receitas/gerar')
export class RecipeGeneratorController {
  constructor(private readonly recipeGeneratorService: RecipeGeneratorService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
