/**
 * Scraper de receitas reais do TudoGostoso para seed do banco.
 * Categorias variadas → salva na tabela receitas + receita_ingredientes.
 * Ao final, imprime análise de ingredientes mais frequentes.
 */

const axios = require('axios');
const { Client } = require('pg');

const DB = {
  host: 'localhost', port: 5432,
  user: 'cookme', password: 'cookme123', database: 'cookme_db',
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
};

const BUSCAS = [
  'frango assado',
  'frango ensopado',
  'asa de frango',
  'carne moida',
  'bife acebolado',
  'picanha assada',
  'costelinha porco',
  'peixe grelhado',
  'tilapia assada',
  'macarrao molho',
  'espaguete frango',
  'arroz feijao',
  'feijao tropeiro',
  'batata assada',
  'mandioca cozida',
  'caldo frango',
  'sopa legumes',
  'moqueca peixe',
  'frango milho',
  'omelete queijo',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url) {
  const r = await axios.get(url, { headers: HEADERS, timeout: 15000, maxRedirects: 3 });
  return r.data;
}

function extrairUrls(html) {
  const regex = /href="((?:https:\/\/www\.tudogostoso\.com\.br)?\/receita\/[\w-]+\.html)"/g;
  const urls = new Set();
  let m;
  while ((m = regex.exec(html)) !== null) {
    const url = m[1].startsWith('http') ? m[1] : 'https://www.tudogostoso.com.br' + m[1];
    urls.add(url);
  }
  return Array.from(urls);
}

function parsarJsonLd(html, url) {
  const scriptRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const schemas = Array.isArray(data) ? data : [data];
      for (const s of schemas) {
        if (s['@type'] !== 'Recipe') continue;
        const titulo = s.name;
        const ingredientes = Array.isArray(s.recipeIngredient) ? s.recipeIngredient.filter(Boolean) : [];
        if (!titulo || ingredientes.length === 0) continue;

        let modoPreparo;
        if (Array.isArray(s.recipeInstructions)) {
          modoPreparo = s.recipeInstructions.map((st, i) => {
            const t = typeof st === 'string' ? st : st.text || '';
            return `${i + 1}. ${t.trim()}`;
          }).join('\n');
        } else {
          modoPreparo = String(s.recipeInstructions || '');
        }

        const parseDur = (d) => {
          if (!d) return 30;
          const h = parseInt((d.match(/(\d+)H/) || [])[1] || '0');
          const min = parseInt((d.match(/(\d+)M/) || [])[1] || '0');
          return h * 60 + min || 30;
        };

        const parseYield = (y) => {
          if (!y) return 4;
          const s2 = Array.isArray(y) ? y[0] : y;
          return parseInt(String(s2).match(/\d+/)?.[0] || '4') || 4;
        };

        const extrairImg = (img) => {
          if (!img) return null;
          if (typeof img === 'string') return img;
          if (Array.isArray(img)) return img[0]?.url || img[0] || null;
          return img.url || null;
        };

        return {
          titulo,
          descricao: s.description || '',
          ingredientes,
          modoPreparo,
          tempoMinutos: parseDur(s.totalTime || s.cookTime || s.prepTime),
          porcoes: parseYield(s.recipeYield),
          imagem: extrairImg(s.image),
          avaliacao: s.aggregateRating?.ratingValue ? parseFloat(s.aggregateRating.ratingValue) : null,
          urlFonte: url,
        };
      }
    } catch (_) {}
  }
  return null;
}

function extrairChave(texto) {
  const SKIP = new Set(['sal', 'oleo', 'oleo', 'azeite', 'pimenta', 'tempero', 'agua', 'acucar', 'vinagre']);
  const norm = texto.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/^\d[\d,./ ]*\s*/, '')
    .replace(/^(kg|g|ml|l|un|gr|xicara|xcara|colher(es)?|pitada|dente|fatia|ramo|folha)\s+(de\s+)?/i, '')
    .replace(/^de\s+/, '')
    .replace(/\s*(a gosto|opcional|ou a gosto).*$/, '')
    .replace(/\(.*\)/, '')
    .trim()
    .split(/\s+/).slice(0, 3).join(' ').trim();
  if (norm.length < 2 || SKIP.has(norm.split(' ')[0])) return null;
  return norm;
}

async function salvarReceita(db, receita) {
  // Verifica duplicata
  const existente = await db.query(
    `SELECT id FROM receitas WHERE LOWER(nome) = LOWER($1)`,
    [receita.titulo]
  );
  if (existente.rows.length > 0) return { id: existente.rows[0].id, novo: false };

  const chaves = [...new Set(
    receita.ingredientes.map(extrairChave).filter(Boolean)
  )].sort();

  const ins = await db.query(
    `INSERT INTO receitas (nome, descricao, modo_preparo, tempo_preparo, rendimento_porcoes,
      imagem_url, ingredientes_chave, origem, url_fonte, avaliacao_media, status_moderacao, dificuldade)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'internet',$8,$9,'ok','media')
     RETURNING id`,
    [
      receita.titulo, receita.descricao,
      JSON.stringify(receita.modoPreparo.split('\n').filter(Boolean)),
      receita.tempoMinutos, receita.porcoes,
      receita.imagem, chaves,
      receita.urlFonte, receita.avaliacao || 0,
    ]
  );
  return { id: ins.rows[0].id, novo: true };
}

async function main() {
  const db = new Client(DB);
  await db.connect();
  console.log('✅ Conectado ao banco\n');

  const urlsRaspadas = new Set();
  const receitasSalvas = [];
  const todosIngredientes = [];

  for (const busca of BUSCAS) {
    console.log(`\n🔍 Buscando: "${busca}"`);
    try {
      const searchHtml = await fetchHtml(
        `https://www.tudogostoso.com.br/busca/?q=${encodeURIComponent(busca)}`
      );
      const urls = extrairUrls(searchHtml).filter(u => !urlsRaspadas.has(u)).slice(0, 4);
      console.log(`   ${urls.length} URLs novas`);

      for (const url of urls) {
        urlsRaspadas.add(url);
        try {
          await sleep(800); // respeita rate limit
          const html = await fetchHtml(url);
          const receita = parsarJsonLd(html, url);
          if (!receita) { console.log(`   ⚠️  Sem JSON-LD: ${url.split('/').pop()}`); continue; }

          const { id, novo } = await salvarReceita(db, receita);
          if (novo) {
            receitasSalvas.push({ id, titulo: receita.titulo, ingredientes: receita.ingredientes });
            todosIngredientes.push(...receita.ingredientes);
            console.log(`   ✅ ${receita.titulo} (${receita.ingredientes.length} ingredientes)`);
          } else {
            console.log(`   ⏭️  Já existe: ${receita.titulo}`);
          }
        } catch (e) {
          console.log(`   ❌ ${url.split('/').pop()}: ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`   ❌ Busca falhou: ${e.message}`);
    }
  }

  // ── Análise de ingredientes ──────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════');
  console.log(`📊 RESUMO: ${receitasSalvas.length} receitas novas salvas`);
  console.log('═══════════════════════════════════════════════\n');

  const freq = {};
  for (const ing of todosIngredientes) {
    const chave = extrairChave(ing);
    if (!chave) continue;
    freq[chave] = (freq[chave] || 0) + 1;
  }

  const ranking = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  console.log('🏆 TOP 40 INGREDIENTES MAIS FREQUENTES:');
  ranking.forEach(([nome, count], i) => {
    const bar = '█'.repeat(Math.min(count, 20));
    console.log(`  ${String(i+1).padStart(2)}. ${nome.padEnd(30)} ${bar} (${count}x)`);
  });

  console.log('\n📋 TODAS AS RECEITAS SALVAS:');
  receitasSalvas.forEach(r => console.log(`  - ${r.titulo}`));

  await db.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
