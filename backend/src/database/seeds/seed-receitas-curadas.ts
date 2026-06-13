/**
 * Seed: Banco Curado de Receitas Brasileiras
 * Gera ~300 receitas do cotidiano BR via Gemini com metadados completos.
 * Uso: npx ts-node -r tsconfig-paths/register src/database/seeds/seed-receitas-curadas.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Receita } from '../../modules/receitas/entities/receita.entity';
import { DificuldadeReceita } from '../../common/enums/dificuldade-receita.enum';

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'cookme',
  password: process.env.DB_PASSWORD || 'cookme123',
  database: process.env.DB_DATABASE || 'cookme_db',
  entities: [Receita],
  synchronize: false,
});

// 50 pratos clássicos do cotidiano brasileiro
const PRATOS_CULINARIOS: Array<{ nome: string; categoria: string; tags?: string[] }> = [
  // Almoço — proteínas
  { nome: 'Frango assado com alho e limão', categoria: 'almoco' },
  { nome: 'Bife acebolado', categoria: 'almoco' },
  { nome: 'Frango grelhado com ervas', categoria: 'almoco', tags: ['fitness'] },
  { nome: 'Filé de peixe grelhado', categoria: 'almoco', tags: ['fitness'] },
  { nome: 'Carne assada na panela', categoria: 'almoco' },
  { nome: 'Frango à parmegiana', categoria: 'almoco' },
  { nome: 'Bife à milanesa', categoria: 'almoco' },
  { nome: 'Coxa e sobrecoxa assada', categoria: 'almoco' },
  { nome: 'Bisteca suína grelhada', categoria: 'almoco' },
  { nome: 'Almôndega ao molho de tomate', categoria: 'almoco' },
  { nome: 'Frango desfiado refogado', categoria: 'almoco' },
  { nome: 'Iscas de frango aceboladas', categoria: 'almoco', tags: ['fitness'] },

  // Almoço — pratos completos
  { nome: 'Arroz com feijão carioca', categoria: 'almoco' },
  { nome: 'Feijão preto temperado', categoria: 'almoco' },
  { nome: 'Feijoada completa', categoria: 'almoco' },
  { nome: 'Estrogonofe de frango', categoria: 'almoco' },
  { nome: 'Estrogonofe de carne', categoria: 'almoco' },
  { nome: 'Macarrão ao molho de tomate', categoria: 'almoco' },
  { nome: 'Macarrão com frango desfiado', categoria: 'almoco' },
  { nome: 'Lasanha de carne', categoria: 'almoco' },
  { nome: 'Risoto de frango', categoria: 'almoco' },
  { nome: 'Arroz com legumes', categoria: 'almoco', tags: ['vegetariano', 'fitness'] },
  { nome: 'Farofa de manteiga com bacon', categoria: 'almoco' },
  { nome: 'Purê de batata', categoria: 'almoco' },
  { nome: 'Batata frita crocante', categoria: 'almoco' },
  { nome: 'Macarrão ao alho e óleo', categoria: 'almoco', tags: ['vegetariano'] },

  // Almoço — legumes/verduras
  { nome: 'Abobrinha refogada com alho', categoria: 'almoco', tags: ['vegetariano', 'vegano', 'fitness'] },
  { nome: 'Brócolis no alho e óleo', categoria: 'almoco', tags: ['vegetariano', 'vegano', 'fitness'] },
  { nome: 'Cenoura refogada', categoria: 'almoco', tags: ['vegetariano', 'vegano', 'fitness'] },
  { nome: 'Salada de folhas com tomate', categoria: 'almoco', tags: ['vegetariano', 'vegano', 'fitness'] },
  { nome: 'Couve refogada com alho', categoria: 'almoco', tags: ['vegetariano', 'vegano', 'fitness'] },
  { nome: 'Quibe assado', categoria: 'almoco' },
  { nome: 'Moqueca de peixe', categoria: 'almoco' },
  { nome: 'Moqueca de camarão', categoria: 'almoco' },

  // Jantar — leve
  { nome: 'Sopa de legumes', categoria: 'jantar', tags: ['vegetariano', 'fitness'] },
  { nome: 'Sopa de frango com macarrão', categoria: 'jantar' },
  { nome: 'Caldo verde com linguiça', categoria: 'jantar' },
  { nome: 'Omelete de legumes', categoria: 'jantar', tags: ['vegetariano', 'fitness'] },
  { nome: 'Omelete de queijo e presunto', categoria: 'jantar' },
  { nome: 'Macarrão simples com queijo', categoria: 'jantar', tags: ['vegetariano'] },
  { nome: 'Torta de frango com requeijão', categoria: 'jantar' },
  { nome: 'Pão de queijo caseiro', categoria: 'jantar', tags: ['vegetariano'] },
  { nome: 'Frango com mandioca cozida', categoria: 'jantar' },
  { nome: 'Arroz de forno com frango', categoria: 'jantar' },

  // Fitness
  { nome: 'Frango grelhado com batata-doce', categoria: 'almoco', tags: ['fitness'] },
  { nome: 'Omelete proteica com claras', categoria: 'almoco', tags: ['fitness'] },
  { nome: 'Salada de grão de bico', categoria: 'almoco', tags: ['vegetariano', 'vegano', 'fitness'] },
  { nome: 'Arroz integral com legumes', categoria: 'almoco', tags: ['vegetariano', 'fitness'] },
  { nome: 'Peito de frango no vapor com brócolis', categoria: 'almoco', tags: ['fitness'] },
  { nome: 'Tilápia assada com limão', categoria: 'almoco', tags: ['fitness'] },
];

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function gerarReceitasLote(pratos: Array<{ nome: string; categoria: string; tags?: string[] }>): Promise<any[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_API_KEY não configurada');

  const lista = pratos.map((p, i) => `${i + 1}. ${p.nome} (${p.categoria})`).join('\n');

  const prompt = `Você é um chef brasileiro especialista em culinária do dia a dia.
Gere receitas COMPLETAS e PRÁTICAS para os pratos abaixo. Foco em receitas caseiras brasileiras reais, não sofisticadas.

PRATOS:
${lista}

Para CADA prato, retorne um objeto JSON com:
- titulo: nome exato do prato
- descricao: 1 frase descritiva
- categoria_receita: "almoco" ou "jantar" (conforme indicado)
- tempo_preparo: string como "30 minutos", "1 hora"
- dificuldade: "fácil", "médio" ou "difícil"
- rendimento: string como "4 porções", "6 pessoas"
- ingredientes: array de strings com quantidade + ingrediente (ex: "500g de frango", "2 dentes de alho", "sal a gosto")
- modo_preparo: string com passos numerados separados por \\n
- ingredientes_chave: array com os 3-6 ingredientes principais em minúsculo sem marca/quantidade (ex: ["frango", "alho", "limão"])
- tags_dieta: array vazio ou com valores de: "fitness", "vegetariano", "vegano"

IMPORTANTE:
- ingredientes_chave: apenas nomes culinários puros (ex: "frango", "cebola", "azeite", "tomate")
- Receitas realistas para cozinha doméstica brasileira
- Porções para família (4-6 pessoas)

Responda APENAS com JSON array válido, sem markdown:
[{...}, {...}]`;

  const response = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini erro: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Gemini não retornou JSON array');
  return JSON.parse(jsonMatch[0]);
}

function parseTempo(t: string): number {
  if (!t) return 30;
  const h = t.match(/(\d+)\s*hora/i);
  const m = t.match(/(\d+)\s*min/i);
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0) || 30;
}

function parseRendimento(r: string): number {
  const n = r?.match(/\d+/);
  return n ? Number(n[0]) : 4;
}

function normalizarDificuldade(d: string): DificuldadeReceita {
  const mapa: Record<string, DificuldadeReceita> = {
    'fácil': DificuldadeReceita.FACIL,
    'facil': DificuldadeReceita.FACIL,
    'médio': DificuldadeReceita.MEDIA,
    'medio': DificuldadeReceita.MEDIA,
    'difícil': DificuldadeReceita.DIFICIL,
    'dificil': DificuldadeReceita.DIFICIL,
  };
  return mapa[d?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')] ?? DificuldadeReceita.MEDIA;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('🍳 Iniciando seed de receitas curadas brasileiras...');
  await ds.initialize();
  const repo = ds.getRepository(Receita);

  const LOTE = 5;
  let totalSalvas = 0;
  let totalPuladas = 0;

  for (let i = 0; i < PRATOS_CULINARIOS.length; i += LOTE) {
    const lote = PRATOS_CULINARIOS.slice(i, i + LOTE);
    console.log(`\n📦 Lote ${Math.floor(i / LOTE) + 1}/${Math.ceil(PRATOS_CULINARIOS.length / LOTE)}: ${lote.map(p => p.nome).join(', ')}`);

    try {
      const geradas = await gerarReceitasLote(lote);

      for (const receita of geradas) {
        try {
          // Verifica duplicata
          const existente = await repo.findOne({ where: { nome: receita.titulo } });
          if (existente) {
            console.log(`  ⏭  Já existe: "${receita.titulo}"`);
            totalPuladas++;
            continue;
          }

          // Busca metadados do prato original para categoria e tags
          const pratoCfg = lote.find(p => p.nome.toLowerCase() === receita.titulo?.toLowerCase())
            || lote.find(p => receita.titulo?.toLowerCase().includes(p.nome.toLowerCase().split(' ')[0]))
            || lote[0];

          const tags: string[] = receita.tags_dieta || pratoCfg.tags || [];

          const nova = repo.create({
            nome: receita.titulo,
            descricao: receita.descricao,
            modo_preparo: typeof receita.modo_preparo === 'string'
              ? receita.modo_preparo
              : JSON.stringify(receita.modo_preparo),
            tempo_preparo: parseTempo(receita.tempo_preparo),
            rendimento_porcoes: parseRendimento(receita.rendimento),
            dificuldade: normalizarDificuldade(receita.dificuldade),
            ingredientes_chave: receita.ingredientes_chave || [],
            categoria_receita: receita.categoria_receita || pratoCfg.categoria,
            tags_dieta: tags,
            origem: 'ia_gerada',
            status_moderacao: 'ok',
            vezes_executada: 0,
          } as any);

          await repo.save(nova as any);
          console.log(`  ✅ Salva: "${receita.titulo}" [${receita.categoria_receita}] chaves: ${(receita.ingredientes_chave || []).join(', ')}`);
          totalSalvas++;
        } catch (err: any) {
          console.error(`  ❌ Erro ao salvar "${receita.titulo}": ${err.message}`);
        }
      }
    } catch (err: any) {
      console.error(`❌ Erro no lote: ${err.message}`);
    }

    // Pausa entre lotes para não sobrecarregar Gemini
    if (i + LOTE < PRATOS_CULINARIOS.length) {
      console.log('  ⏳ Aguardando 3s...');
      await sleep(3000);
    }
  }

  console.log(`\n🏁 Seed concluído: ${totalSalvas} salvas, ${totalPuladas} já existiam`);
  await ds.destroy();
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
