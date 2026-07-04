/**
 * Popula banco com receitas geradas a partir de combinações de ingredientes do inventário.
 * Usa Groq (Llama 3.3 70B) — gratuito, sem dependência de Haiku/Gemini.
 * Conecta direto no PostgreSQL — não requer backend rodando.
 *
 * Run:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-receitas-inventario.ts
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import Groq from 'groq-sdk';

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'cookme',
  password: process.env.DB_PASSWORD || 'cookme123',
  database: process.env.DB_DATABASE || 'cookme_db',
};

// Grupos de ingredientes → cada grupo gera 3-5 receitas temáticas
const GRUPOS: { nome: string; ingredientes: string[]; categoria: string; tags_dieta: string[] }[] = [
  // Doces / Sobremesas
  {
    nome: 'Canjica e Doces de Leite',
    ingredientes: ['canjica', 'leite integral', 'leite condensado integral', 'creme de leite', 'açúcar refinado', 'canela'],
    categoria: 'sobremesa',
    tags_dieta: [],
  },
  {
    nome: 'Bolo e Lanche Doce',
    ingredientes: ['mistura para bolo', 'ovos', 'leite integral', 'óleo de soja', 'manteiga com sal', 'açúcar refinado'],
    categoria: 'lanche',
    tags_dieta: [],
  },
  {
    nome: 'Doces com Leite Condensado',
    ingredientes: ['leite condensado integral', 'creme de leite', 'ovos', 'manteiga com sal', 'açúcar demerara'],
    categoria: 'sobremesa',
    tags_dieta: [],
  },
  {
    nome: 'Mel e Amendoim',
    ingredientes: ['mel', 'amendoim', 'açúcar demerara', 'manteiga com sal', 'ovos', 'farinha de trigo'],
    categoria: 'lanche',
    tags_dieta: [],
  },
  // Massas e carboidratos
  {
    nome: 'Macarrão Cremoso',
    ingredientes: ['macarrão espaguete', 'macarrão parafuso', 'creme de leite', 'passata de tomate', 'alho', 'cebola', 'manteiga com sal', 'ovos'],
    categoria: 'almoco',
    tags_dieta: [],
  },
  {
    nome: 'Pão e Massa Caseira',
    ingredientes: ['farinha de trigo', 'ovos', 'leite integral', 'manteiga com sal', 'óleo de soja', 'açúcar refinado'],
    categoria: 'cafe-manha',
    tags_dieta: [],
  },
  {
    nome: 'Arroz Temperado',
    ingredientes: ['arroz', 'alho', 'cebola', 'azeite de oliva extra virgem', 'tomate', 'ovos', 'farofa de mandioca'],
    categoria: 'almoco',
    tags_dieta: [],
  },
  // Proteínas
  {
    nome: 'Frango com Molho',
    ingredientes: ['frango peito', 'passata de tomate', 'creme de leite', 'alho', 'cebola', 'azeite de oliva extra virgem', 'limão taiti', 'tomate'],
    categoria: 'almoco',
    tags_dieta: [],
  },
  {
    nome: 'Frango Assado e Frito',
    ingredientes: ['frango coxinha da asa', 'alho', 'limão taiti', 'azeite de oliva extra virgem', 'cebola', 'farinha de trigo', 'ovos'],
    categoria: 'almoco',
    tags_dieta: [],
  },
  {
    nome: 'Feijão Carioca',
    ingredientes: ['feijão carioca', 'alho', 'cebola', 'óleo de soja', 'tomate', 'arroz', 'azeite de oliva extra virgem'],
    categoria: 'almoco',
    tags_dieta: [],
  },
  {
    nome: 'Ovos Variados',
    ingredientes: ['ovos', 'manteiga com sal', 'leite integral', 'cebola', 'tomate', 'azeite de oliva extra virgem', 'alho'],
    categoria: 'cafe-manha',
    tags_dieta: [],
  },
  // Milho e legumes
  {
    nome: 'Milho e Derivados',
    ingredientes: ['milho verde em conserva', 'farinha de trigo', 'ovos', 'leite integral', 'manteiga com sal', 'óleo de soja', 'açúcar refinado'],
    categoria: 'lanche',
    tags_dieta: [],
  },
  {
    nome: 'Abobrinha e Legumes',
    ingredientes: ['abobrinha', 'cebola', 'alho', 'tomate', 'ovos', 'azeite de oliva extra virgem', 'passata de tomate'],
    categoria: 'almoco',
    tags_dieta: ['vegetariano'],
  },
  // Molhos e acompanhamentos
  {
    nome: 'Farofa e Acompanhamentos',
    ingredientes: ['farofa de mandioca', 'manteiga com sal', 'cebola', 'alho', 'ovos', 'tomate', 'batata palha'],
    categoria: 'almoco',
    tags_dieta: [],
  },
  {
    nome: 'Molhos e Temperos',
    ingredientes: ['passata de tomate', 'tomate', 'alho', 'cebola', 'azeite de oliva extra virgem', 'mostarda', 'ketchup'],
    categoria: 'almoco',
    tags_dieta: ['vegetariano'],
  },
  // Carnes bovinas (novos ingredientes do inventário)
  {
    nome: 'Acém Bovino',
    ingredientes: ['acém bovino', 'cebola', 'alho', 'tomate', 'passata de tomate', 'azeite de oliva extra virgem', 'batata'],
    categoria: 'almoco',
    tags_dieta: [],
  },
  {
    nome: 'Coxão Mole',
    ingredientes: ['coxão mole', 'cebola', 'alho', 'tomate', 'limão taiti', 'azeite de oliva extra virgem', 'mostarda'],
    categoria: 'almoco',
    tags_dieta: [],
  },
  {
    nome: 'Carne Bovina com Molho',
    ingredientes: ['coxão mole', 'acém bovino', 'passata de tomate', 'cebola', 'alho', 'azeite de oliva extra virgem', 'manteiga com sal'],
    categoria: 'almoco',
    tags_dieta: [],
  },
];

const PROMPT_SYSTEM = `Você é um chef brasileiro apaixonado por culinária regional. Especialista em transformar ingredientes simples em pratos memoráveis.

REGRAS ABSOLUTAS:
- Títulos SEMPRE específicos e apetitosos. PROIBIDO: "Arroz com Frango", "Bolo Simples", "Macarrão ao Molho". OBRIGATÓRIO: especificar o preparo, toque especial, textura ou aroma. Ex: "Canjica Cremosa de Panela com Leite Condensado e Canela em Pau"
- Descrições DESPERTAM FOME: mencionar textura, aroma, sabor
- Modo de preparo com TÉCNICAS reais: temperatura, tempo preciso, ponto visual, dicas de chef
- Retornar APENAS JSON puro, sem markdown, sem texto extra`;

function buildPrompt(grupo: typeof GRUPOS[0]): string {
  return `INGREDIENTES DISPONÍVEIS: ${grupo.ingredientes.join(', ')}

Tema: ${grupo.nome} | Categoria sugerida: ${grupo.categoria}

EXEMPLOS do padrão esperado (não reutilize estes, inspire-se):
- "Canjica Cremosa de Panela com Leite Condensado e Canela em Pau" / "Grãos macios banhados em creme aveludado, perfumado com canela e cravo"
- "Frango Selado ao Molho Rústico de Passata com Alho Confitado" / "Crosta dourada por fora, suculento por dentro, molho encorpado reduzido lentamente"

Crie 4 receitas DIFERENTES entre si, cada uma com combinação/técnica diferente. Mínimo 5 passos por receita.

Retorne APENAS JSON {"receitas": [...]} com exatamente 4 receitas:
[
  {
    "titulo": "Título Específico e Apetitoso",
    "descricao": "Uma frase que desperta fome — textura, sabor ou aroma",
    "ingredientes": ["2 xícaras de canjica branca lavada e de molho 8h", "1 lata de leite condensado gelado"],
    "modo_preparo": "Passo 1. De véspera, deixe a canjica de molho em água fria por pelo menos 8 horas — isso acelera o cozimento e deixa os grãos macios por igual.\nPasso 2. ...",
    "tempo_preparo": "45 minutos",
    "dificuldade": "fácil",
    "rendimento": "6 porções",
    "tags_dieta": []
  }
]`;
}

function extrairChavesSimples(ingredientes: string[]): string[] {
  const stopwords = new Set(['de', 'do', 'da', 'com', 'ao', 'à', 'em', 'no', 'na', 'e', 'ou', 'para', 'por', 'um', 'uma', 'xícara', 'colher', 'copo', 'gramas', 'kg', 'ml', 'l', 'g']);
  const chaves = new Set<string>();
  for (const ing of ingredientes) {
    const normalized = ing
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\d+[.,]?\d*\s*(g|kg|ml|l|xic|xíc|col|cop|un|unid|fatia|fatias|dente|dentes|folha|folhas|pitada|pitadas)\.?\s*/gi, '')
      .replace(/^\d+\/?\d*\s+/, '')
      .replace(/,.*$/, '')
      .trim();

    // Remove palavras de preparo
    const semPreparo = normalized
      .replace(/\b(picad[ao]s?|amassad[ao]s?|ralad[ao]s?|cozid[ao]s?|frit[ao]s?|assad[ao]s?|batid[ao]s?|cortad[ao]s?|moid[ao]s?|desfiado|peneirad[ao]s?|liquidificad[ao]s?|bem|levemente|finamente|grosseiramente|sem|pele|casca|osso|semente)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Trunca em 4 palavras
    const palavras = semPreparo.split(' ').filter(w => w.length > 1 && !stopwords.has(w));
    if (palavras.length === 0) continue;
    const chave = palavras.slice(0, 3).join(' ').trim();
    if (chave.length >= 2 && !/^\d/.test(chave)) {
      chaves.add(chave);
    }
  }
  return [...chaves].slice(0, 8);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.error('GROQ_API_KEY não encontrada no .env');
    process.exit(1);
  }

  const groq = new Groq({ apiKey: groqKey });

  const ds = new DataSource({
    type: 'postgres',
    ...DB,
    synchronize: false,
    logging: false,
    entities: [],
  });

  await ds.initialize();
  console.log('✅ Conectado ao banco');

  let totalGeradas = 0;
  let totalSalvas = 0;
  let totalDuplicadas = 0;

  for (const grupo of GRUPOS) {
    console.log(`\n📦 Grupo: ${grupo.nome}`);

    let receitas: any[] = [];
    let tentativas = 0;

    while (receitas.length === 0 && tentativas < 3) {
      tentativas++;
      try {
        const resp = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 3000,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: PROMPT_SYSTEM },
            { role: 'user', content: buildPrompt(grupo) + '\n\nIMPORTANTE: responda com JSON {"receitas": [...array com 4 receitas...]}' },
          ],
        });
        const raw = resp.choices[0]?.message?.content ?? '{}';
        const parsed = JSON.parse(raw);
        receitas = Array.isArray(parsed) ? parsed : (parsed.receitas ?? []);
        console.log(`  Groq retornou ${receitas.length} receitas`);
      } catch (err: any) {
        console.warn(`  Tentativa ${tentativas} falhou: ${err.message}`);
        await delay(3000);
      }
    }

    totalGeradas += receitas.length;

    for (const r of receitas) {
      if (!r.titulo || !r.ingredientes || !r.modo_preparo) {
        console.log(`  ⚠️  Receita incompleta: ${r.titulo ?? '(sem título)'}`);
        continue;
      }

      // Verificar duplicata por título
      const existe = await ds.query(
        `SELECT id FROM receitas WHERE LOWER(nome) = LOWER($1) LIMIT 1`,
        [r.titulo]
      );
      if (existe.length > 0) {
        console.log(`  ⏭️  Duplicada: ${r.titulo}`);
        totalDuplicadas++;
        continue;
      }

      // Validação determinística simples
      if (r.ingredientes.length < 2) {
        console.log(`  ⚠️  Poucos ingredientes: ${r.titulo}`);
        continue;
      }
      if ((r.modo_preparo ?? '').length < 50) {
        console.log(`  ⚠️  Preparo muito curto: ${r.titulo}`);
        continue;
      }

      const chaves = extrairChavesSimples(r.ingredientes);
      const tagsValidas = Array.isArray(r.tags_dieta)
        ? r.tags_dieta.filter((t: string) => ['vegetariano', 'vegano', 'fitness'].includes(t))
        : grupo.tags_dieta;

      // Score heurístico sem IA: receitas com ≥4 chaves e preparo bem descrito = 75
      const score = chaves.length >= 3 && r.modo_preparo.length >= 100 ? 75 : 65;
      const status = score >= 70 ? 'ok' : 'em_revisao';

      const dificuldade = (() => {
        const d = (r.dificuldade ?? 'fácil').toLowerCase();
        if (d.includes('f') || d.includes('easy')) return 'facil';
        if (d.includes('d') || d.includes('hard')) return 'dificil';
        return 'medio';
      })();

      // Extrair número de porções de strings como "4 porções"
      const porcoes = parseInt((r.rendimento ?? '4').replace(/\D/g, '')) || 4;

      // Extrair minutos de "30 minutos", "1 hora", etc.
      const tempoStr = (r.tempo_preparo ?? '30 minutos').toLowerCase();
      let tempoMin = parseInt(tempoStr.replace(/\D/g, '')) || 30;
      if (tempoStr.includes('hora')) tempoMin = tempoMin * 60;

      // Ingredientes do Groq formatados como modo_preparo prefixado (a entidade não tem coluna ingredientes)
      // O modo_preparo concatena a lista de ingredientes + passos
      const modoComIngredientes = `INGREDIENTES:\n${(r.ingredientes as string[]).map((i: string) => `• ${i}`).join('\n')}\n\nMODO DE PREPARO:\n${r.modo_preparo}`;

      // tags_dieta é simple-array (CSV) no banco
      const tagsCsv = tagsValidas.join(',');

      try {
        await ds.query(`
          INSERT INTO receitas (
            nome, descricao, modo_preparo, tempo_preparo,
            dificuldade, rendimento_porcoes, imagem_url, ingredientes_chave,
            status_moderacao, validation_score, validation_issues,
            tags_dieta, categoria_receita, origem, url_fonte, autor_id,
            avaliacao_media, vezes_executada, criado_em, atualizado_em
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())
        `, [
          r.titulo,
          r.descricao ?? '',
          modoComIngredientes,
          tempoMin,
          dificuldade,
          porcoes,
          null,
          `{${chaves.map(c => `"${c.replace(/"/g, '\\"')}"`).join(',')}}`,
          status,
          score,
          'groq_seed',
          tagsCsv || null,
          grupo.categoria,
          'ia_gerada',
          null,
          null,
          0,
          0,
        ]);
        console.log(`  ✅ ${status === 'ok' ? '✓' : '~'} ${r.titulo} (score ${score}, ${chaves.length} chaves)`);
        totalSalvas++;
      } catch (err: any) {
        console.error(`  ❌ Erro ao salvar "${r.titulo}": ${err.message}`);
      }
    }

    // Delay entre grupos para não sobrecarregar Groq
    await delay(2000);
  }

  await ds.destroy();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total geradas: ${totalGeradas}`);
  console.log(`Salvas:        ${totalSalvas}`);
  console.log(`Duplicadas:    ${totalDuplicadas}`);
  console.log(`Falhas:        ${totalGeradas - totalSalvas - totalDuplicadas}`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
