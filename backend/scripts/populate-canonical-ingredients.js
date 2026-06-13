/**
 * Popula canonical_ingredient para entradas existentes no product_knowledge_base.
 * Usa os mesmos padrões do OcrAliasService.
 * Execute: node scripts/populate-canonical-ingredients.js
 */
const { Client } = require('pg');

const DB = { host: 'localhost', port: 5432, user: 'cookme', password: 'cookme123', database: 'cookme_db' };

// Espelho do OCR_MAPA do OcrAliasService
const OCR_MAPA = [
  [/\bpeito\s+de?\s+frang/i, 'peito de frango'],
  [/\bfile\s+de?\s+frang/i, 'peito de frango'],
  [/\bfrang.{0,20}peito/i, 'peito de frango'],
  [/\basa\s+de?\s+frang/i, 'asa de frango'],
  [/\bcoxinha\s+da?\s+asa/i, 'coxinha da asa'],
  [/\bsobrecoxa/i, 'sobrecoxa de frango'],
  [/\bcoxa.{0,10}frang/i, 'coxa de frango'],
  [/\bfrang/i, 'frango'],
  [/\bcarne\s+moi/i, 'carne moída'],
  [/\bpatinho/i, 'carne moída'],
  [/\bpicanha/i, 'picanha'],
  [/\bacem/i, 'acém'],
  [/\bcarne\s+bov/i, 'carne bovina'],
  [/\bcarne\s+por/i, 'carne suína'],
  [/\blombo/i, 'lombo suíno'],
  [/\bpernil/i, 'pernil suíno'],
  [/\bcostelinh/i, 'costelinha de porco'],
  [/\bbacon/i, 'bacon'],
  [/\blinguica\s+calab/i, 'linguiça calabresa'],
  [/\blinguica/i, 'linguiça'],
  [/\bcarne\s+sec/i, 'carne seca'],
  [/\btilapia/i, 'tilápia'],
  [/\bsalmao/i, 'salmão'],
  [/\bbacalhau/i, 'bacalhau'],
  [/\bcamarao/i, 'camarão'],
  [/\batum\s+lat/i, 'atum em lata'],
  [/\batum/i, 'atum'],
  [/\bqueijo\s+mussarel/i, 'queijo mussarela'],
  [/\bqueijo\s+parmesao/i, 'queijo parmesão'],
  [/\bqueijo\s+prato/i, 'queijo prato'],
  [/\bcream.?cheese/i, 'cream cheese'],
  [/\brequeijao/i, 'requeijão'],
  [/\bqueijo/i, 'queijo'],
  [/\bcreme\s+de?\s+leite/i, 'creme de leite'],
  [/\bleite\s+condensa/i, 'leite condensado'],
  [/\bleite\s+de?\s+coc/i, 'leite de coco'],
  [/\bmanteiga/i, 'manteiga'],
  [/\bmargarina/i, 'manteiga'],
  [/\bleite/i, 'leite'],
  [/\biogurte|iog\b/i, 'iogurte'],
  [/\bricota/i, 'ricota'],
  [/\barroz\s+int/i, 'arroz integral'],
  [/\barroz/i, 'arroz'],
  [/\bfeijao\s+preto/i, 'feijão preto'],
  [/\bfeijao\s+caric/i, 'feijão carioca'],
  [/\bfeijao/i, 'feijão'],
  [/\bgrao\s+de?\s+bico/i, 'grão-de-bico'],
  [/\bfar.nha\s+de?\s+trig/i, 'farinha de trigo'],
  [/\bfar.nha\s+de?\s+mand/i, 'farinha de mandioca'],
  [/\bmacarrao\s+espag/i, 'macarrão espaguete'],
  [/\bmacarrao/i, 'macarrão'],
  [/\bespague/i, 'macarrão espaguete'],
  [/\bbatata\s+doc/i, 'batata doce'],
  [/\bbatata/i, 'batata'],
  [/\bmandioca/i, 'mandioca'],
  [/\babobrinha/i, 'abobrinha'],
  [/\babobora/i, 'abóbora'],
  [/\bcabotia/i, 'abóbora cabotiá'],
  [/\bcenoura/i, 'cenoura'],
  [/\bcebola\s+rox/i, 'cebola roxa'],
  [/\bcebola/i, 'cebola'],
  [/\balho/i, 'alho'],
  [/\btomate\s+cerij/i, 'tomate cereja'],
  [/\btomate/i, 'tomate'],
  [/\bpimentao/i, 'pimentão'],
  [/\bchuch/i, 'chuchu'],
  [/\bbrocol/i, 'brócolis'],
  [/\bcouve/i, 'couve'],
  [/\bespinafre/i, 'espinafre'],
  [/\bcebolinha/i, 'cebolinha'],
  [/\bsalsinha|salsa\b/i, 'salsinha'],
  [/\bcoentro/i, 'coentro'],
  [/\bmilho/i, 'milho'],
  [/\bervilha/i, 'ervilha'],
  [/\bbeterraba/i, 'beterraba'],
  [/\blimao/i, 'limão'],
  [/\blaranja/i, 'laranja'],
  [/\bcaqui/i, 'caqui'],
  [/\bovos?\s+caipira/i, 'ovo'],
  [/\bovos?\s+bran/i, 'ovo'],
  [/\bovos?\s+verm/i, 'ovo'],
  [/\bovos?/i, 'ovo'],
  [/\bazeite/i, 'azeite de oliva'],
  [/\boleo/i, 'óleo'],
  [/\bextrato\s+de?\s+tomate/i, 'extrato de tomate'],
  [/\bmolho\s+de?\s+tomate/i, 'molho de tomate'],
  [/\bpassata/i, 'molho de tomate'],
  [/\bcaldo\s+de?\s+galin/i, 'caldo de galinha'],
  [/\bpao\s+de?\s+queijo/i, 'pão de queijo'],
  [/\bpao\s+de?\s+forma/i, 'pão de forma'],
  [/\bacucar/i, 'açúcar'],
  [/\bchocolate/i, 'chocolate'],
];

function resolverCanonical(nome) {
  const texto = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [regex, canonical] of OCR_MAPA) {
    if (regex.test(texto)) return canonical;
  }
  // fallback: primeiras 2 palavras limpas
  return texto.replace(/\d+[,.]?\d*\s*(kg|g|ml|l|un|unid)/gi, '')
    .replace(/c\/\d+/gi, '')
    .replace(/\s+/g, ' ').trim()
    .split(/\s+/).slice(0, 2).join(' ');
}

async function main() {
  const db = new Client(DB);
  await db.connect();

  const { rows } = await db.query(
    `SELECT id, product_name FROM product_knowledge_base WHERE canonical_ingredient IS NULL AND categoria = 'alimento'`
  );

  console.log(`${rows.length} entradas sem canonical_ingredient para processar`);

  let updated = 0;
  for (const row of rows) {
    const canonical = resolverCanonical(row.product_name);
    if (canonical && canonical.length > 1) {
      await db.query(
        `UPDATE product_knowledge_base SET canonical_ingredient = $1 WHERE id = $2`,
        [canonical, row.id]
      );
      console.log(`  "${row.product_name}" → "${canonical}"`);
      updated++;
    }
  }

  console.log(`\n✅ ${updated} entradas atualizadas`);
  await db.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
