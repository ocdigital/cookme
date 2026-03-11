import { DataSource } from 'typeorm';
import { Categoria } from '../../modules/produtos/entities/categoria.entity';

export async function seedCategoriasAlimentos(dataSource: DataSource) {
  const categoriaRepository = dataSource.getRepository(Categoria);

  const categorias = [
    // Cereais e Grãos
    {
      nome: 'Arroz',
      descricao: 'Arroz branco, integral, arbóreo, etc',
      is_food: true,
    },
    {
      nome: 'Feijão',
      descricao: 'Feijão preto, carioca, branco, etc',
      is_food: true,
    },
    {
      nome: 'Massas',
      descricao: 'Macarrão, lasanha, ravióli, etc',
      is_food: true,
    },
    {
      nome: 'Farinhas',
      descricao: 'Farinha de trigo, milho, mandioca, etc',
      is_food: true,
    },

    // Proteínas
    {
      nome: 'Carnes Bovinas',
      descricao: 'Carne bovina, bife, picanha, etc',
      is_food: true,
    },
    {
      nome: 'Frango',
      descricao: 'Peito, coxa, sobrecoxa, frango inteiro',
      is_food: true,
    },
    {
      nome: 'Peixes',
      descricao: 'Salmão, tilápia, bacalhau, etc',
      is_food: true,
    },
    {
      nome: 'Ovos',
      descricao: 'Ovos de galinha, codorna, etc',
      is_food: true,
    },

    // Laticínios
    {
      nome: 'Leite',
      descricao: 'Leite integral, desnatado, sem lactose',
      is_food: true,
    },
    {
      nome: 'Queijos',
      descricao: 'Mussarela, prato, parmesão, etc',
      is_food: true,
    },
    {
      nome: 'Iogurtes',
      descricao: 'Iogurte natural, grego, com frutas',
      is_food: true,
    },
    {
      nome: 'Manteiga e Margarina',
      descricao: 'Manteiga, margarina, creme vegetal',
      is_food: true,
    },

    // Frutas e Vegetais
    {
      nome: 'Frutas',
      descricao: 'Maçã, banana, laranja, etc',
      is_food: true,
    },
    {
      nome: 'Verduras',
      descricao: 'Alface, rúcula, couve, espinafre',
      is_food: true,
    },
    {
      nome: 'Legumes',
      descricao: 'Tomate, cenoura, batata, cebola',
      is_food: true,
    },

    // Óleos e Condimentos
    {
      nome: 'Óleos',
      descricao: 'Óleo de soja, girassol, azeite',
      is_food: true,
    },
    {
      nome: 'Temperos',
      descricao: 'Sal, pimenta, alho, especiarias',
      is_food: true,
    },
    {
      nome: 'Molhos',
      descricao: 'Molho de tomate, shoyu, ketchup',
      is_food: true,
    },

    // Bebidas
    {
      nome: 'Bebidas',
      descricao: 'Sucos, refrigerantes, água',
      is_food: true,
    },
    {
      nome: 'Café e Chá',
      descricao: 'Café, chá preto, chá verde',
      is_food: true,
    },

    // Doces e Snacks
    {
      nome: 'Açúcares e Adoçantes',
      descricao: 'Açúcar, mel, adoçante',
      is_food: true,
    },
    {
      nome: 'Chocolates',
      descricao: 'Chocolate ao leite, meio amargo, branco',
      is_food: true,
    },
    {
      nome: 'Biscoitos e Bolachas',
      descricao: 'Biscoitos doces, salgados, integrais',
      is_food: true,
    },
    {
      nome: 'Salgadinhos',
      descricao: 'Chips, salgadinhos de milho, etc',
      is_food: true,
    },

    // Enlatados e Conservas
    {
      nome: 'Enlatados',
      descricao: 'Milho, ervilha, atum em lata',
      is_food: true,
    },
    {
      nome: 'Conservas',
      descricao: 'Palmito, azeitona, picles',
      is_food: true,
    },

    // Congelados
    {
      nome: 'Congelados',
      descricao: 'Vegetais congelados, refeições prontas',
      is_food: true,
    },

    // Padaria
    {
      nome: 'Pães',
      descricao: 'Pão francês, de forma, integral',
      is_food: true,
    },
    {
      nome: 'Bolos e Tortas',
      descricao: 'Bolos prontos, tortas doces e salgadas',
      is_food: true,
    },

    // Produtos Não Alimentícios
    {
      nome: 'Limpeza',
      descricao: 'Produtos de limpeza doméstica',
      is_food: false,
    },
    {
      nome: 'Higiene Pessoal',
      descricao: 'Sabonetes, shampoos, cremes',
      is_food: false,
    },
    {
      nome: 'Utensílios',
      descricao: 'Utensílios de cozinha',
      is_food: false,
    },
  ];

  for (const categoriaData of categorias) {
    // Verifica se já existe
    const existing = await categoriaRepository.findOne({
      where: { nome: categoriaData.nome },
    });

    if (!existing) {
      const categoria = categoriaRepository.create(categoriaData);
      await categoriaRepository.save(categoria);
      console.log(`✓ Categoria criada: ${categoriaData.nome}`);
    } else {
      console.log(`→ Categoria já existe: ${categoriaData.nome}`);
    }
  }

  console.log('\n✅ Seed de categorias concluído!');
  console.log(`Total: ${categorias.length} categorias`);
  console.log(
    `Alimentícios: ${categorias.filter((c) => c.is_food).length} categorias`,
  );
  console.log(
    `Não Alimentícios: ${categorias.filter((c) => !c.is_food).length} categorias`,
  );
}
