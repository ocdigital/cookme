import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PreferenciaAprendida, TipoPreferencia } from '../../usuarios/entities/preferencia-aprendida.entity';
import { ReceitaExecutada } from '../entities/receita-executada.entity';
import { ReceitaBancoService, AUXILIARES } from './receita-banco.service';

/** Uma linha achatada: um ingrediente_chave (ou categoria) × uma avaliação. */
interface LinhaSinal {
  avaliacao: number;
  ingrediente_chave: string | null;
  tags_dieta: string | null;
}

/** Saldo consolidado de um valor (ingrediente ou categoria). */
interface Saldo {
  positivo: number; // soma de sinais de receitas bem avaliadas
  negativo: number; // soma de sinais de receitas mal avaliadas
}

@Injectable()
export class AprendizadoService {
  constructor(
    @InjectRepository(PreferenciaAprendida)
    private readonly prefRepo: Repository<PreferenciaAprendida>,
    @InjectRepository(ReceitaExecutada)
    private readonly executadaRepo: Repository<ReceitaExecutada>,
    private readonly dataSource: DataSource,
    private readonly receitaBanco: ReceitaBancoService,
  ) {}

  /**
   * Deriva as preferências do usuário a partir das receitas que ele avaliou.
   *
   * Fonte: `receitas_executadas` avaliadas JOIN `receitas`, lendo o array
   * canônico `ingredientes_chave` (100% das receitas têm; já normalizado, o mesmo
   * que o matching usa) — NÃO mais `receita_ingredientes`/`produtos.nome` (sujo do
   * OCR, presente em só 61% das receitas).
   *
   * Consolidação: para cada ingrediente/categoria acumula um SALDO (positivo de
   * receitas nota≥4, negativo de nota≤2). O saldo líquido decide favorito OU
   * aversão — nunca os dois. As preferências antigas são apagadas e regravadas
   * (idempotente), evitando a contradição que o upsert incremental acumulava.
   */
  async derivarPreferencias(usuarioId: string): Promise<void> {
    const linhas: LinhaSinal[] = await this.dataSource.query(
      `
      SELECT
        e.avaliacao,
        ing AS ingrediente_chave,
        r.tags_dieta
      FROM receitas_executadas e
      JOIN receitas r ON r.id = e.receita_id
      LEFT JOIN LATERAL unnest(r.ingredientes_chave) AS ing ON true
      WHERE e.usuario_id = $1
        AND e.avaliacao IS NOT NULL
      `,
      [usuarioId],
    );

    const saldoIngrediente = new Map<string, Saldo>();
    const saldoCategoria = new Map<string, Saldo>();

    for (const row of linhas) {
      const nota = Number(row.avaliacao);
      const sinal = this.sinalDaNota(nota);
      if (sinal === 0) continue; // notas 3 são neutras

      // Ingrediente
      if (row.ingrediente_chave) {
        const chave = this.receitaBanco.normalizar(row.ingrediente_chave);
        if (chave && !AUXILIARES.has(chave)) {
          this.acumular(saldoIngrediente, chave, sinal);
        }
      }

      // Categorias (tags_dieta é CSV — simple-array)
      const tags = row.tags_dieta
        ? row.tags_dieta.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      for (const tag of tags) {
        this.acumular(saldoCategoria, tag.toLowerCase(), sinal);
      }
    }

    const novas: PreferenciaAprendida[] = [
      ...this.consolidar(usuarioId, saldoIngrediente, TipoPreferencia.INGREDIENTE_FAVORITO, TipoPreferencia.INGREDIENTE_AVERSAO),
      ...this.consolidar(usuarioId, saldoCategoria, TipoPreferencia.CATEGORIA_FAVORITA, TipoPreferencia.CATEGORIA_AVERSAO),
    ];

    // Regrava do zero — mantém apenas o tipo RECEITA_URL_IGNORADA (gerido em outro
    // fluxo), removendo só as dimensões derivadas de avaliação.
    await this.prefRepo.delete({ usuario_id: usuarioId, tipo: TipoPreferencia.INGREDIENTE_FAVORITO });
    await this.prefRepo.delete({ usuario_id: usuarioId, tipo: TipoPreferencia.INGREDIENTE_AVERSAO });
    await this.prefRepo.delete({ usuario_id: usuarioId, tipo: TipoPreferencia.CATEGORIA_FAVORITA });
    await this.prefRepo.delete({ usuario_id: usuarioId, tipo: TipoPreferencia.CATEGORIA_AVERSAO });

    if (novas.length > 0) {
      await this.prefRepo.save(novas.map((n) => this.prefRepo.create(n)));
    }
  }

  /** +1 para nota alta (≥4), -1 para baixa (≤2), 0 para neutra. */
  private sinalDaNota(nota: number): number {
    if (nota >= 4) return 1;
    if (nota <= 2) return -1;
    return 0;
  }

  private acumular(mapa: Map<string, Saldo>, valor: string, sinal: number): void {
    const s = mapa.get(valor) ?? { positivo: 0, negativo: 0 };
    if (sinal > 0) s.positivo += sinal;
    else s.negativo += -sinal;
    mapa.set(valor, s);
  }

  /**
   * Converte saldos consolidados em preferências. Saldo líquido positivo → favorito,
   * negativo → aversão, zero (empate) → ignora. Score reflete a intensidade do sinal
   * (mais reforço → mais perto de 1), capped em 1.
   */
  private consolidar(
    usuarioId: string,
    mapa: Map<string, Saldo>,
    tipoFavorito: TipoPreferencia,
    tipoAversao: TipoPreferencia,
  ): PreferenciaAprendida[] {
    const out: PreferenciaAprendida[] = [];
    for (const [valor, saldo] of mapa) {
      const liquido = saldo.positivo - saldo.negativo;
      if (liquido === 0) continue;

      const magnitude = Math.abs(liquido);
      // score: satura suavemente — 1 reforço ~0.3, 2 ~0.55, 3 ~0.7… → cap 1
      const score = Math.min(1, 0.3 + (magnitude - 1) * 0.25);
      const contagem = saldo.positivo + saldo.negativo;

      out.push({
        usuario_id: usuarioId,
        tipo: liquido > 0 ? tipoFavorito : tipoAversao,
        valor,
        score,
        contagem,
      } as PreferenciaAprendida);
    }
    return out;
  }

  async perfilAprendizado(usuarioId: string): Promise<PerfilAprendizadoDto> {
    const prefs = await this.prefRepo.find({ where: { usuario_id: usuarioId } });

    const favoritos = prefs.filter((p) => p.tipo === TipoPreferencia.INGREDIENTE_FAVORITO);
    const aversoesIng = prefs.filter((p) => p.tipo === TipoPreferencia.INGREDIENTE_AVERSAO);
    const aversoesCat = prefs.filter((p) => p.tipo === TipoPreferencia.CATEGORIA_AVERSAO);
    const categorias = prefs.filter((p) => p.tipo === TipoPreferencia.CATEGORIA_FAVORITA);

    const execucoes = await this.executadaRepo.count({ where: { usuario_id: usuarioId } });

    // Ordena por score desc para expor os sinais mais fortes no card acionável
    const porScore = (a: PreferenciaAprendida, b: PreferenciaAprendida) => b.score - a.score;
    const topValores = (arr: PreferenciaAprendida[], n: number) =>
      [...arr].sort(porScore).slice(0, n).map((p) => p.valor);

    return {
      ingredientes_favoritos: Math.min(100, favoritos.length * 10),
      gostos_e_aversoes: Math.min(100, (aversoesIng.length + aversoesCat.length) * 15),
      ritmo_de_cozinha: Math.min(100, execucoes * 5),
      categorias_preferidas: Math.min(100, categorias.length * 12),
      total_avaliacoes: execucoes,
      // Listas acionáveis para o card "O CookMe está te conhecendo"
      favoritos: topValores(favoritos, 5),
      aversoes: topValores([...aversoesIng, ...aversoesCat], 3),
      categorias_favoritas: topValores(categorias, 3),
    };
  }
}

export interface PerfilAprendizadoDto {
  ingredientes_favoritos: number;
  gostos_e_aversoes: number;
  ritmo_de_cozinha: number;
  categorias_preferidas: number;
  total_avaliacoes: number;
  favoritos: string[];
  aversoes: string[];
  categorias_favoritas: string[];
}
