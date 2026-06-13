import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { PlanejamentoSemanal } from './entities/planejamento-semanal.entity';
import { Receita } from '../receitas/entities/receita.entity';
import { Preferencia } from '../usuarios/entities/preferencia.entity';

// Mapa de estados → região culinária
export const ESTADO_REGIAO_MAP: Record<string, string> = {
  AC: 'norte', AM: 'norte', AP: 'norte', PA: 'norte', RO: 'norte', RR: 'norte', TO: 'norte',
  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste', PB: 'nordeste',
  PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',
  DF: 'centro_oeste', GO: 'centro_oeste', MS: 'centro_oeste', MT: 'centro_oeste',
  ES: 'sudeste', MG: 'sudeste', RJ: 'sudeste', SP: 'sudeste',
  PR: 'sul', RS: 'sul', SC: 'sul',
};

// Tradições por dia/região: bonus de score
const TRADICOES: Record<string, Record<string, string[]>> = {
  sudeste:     { sexta: ['feijoada'], sabado: ['feijoada', 'churrasco'], domingo: ['churrasco', 'macarronada'] },
  nordeste:    { sabado: ['cozido', 'buchada'], domingo: ['sarapatel', 'arroz_de_cuxe'] },
  sul:         { domingo: ['churrasco', 'costela_gaúcha'], sabado: ['macarrao', 'polenta'] },
  centro_oeste: { domingo: ['arroz_com_pequi', 'pacu_frito'], sabado: ['churrasco'] },
  norte:       { domingo: ['pato_no_tucupi', 'tacacá'], sabado: ['pirarucu'] },
};

const DIAS: string[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

@Injectable()
export class PlanejamentoService {
  constructor(
    @InjectRepository(PlanejamentoSemanal)
    private readonly repo: Repository<PlanejamentoSemanal>,
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
    @InjectRepository(Preferencia)
    private readonly prefRepo: Repository<Preferencia>,
  ) {}

  async listarSemana(usuarioId: string, semana: number) {
    const items = await this.repo.find({
      where: { usuario_id: usuarioId, numero_semana: semana },
      relations: ['receita'],
      order: { dia_semana: 'ASC', tipo_refeicao: 'ASC' },
    });
    return items;
  }

  async definirReceita(
    usuarioId: string,
    semana: number,
    diaSemana: number,
    tipoRefeicao: 'almoco' | 'jantar',
    receitaId: string | null,
  ) {
    let item = await this.repo.findOne({
      where: {
        usuario_id: usuarioId,
        numero_semana: semana,
        dia_semana: diaSemana,
        tipo_refeicao: tipoRefeicao,
      },
    });

    if (!item) {
      item = this.repo.create({
        usuario_id: usuarioId,
        numero_semana: semana,
        dia_semana: diaSemana,
        tipo_refeicao: tipoRefeicao,
        receita_id: receitaId,
      });
    } else {
      item.receita_id = receitaId;
      item.feita = false;
      item.avaliacao = null;
    }

    return this.repo.save(item);
  }

  async marcarFeita(usuarioId: string, id: string, avaliacao?: number) {
    const item = await this.repo.findOne({ where: { id, usuario_id: usuarioId } });
    if (!item) throw new Error('Planejamento não encontrado');
    item.feita = true;
    if (avaliacao) item.avaliacao = avaliacao;
    return this.repo.save(item);
  }

  async limparDia(usuarioId: string, semana: number, diaSemana: number, tipoRefeicao?: 'almoco' | 'jantar') {
    const where: any = { usuario_id: usuarioId, numero_semana: semana, dia_semana: diaSemana };
    if (tipoRefeicao) where.tipo_refeicao = tipoRefeicao;
    await this.repo.delete(where);
  }

  async gerarAleatoria(usuarioId: string, semana: number, apenasRegional = false) {
    const pref = await this.prefRepo.findOne({ where: { usuario_id: usuarioId } });
    const regiaoUser = pref?.regiao_culinaria || null;
    const refeicoes = this.resolverRefeicoes(pref?.refeicoes_planejamento || 'almoco_jantar');

    const modoAlimentar = pref?.modo_alimentar || 'normal';

    // Busca receitas disponíveis
    const todasReceitas = await this.receitaRepo.find({
      where: { status_moderacao: 'ok' },
      select: ['id', 'nome', 'regiao_origem', 'dias_semana_tradicionais', 'periodo_sazonal', 'categoria_receita', 'imagem_url', 'dificuldade', 'tags_dieta'],
    });

    /* REGIONAL_FILTER_DISABLED
    const receitas = (apenasRegional && regiaoUser)
      ? todasReceitas.filter(r => !r.regiao_origem || r.regiao_origem === regiaoUser || r.regiao_origem === 'nacional')
      : todasReceitas;
    const candidatasGeral = receitas.length > 0 ? receitas : todasReceitas;
    */

    // Aplica filtro de modo alimentar
    const contemTag = (r: Partial<Receita>, ...tags: string[]) => {
      const str = String(r.tags_dieta || '').toLowerCase();
      return tags.some(t => str.includes(t));
    };
    let candidatasGeral = todasReceitas;
    if (modoAlimentar === 'vegetariano') {
      const filtradas = todasReceitas.filter(r => contemTag(r, 'vegetariano', 'vegano'));
      candidatasGeral = filtradas.length >= 7 ? filtradas : todasReceitas;
    } else if (modoAlimentar === 'vegano') {
      const filtradas = todasReceitas.filter(r => contemTag(r, 'vegano'));
      candidatasGeral = filtradas.length >= 7 ? filtradas : todasReceitas;
    } else if (modoAlimentar === 'fitness') {
      const filtradas = todasReceitas.filter(r => contemTag(r, 'fitness', 'fit', 'proteico', 'low-carb'));
      candidatasGeral = filtradas.length >= 7 ? filtradas : todasReceitas;
    }

    // Limpa planejamento existente da semana antes de gerar
    await this.repo.delete({ usuario_id: usuarioId, numero_semana: semana });

    for (let dia = 0; dia <= 6; dia++) {
      for (const tipo of refeicoes) {
        const nomeDia = DIAS[dia];
        const candidatas = this.scorearReceitas(candidatasGeral, regiaoUser || 'nacional', nomeDia, tipo);
        if (candidatas.length === 0) continue;

        const pool = candidatas.slice(0, Math.min(5, candidatas.length));
        const escolhida = pool[Math.floor(Math.random() * pool.length)];

        await this.definirReceita(usuarioId, semana, dia, tipo, escolhida.id ?? null);
      }
    }

    // Retorna semana completa com receitas populadas
    return this.listarSemana(usuarioId, semana);
  }

  async receitaDoDia(usuarioId: string): Promise<PlanejamentoSemanal | null> {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    // Calcula semana do mês (1-4)
    const semana = Math.ceil(hoje.getDate() / 7);

    const item = await this.repo.findOne({
      where: {
        usuario_id: usuarioId,
        numero_semana: semana,
        dia_semana: diaSemana,
        tipo_refeicao: 'almoco',
      },
      relations: ['receita'],
    });

    return item || null;
  }

  private resolverRefeicoes(pref: string): Array<'almoco' | 'jantar'> {
    if (pref === 'almoco') return ['almoco'];
    if (pref === 'jantar') return ['jantar'];
    return ['almoco', 'jantar'];
  }

  private scorearReceitas(
    receitas: Partial<Receita>[],
    regiao: string,
    nomeDia: string,
    tipo: 'almoco' | 'jantar',
  ): Partial<Receita>[] {
    const tradicoes = TRADICOES[regiao] || {};
    const pratos_tradicionais_hoje = tradicoes[nomeDia] || [];

    const scored = receitas.map((r) => {
      let score = 0;

      // 40% nacional (base)
      score += 40;

      // 35% regional
      if (r.regiao_origem === regiao || r.regiao_origem === 'nacional') {
        score += 35;
      } else if (!r.regiao_origem) {
        score += 20;
      }

      // Tradição do dia (+25)
      const nomeNorm = (r.nome || '').toLowerCase().replace(/\s+/g, '_');
      if (pratos_tradicionais_hoje.some(p => nomeNorm.includes(p))) {
        score += 25;
      }

      // Bônus para categoria correspondente
      if (tipo === 'almoco' && r.categoria_receita === 'almoco') score += 10;
      if (tipo === 'jantar' && r.categoria_receita === 'jantar') score += 10;

      // Aleatoriedade para variedade
      score += Math.random() * 15;

      return { receita: r, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map((s) => s.receita);
  }
}
