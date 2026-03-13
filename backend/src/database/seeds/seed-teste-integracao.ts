import { Client } from 'pg';

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'cookme',
  password: process.env.DB_PASSWORD || 'cookme123',
  database: process.env.DB_DATABASE || 'cookme_db',
});

async function seed() {
  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados');

    // Inserir receitas de teste (se não existirem)
    const receitasResult = await client.query('SELECT COUNT(*) as count FROM receitas');
    const receitasCount = parseInt(receitasResult.rows[0].count);

    if (receitasCount === 0) {
      console.log('Inserindo receitas de teste...');

      const receitas = [
        {
          nome: 'Bolo de Chocolate',
          descricao: 'Um delicioso bolo de chocolate caseiro',
          modo_preparo: '1. Misture os ingredientes. 2. Coloque na forma. 3. Asse a 180°C por 30 minutos.',
          tempo_preparo: 40,
          rendimento_porcoes: 8,
          dificuldade: 'facil',
          categoria_receita: 'sobremesa',
          imagem_url: 'https://via.placeholder.com/300?text=Bolo+de+Chocolate',
        },
        {
          nome: 'Arroz com Feijão',
          descricao: 'Prato clássico e nutritivo',
          modo_preparo: '1. Cozinhe o arroz. 2. Cozinhe o feijão. 3. Misture os dois.',
          tempo_preparo: 45,
          rendimento_porcoes: 6,
          dificuldade: 'facil',
          categoria_receita: 'almoco',
          imagem_url: 'https://via.placeholder.com/300?text=Arroz+com+Feijao',
        },
        {
          nome: 'Salmão Grelhado',
          descricao: 'Salmão fresco grelhado com temperos',
          modo_preparo: '1. Tempere o salmão. 2. Grelhe por 8 minutos de cada lado. 3. Sirva quente.',
          tempo_preparo: 20,
          rendimento_porcoes: 4,
          dificuldade: 'media',
          categoria_receita: 'almoco',
          imagem_url: 'https://via.placeholder.com/300?text=Salmao+Grelhado',
        },
      ];

      for (const receita of receitas) {
        const result = await client.query(
          `INSERT INTO receitas (nome, descricao, modo_preparo, tempo_preparo, rendimento_porcoes, dificuldade, categoria_receita, imagem_url, origem)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            receita.nome,
            receita.descricao,
            receita.modo_preparo,
            receita.tempo_preparo,
            receita.rendimento_porcoes,
            receita.dificuldade,
            receita.categoria_receita,
            receita.imagem_url,
            'catalogo',
          ],
        );

        console.log(`✓ Receita "${receita.nome}" inserida (ID: ${result.rows[0].id})`);
      }
    } else {
      console.log(`✓ Banco já contém ${receitasCount} receitas`);
    }

    console.log('\n✓ Seed concluído com sucesso!');
  } catch (error) {
    console.error('✗ Erro durante seed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
