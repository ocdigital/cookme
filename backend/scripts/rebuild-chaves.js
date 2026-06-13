/**
 * Recalcula ingredientes_chave de todas as receitas usando o novo normalizer.
 */
const { Client } = require('pg');

const DB = { host: 'localhost', port: 5432, user: 'cookme', password: 'cookme123', database: 'cookme_db' };

// Normalizer (JS port do TypeScript)
const UNIDADES_RE = /^[\d]+[\d,./\s]*\s*(?:kg|g|mg|ml|l|litros?|colheres?|col|xícaras?|xicaras?|xcara|copo|latas?|caixas?|caixinhas?|pacotes?|envelopes?|sachês?|dentes?|tabletes?|cubos?|fatias?|pedaços?|pedacos?|ramos?|folhas?|pitadas?|fio|punhado|unidades?|un|maços?|maco|bisnaga|potes?)?\s*(?:de\s+)?/i;
const PREPARO_RE = /\s+(?:picad[ao]s?|ralad[ao]s?|amassad[ao]s?|cozid[ao]s?|fatiado?s?|cortad[ao]s?|desfiado?s?|moíd[ao]s?|triturad[ao]s?|liquidificad[ao]s?|escorrido?s?|escalda[do]s?|hidratad[ao]s?|temperado?s?|em\s+(?:cubos?|pedaços?|fatias?|tiras?|rodelas?)|sem\s+(?:pele|osso|semente|casca)|bem\s+\w+|inteiro?s?|médio?s?|medio?s?|grande?s?|pequeno?s?|maduro?s?|fresco?s?|seco?s?|defumado?s?|cru?s?)(\s|$)/gi;
const SINONIMOS = {
  'dentes de alho': 'alho', 'dente de alho': 'alho', 'alho amassado': 'alho',
  'cebola media': 'cebola', 'cebola grande': 'cebola', 'cebola pequena': 'cebola',
  'cheiro-verde': 'cheiro verde', 'salsa': 'salsinha',
  'lata de creme': 'creme de leite', 'caixinha de creme': 'creme de leite',
  'creme de leite fresco': 'creme de leite',
  'margarina': 'manteiga',
  'tablete de caldo': 'caldo de galinha', 'cubo de caldo': 'caldo de galinha',
  'queijo parmesao': 'queijo parmesão', 'queijo parmesao ralado': 'queijo parmesão',
  'queijo mozzarella': 'queijo mussarela',
  'massa espaguete': 'macarrão espaguete',
  'polpa de tomate': 'molho de tomate',
  'farinha de trigo peneirada': 'farinha de trigo',
  'azeite extravirgem': 'azeite de oliva',
};
const SEMPRE_SKIP = new Set(['sal', 'pimenta', 'pimenta-do-reino', 'azeite', 'oleo', 'vinagre', 'colorau', 'oregano', 'alecrim', 'louro', 'cominho']);
const NAO_ING = new Set(['agua', 'gelo', 'papel aluminio', 'papel manteiga', 'palito']);

function normalizar(raw) {
  const aGosto = /a\s+gosto|quanto\s+baste|\bqb\b|opcional/i.test(raw);
  let t = raw.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/a\s+gosto|quanto\s+baste|\bqb\b|opcional/gi, '')
    .trim();

  t = t.replace(UNIDADES_RE, '');
  t = t.replace(/^(?:de\s+)?(?:sopa|cha|sobremesa|cafe)\s+de\s+/i, '');
  t = t.replace(/^de\s+/, '');
  t = t.replace(PREPARO_RE, ' ').trim();
  // Normaliza plural simples: ovos→ovo, tomates→tomate
  t = t.replace(/\bovos\b/, 'ovo').replace(/\btomates\b/, 'tomate');
  t = t.replace(/\s{2,}/g, ' ').trim();

  if (!t || t.length < 2) return null;
  const nome4 = t.split(/\s+/).slice(0, 4).join(' ');
  const canonico = SINONIMOS[nome4] || nome4;
  if (SEMPRE_SKIP.has(canonico.split(' ')[0]) || NAO_ING.has(canonico)) return null;
  if (aGosto && !['creme de leite', 'queijo', 'bacon', 'presunto'].includes(canonico)) return null;
  return canonico;
}

async function main() {
  const db = new Client(DB);
  await db.connect();

  const receitas = await db.query(`SELECT id, ingredientes_chave FROM receitas WHERE ingredientes_chave IS NOT NULL`);
  console.log(`Recalculando chaves para ${receitas.rows.length} receitas...`);

  // Busca ingredientes brutos das receitas via url_fonte e JSON-LD não disponível aqui
  // Usa ingredientes_chave existentes como proxy, apenas normaliza
  let atualizadas = 0;
  for (const r of receitas.rows) {
    const chaves = r.ingredientes_chave || [];
    const novasChaves = [...new Set(chaves.map(c => {
      // Chaves já são parcialmente normalizadas, apenas aplica sinonimos e plural
      let t = c.replace(/\bovos\b/, 'ovo').replace(/\btomates\b/, 'tomate');
      return SINONIMOS[t] || t;
    }).filter(Boolean))].sort();

    if (JSON.stringify(novasChaves) !== JSON.stringify(chaves)) {
      await db.query(`UPDATE receitas SET ingredientes_chave = $1 WHERE id = $2`, [novasChaves, r.id]);
      atualizadas++;
    }
  }

  console.log(`✅ ${atualizadas} receitas tiveram chaves atualizadas`);

  // Análise final dos ingredientes no banco
  const todas = await db.query(`SELECT ingredientes_chave FROM receitas WHERE ingredientes_chave IS NOT NULL`);
  const freq = {};
  for (const r of todas.rows) {
    for (const chave of (r.ingredientes_chave || [])) {
      freq[chave] = (freq[chave] || 0) + 1;
    }
  }
  const ranking = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 50);
  console.log('\n🏆 TOP 50 INGREDIENTES NO BANCO (chaves normalizadas):');
  ranking.forEach(([n,c],i) => console.log(`  ${String(i+1).padStart(2)}. ${n.padEnd(38)} (${c}x)`));

  const total = await db.query('SELECT COUNT(*) FROM receitas');
  console.log(`\nTotal receitas: ${total.rows[0].count}`);

  await db.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
