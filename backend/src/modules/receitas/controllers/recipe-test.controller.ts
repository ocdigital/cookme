import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { RecipeGeneratorService } from '../services/recipe-generator.service';

@ApiTags('Receitas - Test')
@Controller('receitas-test')
@Public()
export class RecipeTestController {
  constructor(private readonly recipeGeneratorService: RecipeGeneratorService) {}

  @Post('gerar')
  @ApiOperation({ summary: 'TEST: Gerar receitas sem autenticação (com busca de imagens)' })
  async gerar(
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
