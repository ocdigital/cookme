import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receita } from '../entities/receita.entity';
import { Receita as ReceitaGerada } from './recipe-generator.service';

@Injectable()
export class ReceitaBancoService {
  private readonly logger = new Logger('ReceitaBancoService');

  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
  ) {}

  /**
   * Normaliza ingrediente: lowercase, remove acentos, trim
   */
  normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }

  normalizarLista(ingredientes: string[]): string[] {
    return [...new Set(ingredientes.map((i) => this.normalizar(i)))].sort();
  }

  /**
   * Busca receitas no banco que podem ser feitas com os ingredientes disponíveis.
   * Uma receita é retornada se pelo menos `percentualMinimo`% dos seus ingredientes
   * estão na lista do usuário.
   */
  async buscarPorIngredientes(
    ingredientes: string[],
    percentualMinimo = 0.7,
    limite = 5,
  ): Promise<Receita[]> {
    const normalizados = this.normalizarLista(ingredientes);

    if (normalizados.length === 0) return [];

    // Busca receitas que têm ingredientes_chave preenchidos e status ok
    const receitas = await this.receitaRepo
      .createQueryBuilder('r')
      .where('r.ingredientes_chave IS NOT NULL')
      .andWhere("r.status_moderacao = 'ok'")
      .orderBy('r.vezes_executada', 'DESC')
      .addOrderBy('r.avaliacao_media', 'DESC')
      .limit(200) // pool para filtrar
      .getMany();

    const candidatas: Array<{ receita: Receita; score: number }> = [];

    for (const receita of receitas) {
      const chaves = receita.ingredientes_chave || [];
      if (chaves.length === 0) continue;

      // Quantos ingredientes da receita o usuário tem
      const encontrados = chaves.filter((c) =>
        normalizados.some((n) => n.includes(c) || c.includes(n)),
      ).length;

      const score = encontrados / chaves.length;

      if (score >= percentualMinimo) {
        candidatas.push({ receita, score });
      }
    }

    // Ordena por maior cobertura de ingredientes
    candidatas.sort((a, b) => b.score - a.score);

    this.logger.log(
      `Busca banco: ${ingredientes.length} ingredientes → ${candidatas.length} receitas compatíveis (mín ${percentualMinimo * 100}%)`,
    );

    return candidatas.slice(0, limite).map((c) => c.receita);
  }

  /**
   * Salva uma receita gerada pela IA no banco compartilhado.
   * Evita duplicatas pelo título normalizado.
   */
  async salvarReceitaGerada(receita: ReceitaGerada): Promise<Receita> {
    const tituloNorm = this.normalizar(receita.titulo);

    // Verifica duplicata pelo título normalizado
    const existente = await this.receitaRepo
      .createQueryBuilder('r')
      .where('LOWER(unaccent(r.nome)) = :titulo', { titulo: tituloNorm })
      .getOne()
      .catch(() =>
        // fallback sem unaccent se extensão não instalada
        this.receitaRepo.findOne({
          where: { nome: receita.titulo },
        }),
      );

    if (existente) {
      this.logger.log(`Receita "${receita.titulo}" já existe no banco (id: ${existente.id})`);
      return existente;
    }

    const ingredientesChave = this.normalizarLista(receita.ingredientes);
    const tempoMinutos = this.parseTempo(receita.tempo_preparo);

    const nova = this.receitaRepo.create({
      nome: receita.titulo,
      descricao: receita.descricao,
      modo_preparo: receita.modo_preparo,
      tempo_preparo: tempoMinutos,
      rendimento_porcoes: this.parseRendimento(receita.rendimento),
      dificuldade: (receita.dificuldade as any) || 'médio',
      imagem_url: receita.imagem_url,
      ingredientes_chave: ingredientesChave,
      origem: 'ia_gerada',
      status_moderacao: 'ok',
    });

    const salva = await this.receitaRepo.save(nova);
    this.logger.log(`✅ Receita "${receita.titulo}" salva no banco (id: ${salva.id}), ingredientes: [${ingredientesChave.join(', ')}]`);
    return salva;
  }

  /**
   * Converte receita da entidade para o formato usado pelo mobile
   */
  entidadeParaFormato(receita: Receita): ReceitaGerada {
    return {
      titulo: receita.nome,
      descricao: receita.descricao || '',
      tempo_preparo: receita.tempo_preparo ? `${receita.tempo_preparo} minutos` : '',
      dificuldade: (receita.dificuldade as any) || 'médio',
      ingredientes: receita.ingredientes_chave || [],
      modo_preparo: receita.modo_preparo,
      rendimento: `${receita.rendimento_porcoes} porções`,
      imagem_url: receita.imagem_url,
    };
  }

  private parseTempo(tempo: string): number {
    const match = tempo?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
  }

  private parseRendimento(rendimento: string): number {
    const match = rendimento?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 2;
  }
}
