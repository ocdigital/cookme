import { Client } from 'pg';

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'cookme',
  password: process.env.DB_PASSWORD || 'cookme123',
  database: process.env.DB_DATABASE || 'cookme_db',
});

function diasAFrente(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  try {
    await client.connect();
    console.log('✓ Conectado ao banco');

    const res = await client.query(`
      SELECT i.id, p.nome
      FROM inventario i
      JOIN produtos p ON p.id = i.produto_id
      WHERE i.esgotado = false
      ORDER BY RANDOM()
    `);

    const itens = res.rows;
    if (itens.length === 0) {
      console.log('⚠️  Nenhum item no inventário');
      return;
    }

    console.log(`📦 ${itens.length} itens encontrados — atualizando validades...`);

    // Distribui datas: 20% vencendo em 1-5 dias, 25% em 6-14, 55% em 15-120 dias
    const urgente    = Math.ceil(itens.length * 0.20);
    const moderado   = Math.ceil(itens.length * 0.25);

    let i = 0;
    for (const item of itens) {
      let dias: number;
      if (i < urgente) {
        dias = randomInt(1, 5);
      } else if (i < urgente + moderado) {
        dias = randomInt(6, 14);
      } else {
        dias = randomInt(15, 120);
      }

      const validade = diasAFrente(dias);
      await client.query(
        `UPDATE inventario SET data_validade = $1 WHERE id = $2`,
        [validade, item.id]
      );
      console.log(`  ✓ "${item.nome}" → vence em ${dias} dia(s) (${validade.toLocaleDateString('pt-BR')})`);
      i++;
    }

    console.log('\n✅ Validades atualizadas com sucesso!');
  } catch (err) {
    console.error('✗ Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
