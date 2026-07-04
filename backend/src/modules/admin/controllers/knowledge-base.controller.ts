import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Or } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { ProductKnowledgeBase } from '@modules/product-classification/entities/product-knowledge-base.entity';
import { OcrAliasService } from '@modules/product-classification/services/ocr-alias.service';

class CreateKnowledgeBaseDto {
  product_name: string;
  canonical_ingredient?: string;
  ingrediente_receita?: boolean;
}

class UpdateKnowledgeBaseDto {
  canonical_ingredient?: string;
  ingrediente_receita?: boolean;
  is_active?: boolean;
}

@ApiTags('Admin — Knowledge Base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/knowledge-base')
export class KnowledgeBaseAdminController {
  constructor(
    @InjectRepository(ProductKnowledgeBase)
    private readonly kbRepo: Repository<ProductKnowledgeBase>,
    private readonly ocrAliasService: OcrAliasService,
  ) {}

  @Get('canonizacao/stats')
  @ApiOperation({ summary: 'Resoluções de canonização por estágio (desde o último restart)' })
  canonizacaoStats() {
    return this.ocrAliasService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'Listar entradas do Knowledge Base (Admin)' })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('tipo') tipo?: 'all' | 'ingrediente' | 'nao_ingrediente' | 'sem_classificacao',
  ) {
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const qb = this.kbRepo.createQueryBuilder('kb');

    if (search) {
      qb.where(
        '(kb.product_name ILIKE :search OR kb.canonical_ingredient ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (tipo && tipo !== 'all') {
      const whereMethod = search ? 'andWhere' : 'where';
      if (tipo === 'ingrediente') {
        qb[whereMethod]('kb.ingrediente_receita = true');
      } else if (tipo === 'nao_ingrediente') {
        qb[whereMethod]('kb.ingrediente_receita = false');
      } else if (tipo === 'sem_classificacao') {
        qb[whereMethod]('kb.ingrediente_receita IS NULL');
      }
    }

    qb.orderBy('kb.criado_em', 'DESC').skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar entrada manual no Knowledge Base (Admin)' })
  async create(@Body() dto: CreateKnowledgeBaseDto) {
    const entry = new ProductKnowledgeBase();
    entry.product_name = dto.product_name;
    entry.normalized_name = dto.product_name.toLowerCase().trim();
    entry.canonical_ingredient = (dto.canonical_ingredient ?? null) as string;
    entry.ingrediente_receita = (dto.ingrediente_receita ?? null) as boolean;
    entry.confidence_score = 1;
    entry.total_validacoes = 1;
    entry.classification_metadata = { source: 'manual' };
    entry.is_active = true;
    return this.kbRepo.save(entry);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar entrada do Knowledge Base (Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    const entry = await this.kbRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada não encontrada');

    if (dto.canonical_ingredient !== undefined) {
      entry.canonical_ingredient = dto.canonical_ingredient;
    }
    if (dto.ingrediente_receita !== undefined) {
      entry.ingrediente_receita = dto.ingrediente_receita;
    }
    if (dto.is_active !== undefined) {
      entry.is_active = dto.is_active;
    }

    return this.kbRepo.save(entry);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover entrada do Knowledge Base (Admin)' })
  async remove(@Param('id') id: string) {
    const entry = await this.kbRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada não encontrada');
    await this.kbRepo.remove(entry);
  }
}
