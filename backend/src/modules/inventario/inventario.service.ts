import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { Produto } from '../produtos/entities/produto.entity';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
  ) {}

  /**
   * Adiciona item ao inventário
   */
  async create(usuarioId: string, createInventarioDto: CreateInventarioDto): Promise<Inventario> {
    // Set default expiry date to 30 days from now if not provided
    const dataValidade = createInventarioDto.data_validade
      ? new Date(createInventarioDto.data_validade)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const inventario = this.inventarioRepository.create({
      usuario_id: usuarioId,
      produto_id: createInventarioDto.produto_id,
      quantidade_disponivel: createInventarioDto.quantidade_disponivel,
      unidade: createInventarioDto.unidade,
      data_validade: dataValidade,
      localizacao: createInventarioDto.localizacao,
      metodo_atualizacao: createInventarioDto.metodo_atualizacao,
      compra_item_id: createInventarioDto.compra_item_id,
    });

    return this.inventarioRepository.save(inventario);
  }

  /**
   * Lista todo o inventário do usuário
   */
  async findAll(usuarioId: string): Promise<Inventario[]> {
    return this.inventarioRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['produto', 'produto.marca', 'produto.categoria'],
      order: { data_validade: 'ASC' },
    });
  }

  /**
   * Busca itens vencendo em X dias
   */
  async findExpiringSoon(usuarioId: string, days = 7): Promise<Inventario[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.inventarioRepository.find({
      where: {
        usuario_id: usuarioId,
        data_validade: LessThanOrEqual(futureDate),
      },
      relations: ['produto', 'produto.marca'],
      order: { data_validade: 'ASC' },
    });
  }

  /**
   * Busca itens já vencidos
   */
  async findExpired(usuarioId: string): Promise<Inventario[]> {
    const today = new Date();

    return this.inventarioRepository.find({
      where: {
        usuario_id: usuarioId,
        data_validade: LessThanOrEqual(today),
      },
      relations: ['produto'],
      order: { data_validade: 'ASC' },
    });
  }

  /**
   * Busca um item específico
   */
  async findOne(id: string, usuarioId: string): Promise<Inventario> {
    const item = await this.inventarioRepository.findOne({
      where: { id, usuario_id: usuarioId },
      relations: ['produto', 'produto.marca', 'produto.categoria'],
    });

    if (!item) {
      throw new NotFoundException('Item de inventário não encontrado');
    }

    return item;
  }

  /**
   * Atualiza quantidade ou validade
   */
  async update(
    id: string,
    usuarioId: string,
    updateInventarioDto: UpdateInventarioDto,
  ): Promise<Inventario> {
    const item = await this.findOne(id, usuarioId);

    if (updateInventarioDto.quantidade_disponivel !== undefined) {
      item.quantidade_disponivel = updateInventarioDto.quantidade_disponivel;
    }

    if (updateInventarioDto.data_validade) {
      item.data_validade = new Date(updateInventarioDto.data_validade);
    }

    if (updateInventarioDto.localizacao) {
      item.localizacao = updateInventarioDto.localizacao;
    }

    return this.inventarioRepository.save(item);
  }

  /**
   * Remove item do inventário
   */
  async remove(id: string, usuarioId: string): Promise<void> {
    const item = await this.findOne(id, usuarioId);
    await this.inventarioRepository.remove(item);
  }

  /**
   * Deduz quantidade (usado ao executar receitas)
   */
  async deduzirQuantidade(
    usuarioId: string,
    produtoId: string,
    quantidade: number,
  ): Promise<void> {
    // Busca itens ordenados por validade (FIFO)
    const itens = await this.inventarioRepository.find({
      where: {
        usuario_id: usuarioId,
        produto_id: produtoId,
      },
      order: { data_validade: 'ASC' },
    });

    let restante = quantidade;

    for (const item of itens) {
      if (restante <= 0) break;

      const deduzir = Math.min(item.quantidade_disponivel, restante);
      item.quantidade_disponivel -= deduzir;
      restante -= deduzir;

      if (item.quantidade_disponivel <= 0) {
        await this.inventarioRepository.remove(item);
      } else {
        await this.inventarioRepository.save(item);
      }
    }
  }

  /**
   * Sincroniza inventário com compra
   */
  async sincronizarComCompra(usuarioId: string, compraId: string): Promise<void> {
    // TODO: Implementar lógica de sincronização
    // Busca os itens da compra e adiciona ao inventário
    // Usar CompraItem repository
  }

  /**
   * Estatísticas do inventário
   */
  async getStats(usuarioId: string): Promise<{
    total_itens: number;
    itens_vencendo: number;
    itens_vencidos: number;
    valor_estimado: number;
  }> {
    const all = await this.findAll(usuarioId);
    const vencendo = await this.findExpiringSoon(usuarioId, 7);
    const vencidos = await this.findExpired(usuarioId);

    return {
      total_itens: all.length,
      itens_vencendo: vencendo.length,
      itens_vencidos: vencidos.length,
      valor_estimado: 0, // Pode calcular baseado em preços médios
    };
  }

  /**
   * Lista inventário enriquecido com detalhes de classificação dos produtos
   * Formato esperado pelo mobile app
   */
  async findAllWithProductDetails(
    usuarioId: string,
    ingrediente_receita?: boolean,
  ): Promise<any> {
    let query = this.inventarioRepository
      .createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.produto', 'produto')
      .leftJoinAndSelect('produto.categoria', 'categoria')
      .where('inventario.usuario_id = :usuarioId', { usuarioId })
      .orderBy('inventario.data_validade', 'ASC');

    if (ingrediente_receita !== undefined) {
      query = query.andWhere('produto.ingrediente_receita = :ingrediente_receita', {
        ingrediente_receita,
      });
    }

    const itens = await query.getMany();

    // Mapear para o formato esperado pelo mobile
    const produtos = itens.map((item) => ({
      id: item.id,
      nome: item.produto.nome,
      categoria: item.produto.categoria?.nome || 'Sem categoria',
      quantidade_disponivel: Number(item.quantidade_disponivel),
      unidade: item.unidade,
      ingrediente_receita: item.produto.ingrediente_receita,
      confianca_classificacao: item.produto.confianca_classificacao || 0,
      data_adicao: item.criado_em,
      imagem_url: item.produto.imagem_url,
    }));

    // Calcular estatísticas
    const alimentos = produtos.filter((p) => p.ingrediente_receita).length;
    const nao_alimentos = produtos.filter((p) => !p.ingrediente_receita).length;

    return {
      total_produtos: produtos.length,
      alimentos,
      nao_alimentos,
      produtos,
    };
  }

  /**
   * Atualiza item e retorna detalhes com classificação
   */
  async updateWithProductDetails(
    id: string,
    usuarioId: string,
    updateInventarioDto: UpdateInventarioDto,
  ): Promise<any> {
    const item = await this.findOne(id, usuarioId);

    if (updateInventarioDto.quantidade_disponivel !== undefined) {
      item.quantidade_disponivel = updateInventarioDto.quantidade_disponivel;
    }

    if (updateInventarioDto.data_validade) {
      item.data_validade = new Date(updateInventarioDto.data_validade);
    }

    if (updateInventarioDto.localizacao) {
      item.localizacao = updateInventarioDto.localizacao;
    }

    const updated = await this.inventarioRepository.save(item);

    // Recarregar com relações
    const reloaded = await this.inventarioRepository.findOne({
      where: { id: updated.id },
      relations: ['produto', 'produto.categoria'],
    });

    if (!reloaded) {
      throw new NotFoundException('Item não encontrado após atualização');
    }

    return {
      id: reloaded.id,
      nome: reloaded.produto.nome,
      categoria: reloaded.produto.categoria?.nome || 'Sem categoria',
      quantidade_disponivel: Number(reloaded.quantidade_disponivel),
      unidade: reloaded.unidade,
      ingrediente_receita: reloaded.produto.ingrediente_receita,
      confianca_classificacao: reloaded.produto.confianca_classificacao || 0,
      data_adicao: reloaded.criado_em,
      imagem_url: reloaded.produto.imagem_url,
    };
  }

  /**
   * Busca item de inventário por usuário e produto
   */
  async findByProdutoAndUsuario(
    usuarioId: string,
    produtoId: string,
  ): Promise<Inventario | null> {
    return this.inventarioRepository.findOne({
      where: {
        usuario_id: usuarioId,
        produto_id: produtoId,
      },
    });
  }
}
