import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Compra } from './entities/compra.entity';
import { CompraItem } from './entities/compra-item.entity';
import { CreateCompraDto } from './dto/create-compra.dto';
import { Produto } from '../produtos/entities/produto.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { ProductClassificationService } from '../product-classification/services/product-classification.service';
import { OcrAliasService } from '../product-classification/services/ocr-alias.service';
import { ProductImageService } from '../produtos/services/product-image.service';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { MetodoCadastro } from '@common/enums/metodo-cadastro.enum';
import { ProductType } from '@common/enums/product-type.enum';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
    @InjectRepository(CompraItem)
    private readonly compraItemRepository: Repository<CompraItem>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    private readonly productClassificationService: ProductClassificationService,
    private readonly ocrAliasService: OcrAliasService,
    private readonly productImageService: ProductImageService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cria uma compra com seus itens (transação com validação de produtos)
   */
  async create(usuarioId: string, createCompraDto: CreateCompraDto): Promise<Compra> {
    // Cria a compra
    const compra = this.compraRepository.create({
      usuario_id: usuarioId,
      data_compra: new Date(createCompraDto.data_compra),
      local_compra: createCompraDto.local_compra,
      valor_total: createCompraDto.valor_total,
      metodo_cadastro: createCompraDto.metodo_cadastro,
      tempo_cadastro_segundos: createCompraDto.tempo_cadastro_segundos,
    });

    const savedCompra = await this.compraRepository.save(compra);

    // Busca produtos referenciados nos itens
    const produtoIds = createCompraDto.itens
      .map((item) => item.produto_id)
      .filter((id) => id);

    let produtoMap = new Map<string, Produto>();
    if (produtoIds.length > 0) {
      const produtos = await this.produtoRepository
        .createQueryBuilder('produto')
        .where('produto.id IN (:...ids)', { ids: produtoIds })
        .getMany();
      produtoMap = new Map(produtos.map((p) => [p.id, p]));
    }

    const itensComProduto = createCompraDto.itens.filter(
      (item) => produtoMap.has(item.produto_id),
    );

    if (itensComProduto.length === 0) {
      return this.findOne(savedCompra.id, usuarioId);
    }

    // Classifica em background e persiste ingrediente_receita em cada produto
    const itensParaSalvar = itensComProduto;
    this.productClassificationService
      .classificarEmBatch(
        itensComProduto.map((item) => produtoMap.get(item.produto_id)?.nome || '').filter(Boolean),
        usuarioId,
      )
      .then(async (classificacoes) => {
        for (const clf of classificacoes) {
          if (clf.ingrediente_receita === null || clf.ingrediente_receita === undefined) continue;
          // Encontra o produto pelo nome e atualiza a flag
          const produto = [...produtoMap.values()].find(
            (p) => p.nome === clf.produto || (p as any).nome_display === clf.produto,
          );
          if (produto) {
            const updates: Record<string, any> = { ingrediente_receita: clf.ingrediente_receita };
            // Retroalimenta nome_display com canonical_name da IA (ex: "Req Tirolez 200G" → "requeijão")
            if (clf.canonical_name) updates.nome_display = clf.canonical_name;
            await this.produtoRepository.update(produto.id, updates);
            console.log(`🏷️  ${clf.produto} → "${clf.canonical_name || '-'}" | ingrediente=${clf.ingrediente_receita} (conf=${clf.confidence})`);
          }
        }
      })
      .catch(() => {});

    // Salva itens na compra
    const compraItems: CompraItem[] = itensParaSalvar.map((item) =>
      this.compraItemRepository.create({
        compra_id: savedCompra.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        unidade: item.unidade,
        preco_unitario: item.preco_unitario,
        validade_final: item.validade_final ? new Date(item.validade_final) : null,
        lote: item.lote,
      }),
    );

    if (compraItems.length > 0) {
      const savedItems = await this.compraItemRepository.save(compraItems);

      // Recalcula valor_total a partir dos itens quando o DTO veio com 0 (SEFAZ/QR)
      if (!savedCompra.valor_total || Number(savedCompra.valor_total) === 0) {
        const totalCalculado = savedItems.reduce(
          (s, i) => s + Number(i.preco_unitario) * Number(i.quantidade),
          0,
        );
        if (totalCalculado > 0) {
          await this.compraRepository.update(savedCompra.id, {
            valor_total: Math.round(totalCalculado * 100) / 100,
          });
        }
      }

      // Atualiza inventário via upsert: só produtos que são (ou podem ser) ingredientes
      // ingrediente_receita=false significa explicitamente não-ingrediente (p.ex. papel higiênico)
      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + 30);
      const metodo = (savedCompra.metodo_cadastro as MetodoCadastro) ?? MetodoCadastro.CUPOM_SAT;

      for (const ci of savedItems.filter((ci) => {
        if (ci.produto_id == null) return false;
        const produto = produtoMap.get(ci.produto_id);
        // Se já classificado como NÃO-ingrediente, não adiciona à despensa
        return produto?.ingrediente_receita !== false;
      })) {
        await this.dataSource.query(
          `INSERT INTO inventario
             (id, usuario_id, produto_id, quantidade_disponivel, unidade, data_validade,
              metodo_atualizacao, compra_item_id, esgotado, criado_em, ultima_atualizacao)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, false, NOW(), NOW())
           ON CONFLICT (usuario_id, produto_id, data_validade)
           DO UPDATE SET
             quantidade_disponivel = inventario.quantidade_disponivel + EXCLUDED.quantidade_disponivel,
             ultima_atualizacao = NOW()`,
          [usuarioId, ci.produto_id, ci.quantidade, ci.unidade, dataValidade, metodo, ci.id ?? null],
        );
      }
    }

    return this.findOne(savedCompra.id, usuarioId);
  }

  /**
   * Lista compras do usuário
   */
  async findAll(usuarioId: string, limit = 50, mes?: number, ano?: number): Promise<Compra[]> {
    const qb = this.compraRepository
      .createQueryBuilder('compra')
      .leftJoinAndSelect('compra.itens', 'item')
      .leftJoinAndSelect('item.produto', 'produto')
      .where('compra.usuario_id = :uid', { uid: usuarioId })
      .orderBy('compra.data_compra', 'DESC')
      .take(limit);

    if (mes !== undefined && ano !== undefined) {
      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes, 1);
      qb.andWhere('compra.data_compra >= :inicio', { inicio })
        .andWhere('compra.data_compra < :fim', { fim });
    }

    return qb.getMany();
  }

  /**
   * Busca uma compra específica
   */
  async findOne(id: string, usuarioId: string): Promise<Compra> {
    const compra = await this.compraRepository.findOne({
      where: { id, usuario_id: usuarioId },
      relations: ['itens', 'itens.produto', 'itens.produto.marca'],
    });

    if (!compra) {
      throw new NotFoundException('Compra não encontrada');
    }

    return compra;
  }

  /**
   * Remove uma compra (e seus itens em cascade)
   */
  async remove(id: string, usuarioId: string): Promise<void> {
    const compra = await this.findOne(id, usuarioId);
    await this.compraRepository.remove(compra);
  }

  /**
   * Resumo de gastos do mês atual
   */
  async resumoMes(usuarioId: string, mes?: number, ano?: number): Promise<{
    gasto_mes: number;
    total_compras_mes: number;
    total_itens_mes: number;
    mes_label: string;
  }> {
    const agora = new Date();
    const m = mes !== undefined ? mes - 1 : agora.getMonth();
    const a = ano ?? agora.getFullYear();
    const inicio = new Date(a, m, 1);
    const fim = new Date(a, m + 1, 1);

    const compras = await this.compraRepository
      .createQueryBuilder('compra')
      .leftJoinAndSelect('compra.itens', 'item')
      .where('compra.usuario_id = :uid', { uid: usuarioId })
      .andWhere('compra.data_compra >= :inicio', { inicio })
      .andWhere('compra.data_compra < :fim', { fim })
      .getMany();

    const gasto_mes = compras.reduce((s, c) => {
      const vt = Number(c.valor_total);
      if (vt > 0) return s + vt;
      // fallback: soma dos itens (registros antigos gravados com valor_total=0)
      const vtItens = (c.itens ?? []).reduce(
        (si, i) => si + Number(i.preco_unitario) * Number(i.quantidade),
        0,
      );
      return s + vtItens;
    }, 0);
    const total_itens_mes = compras.reduce((s, c) => s + (c.itens?.length ?? 0), 0);
    const mes_label = inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return {
      gasto_mes: Math.round(gasto_mes * 100) / 100,
      total_compras_mes: compras.length,
      total_itens_mes,
      mes_label,
    };
  }

  /**
   * Estatísticas de compras do usuário
   */
  async getStats(usuarioId: string): Promise<{
    total_compras: number;
    valor_total: number;
    compra_media: number;
    ultima_compra: Date | null;
  }> {
    const compras = await this.compraRepository.find({
      where: { usuario_id: usuarioId },
      select: ['valor_total', 'data_compra'],
    });

    const total_compras = compras.length;
    const valor_total = compras.reduce((sum, c) => sum + Number(c.valor_total), 0);
    const compra_media = total_compras > 0 ? valor_total / total_compras : 0;
    const ultima_compra = total_compras > 0
      ? compras.sort((a, b) => b.data_compra.getTime() - a.data_compra.getTime())[0].data_compra
      : null;

    return {
      total_compras,
      valor_total: Math.round(valor_total * 100) / 100,
      compra_media: Math.round(compra_media * 100) / 100,
      ultima_compra,
    };
  }

  /**
   * Extrai itens de um cupom fiscal usando OCR com Google Gemini Vision
   */
  async extrairItensCupom(imageBase64: string): Promise<any> {
    try {
      const genai = require('@google/generative-ai');
      const { GoogleGenerativeAI } = genai;

      const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = googleAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `Você é um assistente especializado em ler cupons fiscais e notas fiscais.

Analise esta imagem de cupom fiscal ou nota fiscal e extraia as seguintes informações em formato JSON:

{
    "estabelecimento": {
        "nome": "nome da loja",
        "cnpj": "cnpj se visível",
        "endereco": "endereço se visível"
    },
    "itens": [
        {
            "nome": "nome do produto",
            "quantidade": 1,
            "valor": "valor unitário",
            "codigo_barras": "código de barras se visível"
        }
    ],
    "totais": {
        "subtotal": "valor",
        "desconto": "valor se houver",
        "total": "valor total"
    },
    "informacoes_fiscais": {
        "data_hora": "data e hora em ISO format",
        "numero_nfe": "número se visível"
    }
}

IMPORTANTE:
- Extraia TODOS os itens que conseguir identificar
- Use "." como separador decimal para valores
- Se um campo não estiver visível, omita-o
- Retorne APENAS o JSON válido, sem texto adicional
- Os nomes dos produtos devem ser os mais precisos possível`;

      const response = await model.generateContent([
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg',
          },
        },
        prompt,
      ]);

      const responseText = response.response.text();

      // Limpar resposta de markdown se necessário
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }

      const dados = JSON.parse(jsonText.trim());

      // Normalizar dados
      return this.normalizarDadosCupom(dados);
    } catch (error) {
      console.error('Erro ao processar OCR:', error);
      throw new Error('Erro ao processar cupom fiscal. Tente novamente.');
    }
  }

  /**
   * Normaliza os dados extraídos do cupom
   */
  private normalizarDadosCupom(dados: any): any {
    const itensProcessados: any[] = [];

    // Processar itens
    if (Array.isArray(dados?.itens)) {
      for (const item of dados.itens) {
        try {
          const valor = parseFloat(
            String(item.valor || '0').replace(',', '.'),
          );
          const quantidade = parseFloat(
            String(item.quantidade || '1').replace(',', '.'),
          );

          itensProcessados.push({
            nome: String(item.nome || '').trim(),
            quantidade,
            valor: valor.toFixed(2),
            valor_total: (valor * quantidade).toFixed(2),
            codigo_barras: item.codigo_barras || '',
          });
        } catch (e) {
          console.error('Erro ao processar item:', item, e);
        }
      }
    }

    // Calcular total se não estiver presente
    const totais = dados?.totais || {};
    if (!totais.total && itensProcessados.length > 0) {
      const total = itensProcessados.reduce(
        (sum: number, item: any) => sum + parseFloat(item.valor_total),
        0,
      );
      totais.total = total.toFixed(2);
    }

    const resultado = {
      estabelecimento: dados?.estabelecimento || {},
      itens: itensProcessados,
      totais,
      informacoes_fiscais: dados?.informacoes_fiscais || {},
      data_extracao: new Date().toISOString(),
    };

    return resultado;
  }

  /**
   * Salva itens extraídos do cupom no inventário do usuário
   * Cria produtos automaticamente se não existirem
   */
  async salvarItensCupomNoInventario(
    usuarioId: string,
    itens: Array<{
      nome: string;
      quantidade?: number;
      valor?: number;
      codigo_barras?: string;
    }>,
  ) {
    const itensSalvos: Inventario[] = [];

    for (const item of itens) {
      try {
        // 1. Buscar ou criar produto
        let produto: Produto | null = null;

        // Tentar buscar por código de barras se disponível
        if (item.codigo_barras) {
          produto = await this.produtoRepository.findOne({
            where: { codigo_barras: item.codigo_barras },
          });
        }

        // Se não encontrou por código, buscar por nome
        if (!produto) {
          produto = await this.produtoRepository.findOne({
            where: { nome: item.nome },
          });
        }

        // Se ainda não existe, criar novo produto
        if (!produto) {
          const novoProduto = this.produtoRepository.create({
            nome: item.nome,
            tipo: ProductType.ALIMENTO,
            codigo_barras: item.codigo_barras || undefined,
            unidade_padrao: UnidadeMedida.UN,
          });
          produto = await this.produtoRepository.save(novoProduto);

          // Normalizar nome OCR → nome_display canônico em background
          const produtoRef = produto;
          this.ocrAliasService
            .resolverNomeCanônico(item.nome)
            .then((nomeDisplay) => {
              if (nomeDisplay && nomeDisplay !== item.nome.toLowerCase()) {
                return this.produtoRepository.update(produtoRef.id, { nome_display: nomeDisplay });
              }
            })
            .catch(() => {});

          // Buscar imagem automaticamente em background (não bloqueia)
          this.productImageService
            .fetchAndSaveProductImage(produto!.id)
            .catch((err) => {
              console.error(
                `Erro ao buscar imagem para produto ${produto!.nome}:`,
                err,
              );
            });
        } else if (!produto.nome_display) {
          // Produto existente sem nome_display — normalizar também
          const produtoRef = produto;
          this.ocrAliasService
            .resolverNomeCanônico(produto.nome)
            .then((nomeDisplay) => {
              if (nomeDisplay && nomeDisplay !== produto!.nome.toLowerCase()) {
                return this.produtoRepository.update(produtoRef.id, { nome_display: nomeDisplay });
              }
            })
            .catch(() => {});
        }

        // 2. Upsert no inventário — somar quantidade se já existe com mesma validade
        const quantidade = item.quantidade || 1;
        const dataValidade = new Date();
        dataValidade.setDate(dataValidade.getDate() + 30);

        const existente = await this.inventarioRepository.findOne({
          where: {
            usuario_id: usuarioId,
            produto_id: produto!.id,
            data_validade: dataValidade,
          },
        });

        let salvo: Inventario;
        if (existente) {
          existente.quantidade_disponivel = parseFloat(String(existente.quantidade_disponivel)) + parseFloat(String(quantidade));
          salvo = await this.inventarioRepository.save(existente);
        } else {
          const novoInventario = this.inventarioRepository.create({
            usuario_id: usuarioId,
            produto_id: produto!.id,
            quantidade_disponivel: quantidade,
            unidade: UnidadeMedida.UN,
            data_validade: dataValidade,
            metodo_atualizacao: MetodoCadastro.OCR_NOTA,
            localizacao: 'Adicionado via OCR',
          });
          salvo = await this.inventarioRepository.save(novoInventario);
        }
        itensSalvos.push(salvo as Inventario);
      } catch (error) {
        console.error(`Erro ao salvar item "${item.nome}":`, error);
        // Continuar com próximos itens
      }
    }

    return {
      total: itens.length,
      salvos: itensSalvos.length,
      itens: itensSalvos,
    };
  }

  /**
   * Extrai data de validade de uma imagem usando OCR com Google Gemini
   */
  async extrairDataValidade(imageBase64: string): Promise<any> {
    try {
      const genai = require('@google/generative-ai');
      const { GoogleGenerativeAI } = genai;

      const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = googleAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `Você é um assistente especializado em ler datas de validade em produtos.

Analise esta imagem e extraia a data de validade em formato ISO (YYYY-MM-DD).

Retorne um JSON com este formato:
{
    "data_validade": "YYYY-MM-DD",
    "confianca": "alta" ou "media" ou "baixa",
    "observacao": "qualquer detalhe relevante"
}

IMPORTANTE:
- A data DEVE estar no formato YYYY-MM-DD
- Se não conseguir extrair a data, deixe data_validade como null
- Use apenas a informação visível na imagem
- Se houver múltiplas datas, retorne a de validade (não a de fabricação)
- Retorne APENAS o JSON válido, sem texto adicional`;

      const response = await model.generateContent([
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg',
          },
        },
        prompt,
      ]);

      const responseText = response.response.text();

      // Limpar resposta de markdown se necessário
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }

      const result = JSON.parse(jsonText.trim());

      return {
        success: !!result.data_validade,
        data_validade: result.data_validade,
        confianca: result.confianca,
        observacao: result.observacao,
      };
    } catch (error) {
      console.error('Erro ao extrair data de validade:', error);
      return {
        success: false,
        data_validade: null,
        error: 'Falha ao processar imagem',
      };
    }
  }
}
