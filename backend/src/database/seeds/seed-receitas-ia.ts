/**
 * Popula banco com receitas originais geradas pelo Gemini.
 * Não requer backend rodando — conecta direto no PostgreSQL.
 *
 * Run:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-receitas-ia.ts
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-receitas-ia.ts --limpar
 *
 * Flags:
 *   --limpar   Apaga receitas com origem='internet' antes de gerar
 *   --modo normal|fitness|vegetariano|vegano   Gera apenas esse modo
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROGRESS_FILE = path.join(__dirname, '.seed-progress.json');

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'cookme',
  password: process.env.DB_PASSWORD || 'cookme123',
  database: process.env.DB_DATABASE || 'cookme_db',
};

const UNSPLASH_KEY = process.env.UNSPLASH_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const DELAY_MS = 5000; // delay entre chamadas Gemini (evita 429)
const MODELOS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];

// Temas para geração — (modo, categoria, tema_principal)
const TEMAS: Array<{
  modo: 'normal' | 'fitness' | 'vegetariano' | 'vegano';
  categoria: string;
  tema: string;
  tags_dieta: string[];
}> = [
  // NORMAL — almoços e jantares brasileiros tradicionais
  { modo: 'normal', categoria: 'almoco', tema: 'frango assado com batatas e alho', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'peixe grelhado com legumes', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'carne moída ao molho com arroz', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'macarrão ao alho e óleo com camarão', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'feijão tropeiro mineiro', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'frango à parmegiana', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'moqueca de peixe baiana', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'coxinha de frango caseira', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'omelete de queijo e presunto', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'sopa de legumes com frango', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'pizza caseira de mussarela', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'macarrão com molho bolonhesa', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'hamburguer artesanal caseiro', tags_dieta: [] },
  { modo: 'normal', categoria: 'cafe-manha', tema: 'tapioca de queijo e presunto', tags_dieta: [] },
  { modo: 'normal', categoria: 'cafe-manha', tema: 'panqueca americana com mel', tags_dieta: [] },
  { modo: 'normal', categoria: 'cafe-manha', tema: 'pão de queijo mineiro', tags_dieta: [] },
  { modo: 'normal', categoria: 'lanche', tema: 'sanduíche natural de atum', tags_dieta: [] },
  { modo: 'normal', categoria: 'lanche', tema: 'batata frita crocante ao forno', tags_dieta: [] },
  { modo: 'normal', categoria: 'sobremesa', tema: 'pudim de leite condensado', tags_dieta: [] },
  { modo: 'normal', categoria: 'sobremesa', tema: 'brigadeiro gourmet de chocolate', tags_dieta: [] },
  { modo: 'normal', categoria: 'sobremesa', tema: 'bolo de cenoura com cobertura de chocolate', tags_dieta: [] },

  // FITNESS — proteína alta, carboidrato controlado
  { modo: 'fitness', categoria: 'almoco', tema: 'frango grelhado com quinoa e brócolis', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'almoco', tema: 'salada de atum com ovos e folhas verdes', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'almoco', tema: 'filé de tilápia assado com aspargos', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'almoco', tema: 'peito de frango recheado com espinafre', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'almoco', tema: 'arroz integral com frango desfiado', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'almoco', tema: 'bowl de proteína com grão-de-bico e legumes', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'jantar', tema: 'omelete proteico com claras e vegetais', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'jantar', tema: 'wrap de frango grelhado com homus', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'cafe-manha', tema: 'vitamina proteica de banana com aveia', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'cafe-manha', tema: 'overnight oats com frutas vermelhas', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'lanche', tema: 'bolinho proteico de atum e aveia', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'lanche', tema: 'palitinhos de cenoura com pasta de amendoim', tags_dieta: ['fitness'] },

  // VEGETARIANO — sem carne, com ovos e laticínios
  { modo: 'vegetariano', categoria: 'almoco', tema: 'risoto de funghi com parmesão', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'almoco', tema: 'lasanha de berinjela com molho de tomate', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'almoco', tema: 'quiche de espinafre e queijo', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'almoco', tema: 'macarrão com pesto de manjericão', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'almoco', tema: 'strogonoff de cogumelos', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'almoco', tema: 'curry de grão-de-bico com leite de coco', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'jantar', tema: 'pizza de vegetais grelhados', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'jantar', tema: 'sopa cremosa de abóbora com gengibre', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'cafe-manha', tema: 'panqueca de banana sem farinha', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'lanche', tema: 'bolinho de espinafre com queijo assado', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'sobremesa', tema: 'mousse de chocolate com aquafaba', tags_dieta: ['vegetariano'] },

  // VEGANO — sem nenhum produto animal
  { modo: 'vegano', categoria: 'almoco', tema: 'feijoada vegana com jackfruit', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'almoco', tema: 'hamburguer de lentilha com cebola caramelizada', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'almoco', tema: 'arroz árabe vegano com grão-de-bico', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'almoco', tema: 'bowl de tofu grelhado com arroz e legumes', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'almoco', tema: 'espaguete ao molho de castanha de caju', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'jantar', tema: 'sopa de lentilha vermelha com especiarias', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'jantar', tema: 'wraps de feijão preto com guacamole', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'cafe-manha', tema: 'smoothie bowl de açaí com granola', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'lanche', tema: 'chips de grão-de-bico assado temperado', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'sobremesa', tema: 'brownie vegano de feijão preto', tags_dieta: ['vegano', 'vegetariano'] },

  // NORMAL — clássicos do dia a dia brasileiro (volume)
  { modo: 'normal', categoria: 'almoco', tema: 'arroz branco soltinho', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'feijão carioca temperado', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'frango grelhado com limão e alho', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'bife acebolado ao molho', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'farofa de manteiga com ovo', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'purê de batata cremoso', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'frango xadrez com pimentão', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'arroz com pequi mineiro', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'linguiça acebolada com mandioca', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'frango caipira com quiabo', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'rabada com agrião', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'carne de panela com batata', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'estrogonofe de frango com arroz', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'macarrão com queijo e presunto', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'peixe assado com ervas e limão', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'costelinha de porco ao forno com mel', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'caldo de feijão com linguiça', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'arroz de forno gratinado', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'frango desfiado com catupiry', tags_dieta: [] },
  { modo: 'normal', categoria: 'almoco', tema: 'dobradinha com feijão branco', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'macarrão alho e óleo simples', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'ovo mexido cremoso com cebolinha', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'sopa de macarrão com legumes', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'sanduíche quente de queijo e presunto', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'caldo verde com linguiça', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'frango empanado crocante frito', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'tapioca recheada de frango e cream cheese', tags_dieta: [] },
  { modo: 'normal', categoria: 'jantar', tema: 'sopa de abóbora com creme', tags_dieta: [] },
  { modo: 'normal', categoria: 'cafe-manha', tema: 'bolo de fubá cremoso', tags_dieta: [] },
  { modo: 'normal', categoria: 'cafe-manha', tema: 'vitamina de banana com aveia', tags_dieta: [] },
  { modo: 'normal', categoria: 'cafe-manha', tema: 'cuscuz nordestino com manteiga', tags_dieta: [] },
  { modo: 'normal', categoria: 'cafe-manha', tema: 'mingau de aveia com mel', tags_dieta: [] },
  { modo: 'normal', categoria: 'sobremesa', tema: 'mousse de maracujá simples', tags_dieta: [] },
  { modo: 'normal', categoria: 'sobremesa', tema: 'arroz doce cremoso', tags_dieta: [] },
  { modo: 'normal', categoria: 'sobremesa', tema: 'quindim de coco', tags_dieta: [] },
  { modo: 'normal', categoria: 'sobremesa', tema: 'bolo de laranja com calda', tags_dieta: [] },
  { modo: 'normal', categoria: 'sobremesa', tema: 'cocada branca cremosa', tags_dieta: [] },

  // FITNESS — variedade adicional
  { modo: 'fitness', categoria: 'almoco', tema: 'patinho moído com couve-flor', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'almoco', tema: 'salmão grelhado com azeite e limão', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'almoco', tema: 'frango ao molho de iogurte com pepino', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'almoco', tema: 'atum com batata-doce e brócolis', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'jantar', tema: 'frango cozido com legumes no vapor', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'jantar', tema: 'sopa proteica de frango com cenoura', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'cafe-manha', tema: 'omelete de claras com tomate e orégano', tags_dieta: ['fitness'] },
  { modo: 'fitness', categoria: 'lanche', tema: 'iogurte grego com granola e mel', tags_dieta: ['fitness'] },

  // VEGETARIANO — variedade adicional
  { modo: 'vegetariano', categoria: 'almoco', tema: 'escondidinho de batata-doce com queijo', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'almoco', tema: 'nhoque de batata com molho de tomate', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'almoco', tema: 'tortilha espanhola de batata e ovo', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'almoco', tema: 'creme de milho com queijo', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'jantar', tema: 'sopa de cebola gratinada', tags_dieta: ['vegetariano'] },
  { modo: 'vegetariano', categoria: 'lanche', tema: 'crepe de banana com mel e canela', tags_dieta: ['vegetariano'] },

  // VEGANO — variedade adicional
  { modo: 'vegano', categoria: 'almoco', tema: 'vatapá vegano de amendoim', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'almoco', tema: 'bobó de inhame com dendê', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'jantar', tema: 'ratatouille de legumes ao forno', tags_dieta: ['vegano', 'vegetariano'] },
  { modo: 'vegano', categoria: 'cafe-manha', tema: 'vitamina de abacate com leite vegetal', tags_dieta: ['vegano', 'vegetariano'] },
];

function extrairRetryDelay(err: any): number {
  const msg = String(err?.message || '');
  const match = msg.match(/Please retry in (\d+(?:\.\d+)?)s/);
  return match ? Math.ceil(parseFloat(match[1])) * 1000 : 0;
}

function isQuotaDiaria(err: any): boolean {
  const msg = String(err?.message || err?.toString() || '').toLowerCase();
  return (
    msg.includes('resource_exhausted') ||
    msg.includes('quota exceeded') ||
    msg.includes('daily limit') ||
    msg.includes('rate limit exceeded') ||
    (msg.includes('429') && !msg.includes('retry in'))
  );
}

function carregarProgresso(): Set<string> {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      return new Set<string>(data.concluidos || []);
    }
  } catch {}
  return new Set<string>();
}

function salvarProgresso(concluidos: Set<string>): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ concluidos: Array.from(concluidos), atualizadoEm: new Date().toISOString() }, null, 2));
}

function limparProgresso(): void {
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
}

async function gerarReceitaGemini(
  genAI: GoogleGenerativeAI,
  tema: string,
  modo: string,
  categoria: string,
): Promise<any> {
  const prompt = `Crie uma receita brasileira original de "${tema}" para refeição ${modo} (${categoria}).

Retorne APENAS um JSON válido:
{
  "nome": "Nome criativo da receita",
  "descricao": "Descrição apetitosa em 2-3 frases",
  "modo_preparo": "Passo 1: ...\\nPasso 2: ...\\nPasso 3: ...",
  "tempo_preparo": 30,
  "rendimento_porcoes": 4,
  "dificuldade": "facil",
  "ingredientes": [
    {"nome": "Frango", "quantidade": 500, "unidade": "g", "observacao": "sem pele"},
    {"nome": "Sal", "quantidade": null, "unidade": "a_gosto", "observacao": null}
  ]
}

REGRAS:
- dificuldade: APENAS "facil", "media" ou "dificil"
- unidade: APENAS "kg","g","mg","l","ml","col_sopa","col_cha","xicara_cha","un","pct","dente","folha","ramo","pitada","fio","a_gosto"
- Se quantidade for imprecisa use unidade "a_gosto" e quantidade null
- Mínimo 5 ingredientes, máximo 15
- modo_preparo: mínimo 4 passos detalhados, use \\n para separar
- Nome deve ser específico e apetitoso (não genérico)`;

  let lastErr: any;

  for (const modelName of MODELOS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Gemini não retornou JSON válido');
      return JSON.parse(match[0]);
    } catch (err: any) {
      lastErr = err;
      const retryMs = extrairRetryDelay(err);
      const is429 = String(err?.message || '').includes('429');

      if (is429 && retryMs > 0 && retryMs < 120000) {
        // Cota por minuto esgotada — aguarda e tenta de novo no mesmo modelo
        process.stdout.write(` [aguardando ${Math.round(retryMs / 1000)}s]`);
        await new Promise(r => setTimeout(r, retryMs + 1000));
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const match = text.match(/\{[\s\S]*\}/);
          if (!match) throw new Error('JSON inválido');
          return JSON.parse(match[0]);
        } catch (err2: any) {
          lastErr = err2;
        }
      }

      // Cota diária esgotada neste modelo — tenta o próximo
      if (is429 && retryMs >= 120000) {
        process.stdout.write(` [${modelName} sem cota, tentando próximo]`);
        continue;
      }
    }
  }

  throw lastErr;
}

async function buscarImagem(titulo: string): Promise<string | undefined> {
  if (!UNSPLASH_KEY) return undefined;
  const queries = [`${titulo} food`, titulo, 'comida caseira brasileira'];
  for (const query of queries) {
    try {
      const res = await axios.get('https://api.unsplash.com/search/photos', {
        params: { query, per_page: 3, orientation: 'landscape' },
        headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
        timeout: 8000,
      });
      const results = res.data?.results;
      if (results?.length > 0) return results[0].urls?.regular;
    } catch {}
  }
  const placeholders = [
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1504674900967-60f4a61f5a6e?w=800&h=600&fit=crop',
  ];
  return placeholders[Math.floor(Math.random() * placeholders.length)];
}

function normalizarChave(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

async function salvarReceita(ds: DataSource, receita: any, tema: any): Promise<void> {
  const imagem_url = await buscarImagem(receita.nome);

  const ingredientesChave = (receita.ingredientes || []).map((i: any) => normalizarChave(i.nome));

  const result = await ds.query(
    `INSERT INTO receitas (
      nome, descricao, modo_preparo, tempo_preparo, rendimento_porcoes,
      dificuldade, tags_dieta, tags_preparo, categoria_receita, imagem_url,
      ingredientes_chave, origem, prompt_ia, status_moderacao,
      validation_score, validation_issues,
      avaliacao_media, vezes_executada, denuncias
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,0,0,0
    ) RETURNING id`,
    [
      receita.nome,
      receita.descricao || '',
      receita.modo_preparo,
      receita.tempo_preparo || 30,
      receita.rendimento_porcoes || 4,
      receita.dificuldade || 'facil',
      tema.tags_dieta.join(','),
      '',
      tema.categoria,
      imagem_url || null,
      ingredientesChave,
      'ia_gerada',
      `Tema: ${tema.tema} | Modo: ${tema.modo}`,
      'ok',
      100,
      null,
    ],
  );

  const receitaId = result[0].id;

  for (let i = 0; i < (receita.ingredientes || []).length; i++) {
    const ing = receita.ingredientes[i];

    let produtoId: string | null = null;
    const prod = await ds.query(
      `SELECT id FROM produtos WHERE LOWER(nome) = LOWER($1) LIMIT 1`,
      [ing.nome],
    );
    if (prod.length > 0) {
      produtoId = prod[0].id;
    } else {
      const newProd = await ds.query(
        `INSERT INTO produtos (nome, origem) VALUES ($1, 'ia_gerada') RETURNING id`,
        [ing.nome],
      );
      produtoId = newProd[0].id;
    }

    const unidade = ing.unidade === 'a_gosto' ? 'a_gosto' : ing.unidade;
    const quantidade = ing.quantidade ?? null;

    await ds.query(
      `INSERT INTO receita_ingredientes (
        receita_id, produto_id, quantidade, unidade, a_gosto, observacao, ordem
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        receitaId,
        produtoId,
        quantidade,
        unidade,
        ing.unidade === 'a_gosto' || ing.quantidade === null,
        ing.observacao || null,
        i + 1,
      ],
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limpar = args.includes('--limpar');
  const modoFiltro = args.find(a => ['normal', 'fitness', 'vegetariano', 'vegano'].includes(a));

  if (!GEMINI_KEY) {
    console.error('❌ GEMINI_API_KEY não configurada no .env');
    process.exit(1);
  }

  console.log('\n🍽️  CookMe — Geração de Receitas via IA\n');

  const ds = new DataSource({
    type: 'postgres',
    host: DB.host,
    port: DB.port,
    username: DB.username,
    password: DB.password,
    database: DB.database,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  console.log('✓ Banco conectado\n');

  if (limpar) {
    const countResult = await ds.query(`SELECT COUNT(*) as total FROM receitas WHERE origem = 'internet'`);
    const total = parseInt(countResult[0]?.total || '0');
    await ds.query(`DELETE FROM receitas WHERE origem = 'internet'`);
    console.log(`🗑️  ${total} receitas de scraping removidas\n`);
  }

  const genAI = new GoogleGenerativeAI(GEMINI_KEY);

  const concluidos = carregarProgresso();
  if (limpar) limparProgresso();

  const temasFiltrados = modoFiltro
    ? TEMAS.filter(t => t.modo === modoFiltro)
    : TEMAS;

  const temas = temasFiltrados.filter(t => !concluidos.has(t.tema));
  const jaFeitos = temasFiltrados.length - temas.length;

  if (jaFeitos > 0) console.log(`⏩ ${jaFeitos} receitas já geradas anteriormente — continuando do ponto parado\n`);
  console.log(`📋 ${temas.length} receitas restantes para gerar\n`);

  if (temas.length === 0) {
    console.log('✅ Todas as receitas já foram geradas!');
    limparProgresso();
    await ds.destroy();
    return;
  }

  let geradas = 0;
  let erros = 0;

  for (let i = 0; i < temas.length; i++) {
    const tema = temas[i];
    const icone = { normal: '🍽️', fitness: '🏋️', vegetariano: '🥗', vegano: '🌱' }[tema.modo] ?? '🍴';
    process.stdout.write(`${icone} [${i + 1}/${temas.length}] "${tema.tema}"... `);

    try {
      const receita = await gerarReceitaGemini(genAI, tema.tema, tema.modo, tema.categoria);
      await salvarReceita(ds, receita, tema);
      console.log(`✓ "${receita.nome}"`);
      concluidos.add(tema.tema);
      salvarProgresso(concluidos);
      geradas++;
    } catch (err: any) {
      if (isQuotaDiaria(err)) {
        console.log(`\n⛔ Quota diária do Gemini atingida.`);
        console.log(`   Progresso salvo: ${concluidos.size}/${temasFiltrados.length} receitas concluídas.`);
        console.log(`   Execute novamente amanhã para continuar.\n`);
        await ds.destroy();
        process.exit(0);
      }
      console.log(`✗ ${err.message}`);
      erros++;
    }

    if (i < temas.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  limparProgresso();

  await ds.destroy();

  console.log('\n─────────────────────────────────');
  console.log(`✅ ${geradas} receitas geradas com sucesso`);
  if (erros > 0) console.log(`⚠️  ${erros} erros`);

  const ds2 = new DataSource({
    type: 'postgres', host: DB.host, port: DB.port,
    username: DB.username, password: DB.password, database: DB.database,
    synchronize: false, logging: false,
  });
  await ds2.initialize();
  const resumo = await ds2.query(
    `SELECT origem, COUNT(*) as count FROM receitas GROUP BY origem ORDER BY count DESC`
  );
  await ds2.destroy();

  console.log('\nEstado atual do banco:');
  resumo.forEach((row: any) => console.log(`  ${row.origem}: ${row.count} receitas`));
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
