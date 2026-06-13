/**
 * Expansão da base: raspa mais categorias do TudoGostoso.
 * Roda após seed-receitas-tudogostoso.js (já tem 76 receitas).
 */

const axios = require('axios');
const { Client } = require('pg');

const DB = { host: 'localhost', port: 5432, user: 'cookme', password: 'cookme123', database: 'cookme_db' };

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
};

// Mais categorias cobrindo o máximo de ingredientes brasileiros
const BUSCAS = [
  // Frangos
  'frango caipira', 'frango xadrez', 'frango ao molho', 'strogonoff frango',
  'frango com quiabo', 'frango ao curry', 'frango parmegiana',
  // Carnes bovinas
  'carne seca', 'feijoada completa', 'rabada', 'mocoto', 'bisteca bovina',
  'carne de panela', 'boeuf bourguignon', 'rosbife',
  // Suínos
  'lombo recheado', 'pernil porco', 'bisteca suína', 'linguiça acebolada',
  // Frutos do mar
  'camarao alho', 'bacalhau assado', 'moqueca camarao', 'peixe frito',
  'bolinho bacalhau', 'caldeirada peixe',
  // Massas e risotos
  'lasanha bolonhesa', 'nhoque batata', 'risoto frango', 'risoto camarao',
  'macarrao parafuso', 'macarrao frango', 'espaguete alho',
  // Arroz
  'arroz carreteiro', 'arroz forno', 'arroz primavera', 'arroz branco',
  'arroz caldo', 'cuscuz nordestino',
  // Feijão e leguminosas
  'feijao preto', 'feijao carioca', 'lentilha cenoura', 'grao de bico',
  'feijao verde nordeste',
  // Legumes e verduras
  'abobrinha recheada', 'quiabo frango', 'chuchu refogado', 'couve refogada',
  'brocolis alho', 'espinafre ricota', 'cenoura assada', 'mandioca frita',
  // Sopas e caldos
  'caldo verde', 'sopa feijao', 'sopa batata', 'sopa mandioca',
  'caldo mocoto', 'sopa creme abobora',
  // Ovos
  'omelete presunto', 'ovos mexidos', 'ovos cozidos', 'frittata legumes',
  // Sanduiches e lanches
  'hamburguer artesanal', 'wrap frango', 'ovo mexido presunto',
  // Saladas
  'salada macarrao', 'salada frango grelhado', 'salada grao de bico',
  // Sobremesas (para completar a base)
  'bolo cenoura', 'pudim leite', 'brigadeiro',
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
          const mn = parseInt((d.match(/(\d+)M/) || [])[1] || '0');
          return h * 60 + mn || 30;
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
          titulo, descricao: s.description || '', ingredientes, modoPreparo,
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
  const SKIP = new Set(['sal', 'oleo', 'azeite', 'pimenta', 'agua', 'acucar', 'vinagre', 'colorau']);
  const norm = texto.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s*(a gosto|opcional|quanto baste|qb)\s*/gi, '')
    .replace(/^\d[\d,./ ]*\s*/, '')
    .replace(/^(kg|g|mg|ml|l|un|gr|xicara|xcara|colher(es)?( de (sopa|cha))?|pitada|dente(s)?|fatia(s)?|ramo(s)?|folha(s)?|cubo(s)?|tablete(s)?|lata(s)?|pacote(s)?|caixa(s)?|sopa de|cha de|cha)\s+(de\s+)?/gi, '')
    .replace(/^de\s+/, '')
    .replace(/\s+(picad[ao]s?|raladO?s?|amassad[ao]s?|cozid[ao]s?|fatiado?s?|cortad[ao]s?|em cubos?|em pedacos?|em fatias?|bem picad[ao]|bem ralad[ao]|sem pele|sem osso|sem semente|fresco?s?|seco?s?|inteiro?s?|medio?s?|grande?s?|pequeno?s?)(\s|$)/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .split(/\s+/).slice(0, 4).join(' ').trim();
  if (norm.length < 2 || SKIP.has(norm.split(' ')[0])) return null;
  return norm;
}

async function salvarReceita(db, receita) {
  const existente = await db.query(`SELECT id FROM receitas WHERE LOWER(nome) = LOWER($1)`, [receita.titulo]);
  if (existente.rows.length > 0) return { novo: false };

  const chaves = [...new Set(receita.ingredientes.map(extrairChave).filter(Boolean))].sort();

  await db.query(
    `INSERT INTO receitas (nome, descricao, modo_preparo, tempo_preparo, rendimento_porcoes,
      imagem_url, ingredientes_chave, origem, url_fonte, avaliacao_media, status_moderacao, dificuldade)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'internet',$8,$9,'ok','media')`,
    [
      receita.titulo, receita.descricao,
      JSON.stringify(receita.modoPreparo.split('\n').filter(Boolean)),
      receita.tempoMinutos, receita.porcoes, receita.imagem, chaves,
      receita.urlFonte, receita.avaliacao || 0,
    ]
  );
  return { novo: true, ingredientes: receita.ingredientes };
}

async function main() {
  const db = new Client(DB);
  await db.connect();

  let totalNovos = 0;
  const todosIngredientesRaw = [];
  const urlsVistas = new Set();

  // Carrega URLs já raspadas
  const existentes = await db.query(`SELECT url_fonte FROM receitas WHERE url_fonte IS NOT NULL`);
  existentes.rows.forEach(r => urlsVistas.add(r.url_fonte));
  console.log(`Receitas já no banco: ${existentes.rows.length}`);

  for (const busca of BUSCAS) {
    process.stdout.write(`\n🔍 "${busca}" ... `);
    try {
      const html = await fetchHtml(`https://www.tudogostoso.com.br/busca/?q=${encodeURIComponent(busca)}`);
      const urls = extrairUrls(html).filter(u => !urlsVistas.has(u)).slice(0, 4);
      process.stdout.write(`${urls.length} novas `);

      for (const url of urls) {
        urlsVistas.add(url);
        try {
          await sleep(600);
          const rHtml = await fetchHtml(url);
          const receita = parsarJsonLd(rHtml, url);
          if (!receita) continue;

          const { novo, ingredientes } = await salvarReceita(db, receita);
          if (novo) {
            totalNovos++;
            todosIngredientesRaw.push(...(ingredientes || []));
            process.stdout.write(`✅`);
          } else {
            process.stdout.write(`⏭️`);
          }
        } catch (_) { process.stdout.write(`❌`); }
      }
    } catch (_) { process.stdout.write(`💥`); }
  }

  const totalReceitas = await db.query(`SELECT COUNT(*) FROM receitas`);
  console.log(`\n\n✅ ${totalNovos} receitas novas | Total no banco: ${totalReceitas.rows[0].count}`);

  // Análise de ingredientes
  if (todosIngredientesRaw.length > 0) {
    const freq = {};
    for (const ing of todosIngredientesRaw) {
      const chave = extrairChave(ing);
      if (!chave) continue;
      freq[chave] = (freq[chave] || 0) + 1;
    }
    const ranking = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30);
    console.log('\n🏆 TOP 30 NOVOS INGREDIENTES:');
    ranking.forEach(([n, c], i) => console.log(`  ${String(i+1).padStart(2)}. ${n.padEnd(35)} (${c}x)`));
  }

  await db.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
