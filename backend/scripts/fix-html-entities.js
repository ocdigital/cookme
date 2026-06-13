/**
 * Fix HTML entities in modo_preparo and descricao fields scraped from TudoGostoso.
 * Run from backend/ directory.
 */
const { Client } = require('pg');

const DB = { host: 'localhost', port: 5432, user: 'cookme', password: 'cookme123', database: 'cookme_db' };

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&agrave;/g, 'à')
    .replace(/&atilde;/g, 'ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&acirc;/g, 'â')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ucirc;/g, 'û')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

async function main() {
  const db = new Client(DB);
  await db.connect();

  const { rows } = await db.query(`
    SELECT id, nome, descricao, modo_preparo
    FROM receitas
    WHERE modo_preparo LIKE '%&amp;%' OR descricao LIKE '%&amp;%'
  `);

  console.log(`Found ${rows.length} recipes with HTML entities`);
  let updated = 0;

  for (const row of rows) {
    const modoPreparo = row.modo_preparo;
    let decoded;

    // modo_preparo is stored as JSON array string
    try {
      const arr = JSON.parse(modoPreparo);
      if (Array.isArray(arr)) {
        decoded = JSON.stringify(arr.map(step => decodeHtmlEntities(step)));
      } else {
        decoded = decodeHtmlEntities(modoPreparo);
      }
    } catch {
      decoded = decodeHtmlEntities(modoPreparo);
    }

    const decodedDesc = decodeHtmlEntities(row.descricao);

    if (decoded !== modoPreparo || decodedDesc !== row.descricao) {
      await db.query(
        `UPDATE receitas SET modo_preparo = $1, descricao = $2 WHERE id = $3`,
        [decoded, decodedDesc, row.id]
      );
      updated++;
    }
  }

  console.log(`Updated ${updated} recipes`);
  await db.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
