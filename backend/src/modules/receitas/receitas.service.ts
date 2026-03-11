import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Receita } from './entities/receita.entity';
import { ReceitaIngrediente } from './entities/receita-ingrediente.entity';
import { ReceitaExecutada } from './entities/receita-executada.entity';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';
import { ExecutarReceitaDto } from './dto/executar-receita.dto';

@Injectable()
export class ReceitasService {
  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepository: Repository<Receita>,
    @InjectRepository(ReceitaIngrediente)
    private readonly ingredienteRepository: Repository<ReceitaIngrediente>,
    @InjectRepository(ReceitaExecutada)
    private readonly executadaRepository: Repository<ReceitaExecutada>,
  ) {}

  /**
   * Cria uma receita com ingredientes
   */
  async create(createReceitaDto: CreateReceitaDto): Promise<Receita> {
    // Cria a receita
    const receita = this.receitaRepository.create({
      nome: createReceitaDto.nome,
      modo_preparo: createReceitaDto.modo_preparo,
      tempo_preparo: createReceitaDto.tempo_preparo,
      rendimento_porcoes: createReceitaDto.rendimento_porcoes,
      dificuldade: createReceitaDto.dificuldade,
      tags_dieta: createReceitaDto.tags_dieta || [],
      tags_preparo: createReceitaDto.tags_preparo || [],
      categoria_receita: createReceitaDto.categoria_receita,
      origem: createReceitaDto.origem || 'catalogo',
    });

    const savedReceita = await this.receitaRepository.save(receita);

    // Cria os ingredientes
    const ingredientes = createReceitaDto.ingredientes.map((ing, index) =>
      this.ingredienteRepository.create({
        receita_id: savedReceita.id,
        produto_id: ing.produto_id,
        quantidade: ing.quantidade,
        unidade: ing.unidade,
        opcional: ing.opcional || false,
        observacao: ing.observacao,
        ordem: ing.ordem || index + 1,
      }),
    );

    await this.ingredienteRepository.save(ingredientes);

    return this.findOne(savedReceita.id);
  }

  /**
   * Lista receitas com filtros
   */
  async findAll(
    filters?: {
      search?: string;
      dificuldade?: string;
      tags_dieta?: string[];
      categoria?: string;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Receita[]; total: number; page: number; totalPages: number }> {
    const query = this.receitaRepository
      .createQueryBuilder('receita')
      .leftJoinAndSelect('receita.ingredientes', 'ingredientes')
      .leftJoinAndSelect('ingredientes.produto', 'produto');

    if (filters?.search) {
      query.andWhere('receita.nome ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.dificuldade) {
      query.andWhere('receita.dificuldade = :dificuldade', {
        dificuldade: filters.dificuldade,
      });
    }

    if (filters?.categoria) {
      query.andWhere('receita.categoria_receita = :categoria', {
        categoria: filters.categoria,
      });
    }

    if (filters?.tags_dieta && filters.tags_dieta.length > 0) {
      query.andWhere('receita.tags_dieta && :tags', { tags: filters.tags_dieta });
    }

    const total = await query.getCount();
    const data = await query
      .orderBy('receita.avaliacao_media', 'DESC')
      .addOrderBy('receita.vezes_executada', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca receita por ID
   */
  async findOne(id: string): Promise<Receita> {
    const receita = await this.receitaRepository.findOne({
      where: { id },
      relations: ['ingredientes', 'ingredientes.produto', 'ingredientes.produto.marca'],
    });

    if (!receita) {
      throw new NotFoundException('Receita não encontrada');
    }

    return receita;
  }

  /**
   * Atualiza uma receita
   */
  async update(id: string, updateReceitaDto: UpdateReceitaDto): Promise<Receita> {
    const receita = await this.findOne(id);

    // Atualiza os campos da receita
    if (updateReceitaDto.nome !== undefined) receita.nome = updateReceitaDto.nome;
    if (updateReceitaDto.modo_preparo !== undefined) receita.modo_preparo = updateReceitaDto.modo_preparo;
    if (updateReceitaDto.tempo_preparo !== undefined) receita.tempo_preparo = updateReceitaDto.tempo_preparo;
    if (updateReceitaDto.rendimento_porcoes !== undefined) receita.rendimento_porcoes = updateReceitaDto.rendimento_porcoes;
    if (updateReceitaDto.dificuldade !== undefined) receita.dificuldade = updateReceitaDto.dificuldade;
    if (updateReceitaDto.tags_dieta !== undefined) receita.tags_dieta = updateReceitaDto.tags_dieta;
    if (updateReceitaDto.tags_preparo !== undefined) receita.tags_preparo = updateReceitaDto.tags_preparo;
    if (updateReceitaDto.categoria_receita !== undefined) receita.categoria_receita = updateReceitaDto.categoria_receita;
    if (updateReceitaDto.descricao !== undefined) receita.descricao = updateReceitaDto.descricao;
    if (updateReceitaDto.imagem_url !== undefined) receita.imagem_url = updateReceitaDto.imagem_url;

    await this.receitaRepository.save(receita);

    // Se ingredientes foram enviados, atualiza
    if (updateReceitaDto.ingredientes) {
      // Remove ingredientes antigos
      await this.ingredienteRepository.delete({ receita_id: id });

      // Cria novos ingredientes
      const ingredientes = updateReceitaDto.ingredientes.map((ing, index) =>
        this.ingredienteRepository.create({
          receita_id: id,
          produto_id: ing.produto_id,
          quantidade: ing.quantidade,
          unidade: ing.unidade,
          opcional: ing.opcional || false,
          observacao: ing.observacao,
          ordem: ing.ordem || index + 1,
        }),
      );

      await this.ingredienteRepository.save(ingredientes);
    }

    return this.findOne(id);
  }

  /**
   * Marca receita como executada
   */
  async executar(
    receitaId: string,
    usuarioId: string,
    executarDto: ExecutarReceitaDto,
  ): Promise<ReceitaExecutada> {
    const receita = await this.findOne(receitaId);

    const executada = this.executadaRepository.create({
      usuario_id: usuarioId,
      receita_id: receitaId,
      porcoes_feitas: executarDto.porcoes_feitas,
      tempo_real_preparo: executarDto.tempo_real_preparo,
      avaliacao: executarDto.avaliacao,
      comentario: executarDto.comentario,
      data_execucao: new Date(),
    });

    const saved = await this.executadaRepository.save(executada);

    // Atualiza estatísticas da receita
    await this.atualizarEstatisticas(receitaId);

    return saved;
  }

  /**
   * Lista receitas executadas pelo usuário
   */
  async findExecutadas(usuarioId: string): Promise<ReceitaExecutada[]> {
    return this.executadaRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['receita'],
      order: { data_execucao: 'DESC' },
      take: 50,
    });
  }

  /**
   * Atualiza estatísticas (avaliação média e vezes executada)
   */
  private async atualizarEstatisticas(receitaId: string): Promise<void> {
    const execucoes = await this.executadaRepository.find({
      where: { receita_id: receitaId },
      select: ['avaliacao'],
    });

    const vezes_executada = execucoes.length;
    const avaliacoes = execucoes.filter(e => e.avaliacao).map(e => e.avaliacao);
    const avaliacao_media = avaliacoes.length > 0
      ? avaliacoes.reduce((sum, a) => sum + a, 0) / avaliacoes.length
      : 0;

    await this.receitaRepository.update(receitaId, {
      vezes_executada,
      avaliacao_media: Math.round(avaliacao_media * 100) / 100,
    });
  }

  /**
   * Motor MOI v1 - Sugestões inteligentes
   */
  async sugerirReceitas(usuarioId: string): Promise<Receita[]> {
    // TODO: Implementar lógica completa do Motor MOI
    // Por enquanto, retorna as receitas mais bem avaliadas
    return this.receitaRepository.find({
      relations: ['ingredientes', 'ingredientes.produto'],
      order: { avaliacao_media: 'DESC', vezes_executada: 'DESC' },
      take: 10,
    });
  }

  /**
   * Remove receita
   */
  async remove(id: string): Promise<void> {
    const receita = await this.findOne(id);
    await this.receitaRepository.remove(receita);
  }
}
