import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Receita } from '../entities/receita.entity';
import { IngredientNormalizerService } from './ingredient-normalizer.service';
import { separarReceitaLegado } from './receita-legado.util';

// Padrões que indicam fragmento ruim no ingrediente_chave
const FRAGMENTO_RUIM = [
  /\s+e$/i,                  // "alho e"
  /\s+ou\s+/i,               // "leite ou água"
  /\s+para\s+/i,             // "manteiga para untar"
  /\s+de\s+\d/i,             // "suco de 4 limões"
  /^\d/,                     // começa com número
  /\bvontade\b/i,            // "a vontade"
  /\bbitido\b|\bbatido\b/i,  // "ovos batido"
  /\bespirem|\besprem/i,      // "batata espremida"
  /(toalha|alumin|plastico|papel)/i,
  /\bpara\b.{4,}/i,          // instrução "para untar as formas"
];

@Injectable()
export class IngredientCleanerService {
  private readonly logger = new Logger(IngredientCleanerService.name);
  private geminiApiKey: string | null = null;

  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly normalizer: IngredientNormalizerService,
  ) {
    this.geminiApiKey = this.config.get<string>('GEMINI_API_KEY') || null;
  }

  // ── Limpeza determinística (sem IA) ──────────────────────────────────────

  limparChavesDeterministico(chaves: string[]): string[] {
    const resultado = new Set<string>();

    for (const chave of chaves) {
      // Remove chaves ruins
      if (FRAGMENTO_RUIM.some(r => r.test(chave))) {
        // Tenta recuperar: pega só o primeiro ingrediente antes do separador
        const recuperado = chave
          .replace(/\s+(e|ou)\s+.*/i, '')  // remove " e ..." ou " ou ..."
          .replace(/\s+para\s+.*/i, '')     // remove " para ..."
          .trim();
        if (recuperado.length >= 2 && !FRAGMENTO_RUIM.some(r => r.test(recuperado))) {
          const norm = this.normalizer.extrairChaves([recuperado]);
          norm.forEach(n => resultado.add(n));
        }
        continue;
      }

      // Expande "X e Y" inline
      const partes = chave.split(/\s+(?:e|ou)\s+/i).map(p => p.trim()).filter(p => p.length >= 2);
      if (partes.length > 1) {
        const norm = this.normalizer.extrairChaves(partes);
        norm.forEach(n => resultado.add(n));
      } else {
        const norm = this.normalizer.extrairChaves([chave]);
        norm.forEach(n => resultado.add(n));
      }
    }

    return [...resultado].sort();
  }

  // ── Extração via Gemini (reextrair do modo_preparo + ingredientes raw) ──

  async extrairIngredientesComIA(receita: Receita): Promise<string[] | null> {
    if (!this.geminiApiKey) return null;

    // Usa ingredientes originais do modo_preparo se disponível
    const contexto = receita.modo_preparo
      ? `Nome: ${receita.nome}\nModo de preparo: ${receita.modo_preparo.substring(0, 800)}`
      : `Nome: ${receita.nome}\nIngredientes: ${(receita.ingredientes_chave || []).join(', ')}`;

    const prompt = `Analise esta receita brasileira e extraia APENAS os ingredientes principais (sem quantidades, sem instruções).

${contexto}

Regras:
- Retorne APENAS nomes de ingredientes limpos, um por linha
- Sem quantidades ("200g", "2 xícaras")
- Sem instruções ("picado", "amassado", "para untar")
- Sem alternativas ("ou leite de coco") — escolha o principal
- Sem "a gosto" (sal, pimenta, azeite, etc)
- Máximo 12 ingredientes
- Ingredientes canônicos em português simples ("frango" não "peito de frango desossado")

Responda APENAS com JSON array: ["ingrediente1", "ingrediente2", ...]`;

    try {
      const axios = (await import('axios')).default;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 256, temperature: 0.1 },
      }, { timeout: 15000 });

      const texto = res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const jsonMatch = texto.match(/\[[\s\S]*?\]/);
      if (!jsonMatch) return null;

      const raw: string[] = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(raw) || raw.length === 0) return null;

      // Passa pelo normalizer para canonizar
      return this.normalizer.extrairChaves(raw);
    } catch (err: any) {
      if (err?.response?.status === 429) throw new Error('RATE_LIMIT');
      this.logger.warn(`Gemini erro para "${receita.nome}": ${err?.message}`);
      return null;
    }
  }

  // ── Job batch: limpa todas as receitas com ingredientes_chave sujos ──────

  async limparBanco(limite = 30, usarIA = true): Promise<{
    processadas: number;
    melhoradas: number;
    erros: number;
  }> {
    const receitas = await this.receitaRepo
      .createQueryBuilder('r')
      .where("r.status_moderacao = 'ok'")
      .andWhere('r.ingredientes_chave IS NOT NULL')
      .orderBy('r.criado_em', 'ASC')
      .limit(limite)
      .getMany();

    let processadas = 0, melhoradas = 0, erros = 0;

    for (const receita of receitas) {
      try {
        const chavesOriginais = receita.ingredientes_chave || [];

        // Fase 1: limpeza determinística (rápida, sem IA)
        const chavesLimpas = this.limparChavesDeterministico(chavesOriginais);

        // Fase 2: reextração com IA se receita tem modo_preparo e ainda tem fragmentos
        let chavesFinais = chavesLimpas;
        const temFragmento = chavesOriginais.some(c => FRAGMENTO_RUIM.some(r => r.test(c)));

        if (usarIA && temFragmento && receita.modo_preparo) {
          const chavesIA = await this.extrairIngredientesComIA(receita);
          if (chavesIA && chavesIA.length >= 2) {
            // Merge: IA tem prioridade, mas mantém chaves limpas que IA não capturou
            const merged = new Set([...chavesIA, ...chavesLimpas]);
            chavesFinais = [...merged].sort();
          }
          // Rate limit: pausa entre chamadas Gemini
          await new Promise(r => setTimeout(r, 500));
        }

        // Só atualiza se mudou
        const mudou = JSON.stringify(chavesOriginais.sort()) !== JSON.stringify(chavesFinais.sort());
        if (mudou) {
          await this.dataSource.query(
            'UPDATE receitas SET ingredientes_chave = $1 WHERE id = $2',
            [chavesFinais, receita.id],
          );
          this.logger.log(
            `✅ "${receita.nome}": [${chavesOriginais.join(', ')}] → [${chavesFinais.join(', ')}]`
          );
          melhoradas++;
        }

        processadas++;
      } catch (err: any) {
        if (err?.message === 'RATE_LIMIT') {
          this.logger.warn('Rate limit Gemini — pausando 60s');
          await new Promise(r => setTimeout(r, 60000));
        } else {
          this.logger.error(`Erro em "${receita.nome}": ${err?.message}`);
          erros++;
        }
      }
    }

    return { processadas, melhoradas, erros };
  }

  // ── Status: quantas receitas têm ingredientes sujos ──────────────────────

  async statusLimpeza(): Promise<{
    total: number;
    comFragmentos: number;
    exemplos: Array<{ nome: string; chaves: string[] }>;
  }> {
    const receitas = await this.receitaRepo
      .createQueryBuilder('r')
      .where("r.status_moderacao = 'ok'")
      .andWhere('r.ingredientes_chave IS NOT NULL')
      .getMany();

    const comFragmentos = receitas.filter(r =>
      (r.ingredientes_chave || []).some(c => FRAGMENTO_RUIM.some(rx => rx.test(c)))
    );

    return {
      total: receitas.length,
      comFragmentos: comFragmentos.length,
      exemplos: comFragmentos.slice(0, 5).map(r => ({
        nome: r.nome,
        chaves: r.ingredientes_chave || [],
      })),
    };
  }

  // ── Backfill: receitas do seed groq_seed com ingredientes embutidos ──────

  /**
   * Corrige receitas legadas cujos ingredientes ficaram embutidos no
   * modo_preparo como bloco "INGREDIENTES:". Para cada uma:
   *   1. separa o bloco → ingredientes_texto (exibição)
   *   2. limpa o modo_preparo (só passos)
   *   3. recomputa ingredientes_chave a partir da lista COMPLETA
   * Determinístico e idempotente (roda sem IA; receita já corrigida é pulada).
   */
  async corrigirIngredientesEmbutidos(limite = 500): Promise<{
    processadas: number;
    corrigidas: number;
  }> {
    const receitas = await this.receitaRepo
      .createQueryBuilder('r')
      .where("r.modo_preparo LIKE 'INGREDIENTES:%'")
      .limit(limite)
      .getMany();

    let processadas = 0;
    let corrigidas = 0;

    for (const receita of receitas) {
      processadas++;
      const sep = separarReceitaLegado(receita.modo_preparo);
      if (!sep.tinhaBlocoEmbutido) continue;

      const chaves = this.normalizer.extrairChaves(sep.ingredientesTexto);

      await this.dataSource.query(
        `UPDATE receitas
         SET ingredientes_texto = $1, modo_preparo = $2, ingredientes_chave = $3
         WHERE id = $4`,
        [sep.ingredientesTexto, sep.modoPreparoLimpo, chaves, receita.id],
      );
      corrigidas++;
      this.logger.log(
        `✅ "${receita.nome}": ${sep.ingredientesTexto.length} ingredientes separados, ${chaves.length} chaves`,
      );
    }

    return { processadas, corrigidas };
  }
}
