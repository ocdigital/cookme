import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '../../produtos/entities/produto.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { ItemReceipt } from './receipt-ocr.service';
import { ClassifiedProduct } from './product-classifier.service';
import { ProductType } from '@common/enums/product-type.enum';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';
import { MetodoCadastro } from '@common/enums/metodo-cadastro.enum';

interface ImportOptions {
  data_compra?: string;
  loja?: string;
}

interface ProdutoParaValidar {
  nome: string;
  ingrediente_receita: boolean;
  confianca_classificacao: number;
  requer_validacao_manual: boolean;
  motivo: string;
}

interface SalvarResultado {
  produtos_adicionados: number;
  requer_validacao: boolean;
  produtos_para_validar: ProdutoParaValidar[];
}

@Injectable()
export class ReceiptImportService {
  private readonly logger = new Logger(ReceiptImportService.name);

  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
  ) {}

  /**
   * Salva produtos extraídos do cupom no banco de dados + inventário do usuário
   *
   * Fluxo:
   * 1. Verificar se produto existe (por nome)
   * 2. Se não existe, criar novo
   * 3. Atualizar flags de classificação (ingrediente_receita)
   * 4. Adicionar ao inventário do usuário
   * 5. Marcar para validação se confiança baixa
   */
  async salvarProdutosInventario(
    usuarioId: string,
    itemsExtraidos: ItemReceipt[],
    produtosClassificados: ClassifiedProduct[],
    options: ImportOptions,
  ): Promise<SalvarResultado> {
    const produtosAdicionados: Produto[] = [];
    const produtosParaValidar: ProdutoParaValidar[] = [];

    // Map de classificação por nome (case-insensitive)
    const classificationMap = new Map<string, ClassifiedProduct>();
    for (const classified of produtosClassificados) {
      classificationMap.set(classified.nome.toLowerCase(), classified);
    }

    for (const item of itemsExtraidos) {
      const nomeNormalizado = item.nome.toLowerCase();
      const classificacao = classificationMap.get(nomeNormalizado);

      if (!classificacao) {
        this.logger.warn(
          `Produto ${item.nome} não encontrado em classificação, pulando`,
        );
        continue;
      }

      try {
        // 1. Procurar ou criar produto
        let produto = await this.produtoRepository.findOne({
          where: {
            nome: item.nome,
          },
        });

        if (!produto) {
          // Criar novo produto
          produto = this.produtoRepository.create({
            nome: item.nome,
            tipo: classificacao.categoria === 'alimento'
              ? ProductType.ALIMENTO
              : ProductType.NAO_ALIMENTO,
            ingrediente_receita: classificacao.ingrediente_receita,
            confianca_classificacao: classificacao.confianca,
            requer_validacao_manual: classificacao.confianca < 80,
            unidade_padrao: UnidadeMedida.UN,
            origem: 'cupom_ocr',
          });

          produto = await this.produtoRepository.save(produto);
          this.logger.debug(`Novo produto criado: ${produto.nome}`);
        } else {
          // Atualizar flags existentes
          if (!produto.requer_validacao_manual) {
            produto.ingrediente_receita = classificacao.ingrediente_receita;
            produto.confianca_classificacao = classificacao.confianca;
            produto.requer_validacao_manual = classificacao.confianca < 80;
            await this.produtoRepository.save(produto);
          }
        }

        // 2. Adicionar ao inventário
        const inventarioExistente = await this.inventarioRepository.findOne({
          where: {
            usuario_id: usuarioId,
            produto_id: produto.id,
          },
        });

        if (inventarioExistente) {
          // Aumentar quantidade
          inventarioExistente.quantidade_disponivel += item.quantidade;
          await this.inventarioRepository.save(inventarioExistente);
        } else {
          // Criar novo inventário
          const inventario = this.inventarioRepository.create({
            usuario_id: usuarioId,
            produto_id: produto.id,
            quantidade_disponivel: item.quantidade,
            unidade: UnidadeMedida.UN,
            metodo_atualizacao: MetodoCadastro.OCR_NOTA,
          });

          await this.inventarioRepository.save(inventario);
        }

        produtosAdicionados.push(produto);

        // 3. Marcar para validação se confiança baixa
        if (classificacao.confianca < 80) {
          produtosParaValidar.push({
            nome: produto.nome,
            ingrediente_receita: classificacao.ingrediente_receita,
            confianca_classificacao: classificacao.confianca,
            requer_validacao_manual: true,
            motivo: classificacao.motivo,
          });
        }
      } catch (error) {
        this.logger.error(`Erro ao processar produto ${item.nome}:`, error);
      }
    }

    return {
      produtos_adicionados: produtosAdicionados.length,
      requer_validacao: produtosParaValidar.length > 0,
      produtos_para_validar: produtosParaValidar,
    };
  }

  /**
   * Valida manualmente a classificação de um produto
   * Atualiza a flag ingrediente_receita e marca como validado
   */
  async validarProdutoManualmente(
    produtoId: string,
    usuarioId: string,
    ingrediente_receita: boolean,
    motivo?: string,
  ): Promise<void> {
    const produto = await this.produtoRepository.findOne({
      where: { id: produtoId },
    });

    if (!produto) {
      throw new BadRequestException('Produto não encontrado');
    }

    // Atualizar classificação
    produto.ingrediente_receita = ingrediente_receita;
    produto.requer_validacao_manual = false;
    produto.confianca_classificacao = 100; // Marca como validado manualmente

    await this.produtoRepository.save(produto);

    this.logger.log(
      `Produto ${produto.nome} validado manualmente por ${usuarioId}: ingrediente_receita=${ingrediente_receita}`,
    );
  }

  /**
   * Lista produtos que requerem validação manual
   */
  async obterProdutosParaValidar(): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: {
        requer_validacao_manual: true,
      },
      order: {
        confianca_classificacao: 'ASC', // Menos confiança primeiro
        criado_em: 'DESC',
      },
    });
  }
}
