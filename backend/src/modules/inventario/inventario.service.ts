import { Injectable, NotFoundException, ConflictException, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { Produto } from '../produtos/entities/produto.entity';
import { CompraItem } from '../compras/entities/compra-item.entity';
import { PushNotificationService } from '../notificacoes/services/push-notification.service';
import { OcrAliasService } from '../product-classification/services/ocr-alias.service';
import { AbbreviationService } from '../product-classification/services/abbreviation.service';
import { ProductClassificationService } from '../product-classification/services/product-classification.service';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { MetodoCadastro } from '@common/enums/metodo-cadastro.enum';
import { ProductType } from '@common/enums/product-type.enum';

@Injectable()
export class InventarioService {
  private readonly logger = new Logger(InventarioService.name);

  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(CompraItem)
    private readonly compraItemRepository: Repository<CompraItem>,
    @Optional()
    private readonly push: PushNotificationService,
    @Optional()
    private readonly ocrAliasService: OcrAliasService,
    @Optional()
    private readonly abbreviationService: AbbreviationService,
    @Optional()
    private readonly classificationService: ProductClassificationService,
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

  async adicionarManual(
    usuarioId: string,
    nome: string,
    quantidade: number,
    unidade: UnidadeMedida,
    dataValidade?: string,
  ): Promise<Inventario> {
    const nomeLimpo = nome.trim().toLowerCase();

    // Busca produto existente pelo nome (case-insensitive)
    let produto: Produto | null = await this.produtoRepository
      .createQueryBuilder('p')
      .where('LOWER(p.nome) = :nome', { nome: nomeLimpo })
      .orWhere('LOWER(p.nome_display) = :nome', { nome: nomeLimpo })
      .getOne();

    // Cria produto se não existe
    if (!produto) {
      const novo = this.produtoRepository.create({
        nome: nomeLimpo,
        nome_display: nome.trim(),
        tipo: ProductType.ALIMENTO,
        ingrediente_receita: true,
      } as Produto);
      produto = await this.produtoRepository.save(novo);
    } else if (!produto.ingrediente_receita) {
      // Produto existe mas não estava marcado como alimento — corrige
      await this.produtoRepository.update(produto.id, {
        ingrediente_receita: true,
        tipo: ProductType.ALIMENTO,
      });
      produto.ingrediente_receita = true;
    }

    const validade = dataValidade
      ? new Date(dataValidade)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const item = this.inventarioRepository.create({
      usuario_id: usuarioId,
      produto_id: produto!.id,
      quantidade_disponivel: quantidade,
      unidade,
      data_validade: validade,
      metodo_atualizacao: MetodoCadastro.MANUAL,
    });

    return this.inventarioRepository.save(item);
  }

  /**
   * Lista todo o inventário do usuário
   */
  async findAll(usuarioId: string): Promise<Inventario[]> {
    return this.inventarioRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['produto', 'produto.marca', 'produto.categoria'],
      order: { produto: { nome: 'ASC' } },
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
      order: { produto: { nome: 'ASC' } },
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
      order: { produto: { nome: 'ASC' } },
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
   * Remove todos os itens do inventário do usuário
   */
  async limparTodos(usuarioId: string): Promise<{ deletados: number }> {
    const result = await this.inventarioRepository.delete({ usuario_id: usuarioId });
    return { deletados: result.affected ?? 0 };
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
      order: { produto: { nome: 'ASC' } },
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

    const toTitleCase = (s: string) =>
      s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    // Mapear e deduplicar por nome_display (produtos diferentes, mesmo ingrediente)
    const mapped = itens
      .filter((item) => item.produto.ingrediente_receita !== false)
      .map((item) => ({
      id: item.id,
      nome: toTitleCase((item.produto as any).nome_display || item.produto.nome),
      nome_original: item.produto.nome,
      categoria: item.produto.categoria?.nome || 'Sem categoria',
      quantidade_disponivel: Number(item.quantidade_disponivel),
      unidade: item.unidade,
      ingrediente_receita: item.produto.ingrediente_receita,
      confianca_classificacao: item.produto.confianca_classificacao || 0,
      produto_id: item.produto_id,
      data_adicao: item.criado_em,
      data_validade: item.data_validade,
      imagem_url: item.produto.imagem_url,
      esgotado: item.esgotado,
      esgotado_em: item.esgotado_em,
    }));

    // Agrupa por canonical (nome_display): soma quantidade de produtos com mesmo nome
    const seen = new Map<string, typeof mapped[0]>();
    for (const item of mapped) {
      const key = item.nome.toLowerCase().trim();
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, { ...item });
      } else {
        // Soma quantidade disponível de todos os produtos com mesmo canonical
        existing.quantidade_disponivel += item.quantidade_disponivel;
        // Prefere o não-esgotado como base
        if (existing.esgotado && !item.esgotado) {
          const qtdTotal = existing.quantidade_disponivel;
          seen.set(key, { ...item, quantidade_disponivel: qtdTotal });
        }
      }
    }
    const produtos = Array.from(seen.values());

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
   * Marca/desmarca ingrediente como esgotado
   */
  async marcarEsgotado(id: string, usuarioId: string, esgotado: boolean): Promise<any> {
    const item = await this.findOne(id, usuarioId);

    item.esgotado = esgotado;
    item.esgotado_em = esgotado ? new Date() : (undefined as any);
    await this.inventarioRepository.save(item);

    const reloaded = await this.inventarioRepository.findOne({
      where: { id },
      relations: ['produto', 'produto.categoria'],
    });

    if (!reloaded) throw new Error('Item não encontrado após atualização');

    // Dispara push quando ingrediente é marcado como esgotado
    if (esgotado && this.push) {
      this.push.enviarParaUsuario(
        usuarioId,
        '🛒 Ingrediente acabou',
        `${reloaded.produto.nome} acabou na sua despensa. Adicionar à lista de compras?`,
        { tipo: 'ingrediente_esgotado', rota: '/(app)/(tabs)/listas' },
      ).catch(() => {});
    }

    return {
      id: reloaded.id,
      nome: reloaded.produto.nome,
      esgotado: reloaded.esgotado,
      esgotado_em: reloaded.esgotado_em,
      ingrediente_receita: reloaded.produto.ingrediente_receita,
    };
  }

  /**
   * Corrige o nome exibido de um item do inventário.
   * Atualiza nome_display no produto e cria/atualiza alias na tabela de abreviações.
   */
  async corrigirNome(inventarioId: string, usuarioId: string, novoNome: string): Promise<void> {
    const item = await this.findOne(inventarioId, usuarioId);
    const produto = await this.produtoRepository.findOneOrFail({ where: { id: item.produto_id } });

    const nomeLimpo = novoNome.trim().toLowerCase();
    await this.produtoRepository.update(produto.id, { nome_display: nomeLimpo });

    // Cria alias: primeiros tokens do nome OCR → novo nome canônico
    if (this.abbreviationService && produto.nome) {
      const tokens = produto.nome.trim().toUpperCase().split(/\s+/);
      // Tenta abreviações de 1, 2 e 3 tokens
      for (let len = Math.min(2, tokens.length); len >= 1; len--) {
        const abbr = tokens.slice(0, len).join(' ');
        if (abbr.length >= 2) {
          try {
            await this.abbreviationService.create({
              abbr,
              expanded: nomeLimpo,
              is_ingredient: true,
              categoria: 'user_correcao',
            });
          } catch {
            // Já existe — atualiza
            const existing = await this.abbreviationService['repo']?.findOneBy?.({ abbr });
            if (existing) {
              await this.abbreviationService.update(existing.id, { expanded: nomeLimpo });
            }
          }
          break; // Usa só o alias mais curto que funcionar
        }
      }
    }
  }

  /**
   * Importa automaticamente ingredientes elegíveis das compras pendentes.
   * Classifica cada item via tabela de abreviações + OcrAliasService.
   * Insere apenas itens com is_ingredient=true que ainda não estão no inventário.
   */
  async importarIngredientesAutomatico(usuarioId: string): Promise<{
    importados: string[];
    ignorados: string[];
    ja_existiam: string[];
  }> {
    // Busca todos compra_itens do usuário ainda não adicionados ao inventário
    const itens: CompraItem[] = await this.compraItemRepository
      .createQueryBuilder('ci')
      .innerJoin('ci.compra', 'c')
      .leftJoinAndSelect('ci.produto', 'produto')
      .where('c.usuario_id = :usuarioId', { usuarioId })
      .andWhere('ci.adicionado_inventario = false')
      .getMany();

    if (itens.length === 0) {
      return { importados: [], ignorados: [], ja_existiam: [] };
    }

    const importados: string[] = [];
    const ignorados: string[] = [];
    const ja_existiam: string[] = [];

    for (const item of itens) {
      const nomeOcr = item.nome_ocr || item.nome_display || item.produto?.nome || '';
      if (!nomeOcr) continue;

      let isIngredient: boolean | null = null;
      let canonicalName: string = nomeOcr;
      let produto = item.produto;

      // 1. Se já tem produto com classificação definida
      if (produto?.ingrediente_receita !== null && produto?.ingrediente_receita !== undefined) {
        isIngredient = produto.ingrediente_receita;
        canonicalName = produto.nome_display || produto.nome;
      } else {
        // 2. Classificar via abbreviation service (cache em memória)
        const abbrResult = this.abbreviationService?.expand(nomeOcr);
        if (abbrResult) {
          isIngredient = abbrResult.is_ingredient;
          canonicalName = abbrResult.expanded;
        } else if (this.ocrAliasService) {
          // 3. OcrAliasService (regex + KB + fuzzy)
          const canonical = await this.ocrAliasService.resolverNomeCanônico(nomeOcr);
          if (canonical && canonical !== nomeOcr.toLowerCase()) {
            canonicalName = canonical;
            isIngredient = true; // resolverNomeCanônico só retorna para ingredientes
          }
        }
      }

      // Se ainda desconhecido, tenta classificar via IA
      if (isIngredient === null && this.classificationService) {
        try {
          const [clf] = await this.classificationService.classificarEmBatch([nomeOcr]);
          if (clf) {
            isIngredient = clf.ingrediente_receita ?? null;
            if (clf.canonical_name) canonicalName = clf.canonical_name;
          }
        } catch { /* ignora erro de IA */ }
      }

      // Ignora não-ingredientes e itens sem classificação clara
      if (isIngredient === false) {
        ignorados.push(nomeOcr);
        await this.compraItemRepository.update(item.id, { adicionado_inventario: true });
        continue;
      }

      if (isIngredient === null && !canonicalName) {
        ignorados.push(nomeOcr);
        continue;
      }

      // 4. Encontra ou cria produto com o nome canônico
      if (!produto) {
        produto = await this.produtoRepository.findOne({
          where: { nome: canonicalName },
        });

        if (!produto) {
          try {
            produto = this.produtoRepository.create({
              nome: canonicalName,
              nome_display: canonicalName,
              ingrediente_receita: true,
              unidade_padrao: this.inferirUnidade(item.unidade),
            });
            produto = await this.produtoRepository.save(produto);
          } catch {
            // Nome duplicado — tenta buscar de novo
            produto = await this.produtoRepository.findOne({ where: { nome: canonicalName } });
            if (!produto) { ignorados.push(nomeOcr); continue; }
          }
        }
      }

      // 5. Verifica se já existe no inventário
      const jaExiste = await this.inventarioRepository.findOne({
        where: { usuario_id: usuarioId, produto_id: produto.id },
      });

      if (jaExiste) {
        ja_existiam.push(canonicalName);
        await this.compraItemRepository.update(item.id, { adicionado_inventario: true });
        continue;
      }

      // 6. Insere no inventário
      try {
        const validade = item.validade_final || item.validade_escaneada || item.validade_manual || null;
        await this.inventarioRepository.save(
          this.inventarioRepository.create({
            usuario_id: usuarioId,
            produto_id: produto.id,
            quantidade_disponivel: Number(item.quantidade) || 1,
            unidade: this.inferirUnidade(item.unidade),
            data_validade: validade ? new Date(validade) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            compra_item_id: item.id,
            metodo_atualizacao: MetodoCadastro.OCR_NOTA,
          }),
        );
        importados.push(canonicalName);
        await this.compraItemRepository.update(item.id, { adicionado_inventario: true });
      } catch (e) {
        // Conflito de unique constraint (mesmo produto+data já existe)
        if (e?.code === '23505') {
          ja_existiam.push(canonicalName);
          await this.compraItemRepository.update(item.id, { adicionado_inventario: true });
        } else {
          this.logger.warn(`Falha ao importar "${canonicalName}": ${e?.message}`);
          ignorados.push(nomeOcr);
        }
      }
    }

    return { importados, ignorados, ja_existiam };
  }

  private inferirUnidade(unidade?: string): UnidadeMedida {
    if (!unidade) return UnidadeMedida.UN;
    const u = unidade.toLowerCase().trim();
    const map: Record<string, UnidadeMedida> = {
      kg: UnidadeMedida.KG, g: UnidadeMedida.G, mg: UnidadeMedida.MG,
      l: UnidadeMedida.L, lt: UnidadeMedida.L, litro: UnidadeMedida.L,
      ml: UnidadeMedida.ML, un: UnidadeMedida.UN, unid: UnidadeMedida.UN,
      unidade: UnidadeMedida.UN, pct: UnidadeMedida.PCT, cx: UnidadeMedida.CX,
    };
    return map[u] || UnidadeMedida.UN;
  }

  /**
   * Retorna lista de ingredientes disponíveis (não esgotados) para geração de receitas
   */
  async ingredientesDisponiveis(usuarioId: string): Promise<string[]> {
    // Joins product_knowledge_base to get canonical_ingredient as fallback
    const rows: Array<{ nome: string; nome_display: string | null; canonical_ingredient: string | null }> =
      await this.inventarioRepository.query(
        `SELECT DISTINCT p.nome, p.nome_display, pkb.canonical_ingredient
         FROM inventario inv
         JOIN produtos p ON p.id = inv.produto_id
         LEFT JOIN product_knowledge_base pkb ON pkb.product_name ILIKE p.nome
         WHERE inv.usuario_id = $1
           AND inv.esgotado = false
           AND p.ingrediente_receita IS NOT FALSE`,
        [usuarioId],
      );

    const stripAccents = (s: string) =>
      s.normalize('NFD').replace(/[̀-ͯ]/g, '');

    const normalize = (nome: string): string =>
      stripAccents(nome)
        .toLowerCase()
        .replace(/^\d+\s+/g, '')
        .replace(/\b\d+\s*(kg|g|ml|l|un|gr)\b/gi, '')
        .replace(/\b(kg|un|gr)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(' ')
        .trim();

    return [
      ...new Set(
        rows
          .map((r) => {
            if (r.nome_display) return stripAccents(r.nome_display).toLowerCase().trim();
            if (r.canonical_ingredient) return stripAccents(r.canonical_ingredient).toLowerCase().trim();
            return normalize(r.nome);
          })
          .filter((n) => n.length > 1),
      ),
    ];
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
