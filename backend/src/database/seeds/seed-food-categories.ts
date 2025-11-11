import { DataSource } from 'typeorm';
import { Categoria } from '../../modules/produtos/entities/categoria.entity';

/**
 * Seed script to mark food categories and create default food categories
 * Run with: npm run seed
 */
export async function seedFoodCategories(dataSource: DataSource): Promise<void> {
  const categoriaRepository = dataSource.getRepository(Categoria);

  console.log('🌾 Starting food categories seed...');

  // Default food categories to create/update
  const defaultFoodCategories = [
    {
      nome: 'Grãos e Cereais',
      descricao: 'Arroz, feijão, milho, trigo e seus derivados',
      icone: '🌾',
      is_food: true,
    },
    {
      nome: 'Laticínios e Queijos',
      descricao: 'Leite, queijo, iogurte e produtos lácteos',
      icone: '🥛',
      is_food: true,
    },
    {
      nome: 'Carnes e Peixes',
      descricao: 'Carne vermelha, frango, peixes, ovos',
      icone: '🥩',
      is_food: true,
    },
    {
      nome: 'Frutas e Vegetais',
      descricao: 'Frutas frescas, vegetais e legumes',
      icone: '🥬',
      is_food: true,
    },
    {
      nome: 'Pão e Padaria',
      descricao: 'Pão, bolo, biscoito e produtos de padaria',
      icone: '🍞',
      is_food: true,
    },
    {
      nome: 'Bebidas',
      descricao: 'Suco, refrigerante, água, bebidas em geral',
      icone: '🥤',
      is_food: true,
    },
    {
      nome: 'Doces e Sobremesas',
      descricao: 'Chocolate, doces, sobremesas, sorvete',
      icone: '🍫',
      is_food: true,
    },
    {
      nome: 'Temperos e Condimentos',
      descricao: 'Sal, pimenta, molhos, temperos e especiarias',
      icone: '🧂',
      is_food: true,
    },
    {
      nome: 'Óleos e Gorduras',
      descricao: 'Óleo, manteiga, azeite e gorduras comestíveis',
      icone: '🫒',
      is_food: true,
    },
    {
      nome: 'Alimentos Congelados',
      descricao: 'Alimentos pré-preparados e congelados',
      icone: '❄️',
      is_food: true,
    },
  ];

  let created = 0;
  let updated = 0;

  for (const categoryData of defaultFoodCategories) {
    let categoria = await categoriaRepository.findOne({
      where: { nome: categoryData.nome },
    });

    if (!categoria) {
      // Create new category
      categoria = categoriaRepository.create(categoryData);
      await categoriaRepository.save(categoria);
      console.log(`✅ Created category: ${categoryData.nome}`);
      created++;
    } else if (!categoria.is_food) {
      // Update existing category to mark as food
      categoria.is_food = true;
      categoria.icone = categoryData.icone;
      categoria.descricao = categoryData.descricao;
      await categoriaRepository.save(categoria);
      console.log(`✏️  Updated category: ${categoryData.nome}`);
      updated++;
    } else {
      console.log(`⏭️  Category already marked as food: ${categoryData.nome}`);
    }
  }

  // Mark ALL existing categories that contain food-related keywords as food
  const existingCategories = await categoriaRepository.find();
  const foodKeywords = [
    'alimento',
    'comida',
    'alimentar',
    'alimentação',
    'alimentício',
    'alimentícia',
    'alimentos',
  ];

  let autoMarked = 0;
  for (const categoria of existingCategories) {
    if (!categoria.is_food) {
      const nomeLower = categoria.nome.toLowerCase();
      const descricaoLower = (categoria.descricao || '').toLowerCase();

      const isFoodRelated = foodKeywords.some(
        (keyword) =>
          nomeLower.includes(keyword) || descricaoLower.includes(keyword),
      );

      if (isFoodRelated) {
        categoria.is_food = true;
        await categoriaRepository.save(categoria);
        console.log(`🔄 Auto-marked as food: ${categoria.nome}`);
        autoMarked++;
      }
    }
  }

  console.log('\n✨ Seed completed:');
  console.log(`   - Created: ${created} categories`);
  console.log(`   - Updated: ${updated} categories`);
  console.log(`   - Auto-marked: ${autoMarked} categories`);
}
