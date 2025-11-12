import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateLink } from '../entities/affiliate-link.entity';
import { AffiliateClick } from '../entities/affiliate-click.entity';
import { AffiliateConversion, ConversionStatus } from '../entities/affiliate-conversion.entity';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>,
    @InjectRepository(AffiliateClick)
    private affiliateClickRepository: Repository<AffiliateClick>,
    @InjectRepository(AffiliateConversion)
    private affiliateConversionRepository: Repository<AffiliateConversion>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Registra um clique em um link de afiliado
   */
  async registrarClique(
    affiliateLinkId: string,
    usuarioId: string,
    receitaId: string,
    deviceInfo?: any,
    ipAddress?: string,
  ): Promise<AffiliateClick> {
    // Valida link existe
    const affiliateLink = await this.affiliateLinkRepository.findOne({
      where: { id: affiliateLinkId, is_active: true },
    });

    if (!affiliateLink) {
      throw new NotFoundException('Link de afiliado não encontrado ou inativo');
    }

    // Cria registro de clique
    const click = this.affiliateClickRepository.create({
      affiliate_link_id: affiliateLinkId,
      usuario_id: usuarioId,
      receita_id: receitaId,
      device_info: deviceInfo,
      ip_address: ipAddress,
    });

    const savedClick = await this.affiliateClickRepository.save(click);

    // Se o link tem comissão por clique, registra transação
    if (affiliateLink.comissao_por_clique && affiliateLink.comissao_por_clique > 0) {
      await this.criarTransacao(
        usuarioId,
        affiliateLink.comissao_por_clique,
        TransactionType.AFFILIATE_COMMISSION,
        `Comissão por clique - ${affiliateLink.supermarket_name}`,
        TransactionStatus.PENDING,
        {
          affiliate_link_id: affiliateLinkId,
        },
      );
    }

    return savedClick;
  }

  /**
   * Registra uma conversão (compra realizada)
   */
  async registrarConversao(
    affiliateClickId: string,
    pedidoId: string,
    valorPedido: number,
  ): Promise<AffiliateConversion> {
    // Busca o clique
    const click = await this.affiliateClickRepository.findOne({
      where: { id: affiliateClickId },
      relations: ['affiliate_link'],
    });

    if (!click) {
      throw new NotFoundException('Clique não encontrado');
    }

    const comissaoGanha = (valorPedido * click.affiliate_link.comissao_percentual) / 100;

    // Cria conversão
    const conversion = this.affiliateConversionRepository.create({
      affiliate_click_id: affiliateClickId,
      pedido_id: pedidoId,
      valor_pedido: valorPedido,
      comissao_ganha: comissaoGanha,
      status: ConversionStatus.PENDING,
      converted_at: new Date(),
    });

    const savedConversion = await this.affiliateConversionRepository.save(conversion);

    // Registra transação de comissão
    await this.criarTransacao(
      click.usuario_id,
      comissaoGanha,
      TransactionType.AFFILIATE_COMMISSION,
      `Comissão de venda - ${click.affiliate_link.supermarket_name}`,
      TransactionStatus.PENDING,
      {
        affiliate_link_id: click.affiliate_link_id,
        conversion_id: savedConversion.id,
      },
    );

    return savedConversion;
  }

  /**
   * Busca links ativos de um supermercado
   */
  async buscarLinksAtivos(supermarketName?: string): Promise<AffiliateLink[]> {
    const query = this.affiliateLinkRepository
      .createQueryBuilder('link')
      .where('link.is_active = :active', { active: true });

    if (supermarketName) {
      query.andWhere('link.supermarket_name = :supermarketName', { supermarketName });
    }

    return query.orderBy('link.created_at', 'DESC').getMany();
  }

  /**
   * Busca links por receita
   */
  async buscarLinksReceita(receitaId: string): Promise<AffiliateLink[]> {
    return this.affiliateLinkRepository.find({
      where: {
        receita_id: receitaId,
        is_active: true,
      },
      order: {
        comissao_percentual: 'DESC',
      },
    });
  }

  /**
   * Cria um novo link de afiliado
   */
  async criarLink(
    receitaId: string,
    supermarketName: string,
    affiliateUrl: string,
    comissaoPercentual: number,
    comissaoPorClique?: number,
  ): Promise<AffiliateLink> {
    if (!receitaId || !supermarketName || !affiliateUrl) {
      throw new BadRequestException('Campos obrigatórios faltando');
    }

    const link = this.affiliateLinkRepository.create({
      receita_id: receitaId,
      supermarket_name: supermarketName,
      affiliate_url: affiliateUrl,
      comissao_percentual: comissaoPercentual,
      comissao_por_clique: comissaoPorClique,
      is_active: true,
    });

    return this.affiliateLinkRepository.save(link);
  }

  /**
   * Desativa um link de afiliado
   */
  async desativarLink(affiliateLinkId: string): Promise<void> {
    await this.affiliateLinkRepository.update(
      { id: affiliateLinkId },
      { is_active: false },
    );
  }

  /**
   * Obtém estatísticas de cliques e conversões
   */
  async obterEstatisticas(
    dataInicio: Date,
    dataFim: Date,
    supermarketName?: string,
  ): Promise<{
    totalCliques: number;
    totalConversoes: number;
    taxaConversao: number;
    comissaoTotal: number;
  }> {
    const clicksQuery = this.affiliateClickRepository
      .createQueryBuilder('click')
      .where('click.clicked_at BETWEEN :dataInicio AND :dataFim', {
        dataInicio,
        dataFim,
      });

    if (supermarketName) {
      clicksQuery.leftJoin('click.affiliate_link', 'link')
        .andWhere('link.supermarket_name = :supermarketName', { supermarketName });
    }

    const totalCliques = await clicksQuery.getCount();

    // Conversões
    const conversionsQuery = this.affiliateConversionRepository
      .createQueryBuilder('conversion')
      .where('conversion.created_at BETWEEN :dataInicio AND :dataFim', {
        dataInicio,
        dataFim,
      });

    const totalConversoes = await conversionsQuery.getCount();
    const comissaoTotal = await conversionsQuery
      .select('SUM(conversion.comissao_ganha)', 'total')
      .getRawOne()
      .then(r => parseFloat(r.total) || 0);

    const taxaConversao = totalCliques > 0 ? (totalConversoes / totalCliques) * 100 : 0;

    return {
      totalCliques,
      totalConversoes,
      taxaConversao,
      comissaoTotal,
    };
  }

  /**
   * Cria uma transação de comissão ou pagamento
   */
  private async criarTransacao(
    usuarioId: string,
    valor: number,
    tipo: TransactionType,
    descricao: string,
    status: TransactionStatus,
    metadata?: any,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      usuario_id: usuarioId,
      tipo,
      valor,
      descricao,
      status,
      metadata,
    });

    return this.transactionRepository.save(transaction);
  }

  /**
   * Obtém comissões pendentes de um usuário
   */
  async obterComissoesPendentes(usuarioId: string): Promise<{
    comissoesPendentes: number;
    comissoesConfirmadas: number;
    comissoesPagas: number;
    proximaTransferencia: Date;
  }> {
    const pendentes = await this.transactionRepository
      .createQueryBuilder('t')
      .where('t.usuario_id = :usuarioId', { usuarioId })
      .andWhere('t.tipo = :tipo', { tipo: TransactionType.AFFILIATE_COMMISSION })
      .andWhere('t.status = :status', { status: TransactionStatus.PENDING })
      .select('SUM(t.valor)', 'total')
      .getRawOne();

    const confirmadas = await this.transactionRepository
      .createQueryBuilder('t')
      .where('t.usuario_id = :usuarioId', { usuarioId })
      .andWhere('t.tipo = :tipo', { tipo: TransactionType.AFFILIATE_COMMISSION })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .select('SUM(t.valor)', 'total')
      .getRawOne();

    const pagas = await this.transactionRepository
      .createQueryBuilder('t')
      .where('t.usuario_id = :usuarioId', { usuarioId })
      .andWhere('t.tipo = :tipo', { tipo: TransactionType.AFFILIATE_COMMISSION })
      .andWhere('t.status != :status', { status: TransactionStatus.PENDING })
      .select('SUM(t.valor)', 'total')
      .getRawOne();

    // Calcula próxima transferência (último dia do mês)
    const now = new Date();
    const proximaTransferencia = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      comissoesPendentes: parseFloat(pendentes.total) || 0,
      comissoesConfirmadas: parseFloat(confirmadas.total) || 0,
      comissoesPagas: parseFloat(pagas.total) || 0,
      proximaTransferencia,
    };
  }
}
