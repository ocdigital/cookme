-- =============================================
-- SCRIPT DE TESTE - DADOS PARA INTEGRAÇÃO MOBILE
-- =============================================
-- Data: 2026-03-12
-- Propósito: Popular banco com dados reais para testar integração mobile

-- 1. INSERIR CATEGORIAS DE ALIMENTOS
-- (Se já existirem, serão ignoradas)
INSERT INTO categorias (id, nome, descricao, icone, is_food, parent_category_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Grãos e Cereais', 'Arroz, feijão, macarrão e outros grãos', '🌾', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Carnes e Peixes', 'Frango, bife, peixe e outros', '🍗', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Laticínios', 'Leite, queijo, iogurte', '🧀', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Frutas e Vegetais', 'Frutas frescas e legumes', '🥗', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Condimentos', 'Sal, pimenta, açúcar e temperos', '🧂', true, NULL, NOW(), NOW())
ON CONFLICT (nome) DO NOTHING;

-- 2. INSERIR PRODUTOS DE TESTE
-- Primeiro, obter IDs das categorias criadas
WITH cat_ids AS (
  SELECT id, nome FROM categorias
  WHERE nome IN ('Grãos e Cereais', 'Carnes e Peixes', 'Laticínios', 'Frutas e Vegetais')
)
INSERT INTO produtos (
  id, nome, descricao, codigo_barras, tipo, unidade_padrao,
  dias_validade_medio, imagem_url, tags, informacao_nutricional,
  origem, verificado, created_at, updated_at, categoria_id
)
SELECT
  gen_random_uuid(),
  nome,
  descricao,
  codigo_barras,
  'ALIMENTO'::product_type_enum,
  unidade,
  dias_validade,
  imagem,
  tags,
  informacao_nutricional,
  'usuario'::origin_enum,
  true,
  NOW(),
  NOW(),
  cat.id
FROM (
  VALUES
    ('Arroz Integral', 'Arroz integral de alta qualidade', '7891234567890', 'kg', 730,
     'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop',
     ARRAY['vegetariano', 'gluten-free']::TEXT[],
     '{"calorias": 111, "proteinas": 2.6, "carboidratos": 24.3, "gorduras": 0.9}'::JSONB, 'Grãos e Cereais'),

    ('Frango Peito', 'Peito de frango fresco', '7891234567891', 'kg', 3,
     'https://images.unsplash.com/photo-1633203777956-8f6530120795?w=200&h=200&fit=crop',
     ARRAY['proteina-alta']::TEXT[],
     '{"calorias": 165, "proteinas": 31, "carboidratos": 0, "gorduras": 3.6}'::JSONB, 'Carnes e Peixes'),

    ('Queijo Meia Cura', 'Queijo fresco de qualidade premium', '7891234567892', 'kg', 30,
     'https://images.unsplash.com/photo-1589985643797-f7ef7c1f1d7d?w=200&h=200&fit=crop',
     ARRAY['vegetariano']::TEXT[],
     '{"calorias": 402, "proteinas": 25, "carboidratos": 1.3, "gorduras": 33}'::JSONB, 'Laticínios'),

    ('Tomate Caqui', 'Tomates frescos e saudáveis', '7891234567893', 'kg', 7,
     'https://images.unsplash.com/photo-1583502282127-d0b88c4a5a7f?w=200&h=200&fit=crop',
     ARRAY['vegetariano', 'vegan', 'low-carb']::TEXT[],
     '{"calorias": 18, "proteinas": 0.9, "carboidratos": 3.9, "gorduras": 0.2}'::JSONB, 'Frutas e Vegetais'),

    ('Alface Crespa', 'Alface fresca para saladas', '7891234567894', 'un', 5,
     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
     ARRAY['vegetariano', 'vegan', 'low-carb']::TEXT[],
     '{"calorias": 15, "proteinas": 1.2, "carboidratos": 2.9, "gorduras": 0.1}'::JSONB, 'Frutas e Vegetais'),

    ('Leite Integral', 'Leite integral fresco', '7891234567895', 'L', 7,
     'https://images.unsplash.com/photo-1550583724-b2692f2a4c4b?w=200&h=200&fit=crop',
     ARRAY['vegetariano']::TEXT[],
     '{"calorias": 61, "proteinas": 3.2, "carboidratos": 4.8, "gorduras": 3.3}'::JSONB, 'Laticínios'),

    ('Ovos Brancos', 'Ovos frescos de galinha', '7891234567896', 'dúzia', 21,
     'https://images.unsplash.com/photo-1585985351026-38bbd3b2c9e2?w=200&h=200&fit=crop',
     ARRAY['vegetariano', 'proteina-alta']::TEXT[],
     '{"calorias": 155, "proteinas": 13, "carboidratos": 1.1, "gorduras": 11}'::JSONB, 'Carnes e Peixes'),

    ('Iogurte Grego', 'Iogurte grego probiótico', '7891234567897', 'un', 14,
     'https://images.unsplash.com/photo-1488477181946-6b0b18676feb?w=200&h=200&fit=crop',
     ARRAY['vegetariano']::TEXT[],
     '{"calorias": 59, "proteinas": 10, "carboidratos": 3.3, "gorduras": 0.4}'::JSONB, 'Laticínios')
) AS t(nome, descricao, codigo_barras, unidade, dias_validade, imagem, tags, informacao_nutricional, categoria_nome)
JOIN cat_ids cat ON cat.nome = t.categoria_nome
ON CONFLICT (codigo_barras) DO NOTHING;

-- 3. INSERIR RECEITAS DE TESTE
WITH ingredientes AS (
  SELECT id, nome FROM produtos
  WHERE nome IN ('Arroz Integral', 'Frango Peito', 'Tomate Caqui', 'Alface Crespa', 'Leite Integral', 'Ovos Brancos')
)
INSERT INTO receitas (
  id, nome, descricao, tempo_preparo, tempo_cozimento,
  rendimento_porcoes, dificuldade, categoria_receita,
  imagem_url, tags_dieta, tags_preparo, informacao_nutricional,
  origem, avaliacao_media, vezes_executada,
  created_at, updated_at
)
VALUES
  (
    gen_random_uuid(),
    'Arroz com Frango',
    'Arroz integral suculento com peito de frango grelhado, tomate fresco e alface crocante. Uma refeição completa e nutritiva.',
    15, 20, 4, 'fácil'::dificuldade_enum, 'almoço',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop',
    ARRAY['low-carb', 'proteina-alta']::TEXT[],
    ARRAY['quick', 'easy']::TEXT[],
    '{"calorias": 450, "proteinas": 35, "carboidratos": 45, "gorduras": 8}'::JSONB,
    'usuario'::origem_enum, 4.8, 5,
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'Omelete de Queijo',
    'Omelete preparada com ovos frescos, queijo derretido, tomate e alface. Perfeito para café da manhã ou brunch.',
    5, 10, 2, 'fácil'::dificuldade_enum, 'café_da_manha',
    'https://images.unsplash.com/photo-1589985643797-f7ef7c1f1d7d?w=300&h=300&fit=crop',
    ARRAY['vegetariano', 'low-carb']::TEXT[],
    ARRAY['quick']::TEXT[],
    '{"calorias": 320, "proteinas": 20, "carboidratos": 5, "gorduras": 25}'::JSONB,
    'usuario'::origem_enum, 4.6, 8,
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'Salada Fresca',
    'Salada leve com alface crocante, tomate suculento e iogurte grego como molho. Ideal para dias quentes.',
    10, 0, 2, 'fácil'::dificuldade_enum, 'almoço',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=300&fit=crop',
    ARRAY['vegetariano', 'vegan', 'low-carb']::TEXT[],
    ARRAY['quick', 'easy']::TEXT[],
    '{"calorias": 150, "proteinas": 8, "carboidratos": 15, "gorduras": 6}'::JSONB,
    'usuario'::origem_enum, 4.5, 12,
    NOW(), NOW()
  );

-- 4. INSERIR INGREDIENTES DAS RECEITAS
WITH receita_ingr AS (
  SELECT r.id as receita_id, p.id as produto_id, r.nome as receita_nome, p.nome as produto_nome
  FROM receitas r
  CROSS JOIN produtos p
  WHERE r.nome = 'Arroz com Frango' AND p.nome IN ('Arroz Integral', 'Frango Peito', 'Tomate Caqui', 'Alface Crespa')

  UNION ALL

  SELECT r.id, p.id, r.nome, p.nome
  FROM receitas r
  CROSS JOIN produtos p
  WHERE r.nome = 'Omelete de Queijo' AND p.nome IN ('Ovos Brancos', 'Queijo Meia Cura', 'Tomate Caqui')

  UNION ALL

  SELECT r.id, p.id, r.nome, p.nome
  FROM receitas r
  CROSS JOIN produtos p
  WHERE r.nome = 'Salada Fresca' AND p.nome IN ('Alface Crespa', 'Tomate Caqui', 'Iogurte Grego')
)
INSERT INTO receita_ingredientes (
  id, receita_id, produto_id, quantidade, unidade, observacao,
  criada_em, atualizada_em
)
SELECT
  gen_random_uuid(),
  receita_id,
  produto_id,
  CASE
    WHEN produto_nome = 'Arroz Integral' THEN 2
    WHEN produto_nome = 'Frango Peito' THEN 0.5
    WHEN produto_nome = 'Tomate Caqui' THEN 0.3
    WHEN produto_nome = 'Alface Crespa' THEN 1
    WHEN produto_nome = 'Ovos Brancos' THEN 3
    WHEN produto_nome = 'Queijo Meia Cura' THEN 0.1
    WHEN produto_nome = 'Iogurte Grego' THEN 0.15
    ELSE 1
  END,
  CASE
    WHEN produto_nome IN ('Arroz Integral', 'Frango Peito', 'Tomate Caqui', 'Queijo Meia Cura', 'Iogurte Grego') THEN 'kg'
    WHEN produto_nome = 'Alface Crespa' THEN 'un'
    WHEN produto_nome = 'Ovos Brancos' THEN 'un'
    ELSE 'un'
  END,
  CASE
    WHEN produto_nome = 'Tomate Caqui' THEN 'cortado em cubos'
    WHEN produto_nome = 'Alface Crespa' THEN 'picada'
    WHEN produto_nome = 'Frango Peito' THEN 'grelhado'
    ELSE NULL
  END,
  NOW(), NOW()
FROM receita_ingr
ON CONFLICT DO NOTHING;

-- 5. EXIBIR RESUMO DO QUE FOI INSERIDO
SELECT '=== RESUMO DOS DADOS INSERIDOS ===' as resumo;
SELECT COUNT(*) as total_categorias FROM categorias;
SELECT COUNT(*) as total_produtos FROM produtos;
SELECT COUNT(*) as total_receitas FROM receitas;
SELECT COUNT(*) as total_ingredientes FROM receita_ingredientes;
