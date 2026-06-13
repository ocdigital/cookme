/**
 * Seed do banco compartilhado de receitas.
 * Chama a IA (Gemini/Claude) com listas variadas de ingredientes e salva no banco.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-receitas.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { dataSourceOptions } from '../config/database.config';
import { Receita } from '../modules/receitas/entities/receita.entity';
import { DificuldadeReceita } from '../common/enums/dificuldade-receita.enum';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─────────────────────────────────────────────────────────────────────────────
// Listas de ingredientes para geração
// ─────────────────────────────────────────────────────────────────────────────

const LOTES: Array<{ label: string; ingredientes: string[] }> = [
  {
    label: 'Frango básico',
    ingredientes: ['frango', 'alho', 'cebola', 'tomate', 'azeite', 'sal', 'pimenta'],
  },
  {
    label: 'Carne e batata',
    ingredientes: ['carne moída', 'batata', 'cebola', 'alho', 'tomate', 'sal', 'óleo'],
  },
  {
    label: 'Ovos e laticínios',
    ingredientes: ['ovo', 'leite', 'manteiga', 'farinha de trigo', 'queijo', 'sal'],
  },
  {
    label: 'Peixe e frutos do mar',
    ingredientes: ['filé de peixe', 'limão', 'alho', 'azeite', 'cebola', 'coentro', 'sal'],
  },
  {
    label: 'Vegetariano',
    ingredientes: ['brócolis', 'cenoura', 'chuchu', 'cebola', 'alho', 'azeite', 'sal'],
  },
  {
    label: 'Massa e molho',
    ingredientes: ['macarrão', 'tomate', 'cebola', 'alho', 'azeite', 'manjericão', 'sal'],
  },
  {
    label: 'Feijão e grãos',
    ingredientes: ['feijão preto', 'linguiça', 'alho', 'cebola', 'louro', 'sal', 'óleo'],
  },
  {
    label: 'Café da manhã',
    ingredientes: ['banana', 'aveia', 'mel', 'leite', 'ovo', 'canela'],
  },
  {
    label: 'Sopas e caldos',
    ingredientes: ['abóbora', 'batata doce', 'cebola', 'alho', 'gengibre', 'leite de coco', 'sal'],
  },
  {
    label: 'Arroz temperado',
    ingredientes: ['arroz', 'milho', 'ervilha', 'cenoura', 'cebola', 'alho', 'sal'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function normalizarDificuldade(dificuldade: string): DificuldadeReceita {
  const mapa: Record<string, DificuldadeReceita> = {
    facil: DificuldadeReceita.FACIL,
    fácil: DificuldadeReceita.FACIL,
    easy: DificuldadeReceita.FACIL,
    medio: DificuldadeReceita.MEDIA,
    médio: DificuldadeReceita.MEDIA,
    medium: DificuldadeReceita.MEDIA,
    dificil: DificuldadeReceita.DIFICIL,
    difícil: DificuldadeReceita.DIFICIL,
    hard: DificuldadeReceita.DIFICIL,
  };
  return mapa[normalizar(dificuldade || 'medio')] ?? DificuldadeReceita.MEDIA;
}

function parseTempo(tempo: string): number {
  const match = tempo?.match(/(\d+)/);
  return match ? parseInt(match[1]) : 30;
}

function parseRendimento(rendimento: string): number {
  const match = rendimento?.match(/(\d+)/);
  return match ? parseInt(match[1]) : 2;
}

async function gerarComGemini(ingredientes: string[], quantidade: number): Promise<any[]> {
  const prompt = `Você é um chef experiente de culinária brasileira.

Dados estes ingredientes disponíveis: ${ingredientes.join(', ')}

Gere ${quantidade} receita${quantidade > 1 ? 's' : ''} criativa${quantidade > 1 ? 's' : ''} e prática${quantidade > 1 ? 's' : ''} que use${quantidade > 1 ? 'm' : ''} ALGUNS destes ingredientes.

IMPORTANTE: Retorne APENAS um JSON array válido, sem markdown, sem explicações adicionais.

Formato exato:
[
  {
    "titulo": "Nome da receita",
    "descricao": "Uma frase curta",
    "tempo_preparo": "20 minutos",
    "dificuldade": "fácil",
    "ingredientes": ["ingrediente 1", "ingrediente 2"],
    "modo_preparo": "Passo 1. ...\\nPasso 2. ...",
    "rendimento": "2 porções"
  }
]`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] },
    { timeout: 30000 },
  );

  let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch) text = jsonMatch[1];

  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [parsed];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const dataSource = new DataSource(dataSourceOptions);

  await dataSource.initialize();
  const repo = dataSource.getRepository(Receita);

  console.log(`\n🍳 Seed de receitas — ${LOTES.length} lotes\n`);

  let totalSalvas = 0;
  let totalPuladas = 0;

  for (const lote of LOTES) {
    process.stdout.write(`  [${lote.label}] gerando... `);

    try {
      const receitasIA = await gerarComGemini(lote.ingredientes, 3);

      for (const r of receitasIA) {
        const tituloNorm = normalizar(r.titulo || '');

        // Verifica duplicata
        const existente = await repo.findOne({ where: { nome: r.titulo } });
        if (existente) {
          totalPuladas++;
          continue;
        }

        const ingredientesChave = [...new Set(
          (r.ingredientes as string[]).map((i: string) => normalizar(i))
        )].sort();

        const nova = repo.create({
          nome: r.titulo,
          descricao: r.descricao,
          modo_preparo: r.modo_preparo,
          tempo_preparo: parseTempo(r.tempo_preparo),
          rendimento_porcoes: parseRendimento(r.rendimento),
          dificuldade: normalizarDificuldade(r.dificuldade),
          ingredientes_chave: ingredientesChave,
          origem: 'ia_gerada',
          status_moderacao: 'ok',
        });

        await repo.save(nova);
        totalSalvas++;
      }

      console.log(`✅ ${receitasIA.length} receitas`);
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
    }

    // Pequena pausa para não estourar rate limit da API
    await new Promise((r) => setTimeout(r, 1500));
  }

  const total = await repo.count({ where: { origem: 'ia_gerada' } });

  console.log(`\n✨ Concluído!`);
  console.log(`   Salvas:  ${totalSalvas}`);
  console.log(`   Puladas: ${totalPuladas} (já existiam)`);
  console.log(`   Total no banco: ${total} receitas ia_gerada\n`);

  await dataSource.destroy();
}

main().catch((err) => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
