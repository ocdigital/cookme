#!/bin/bash

# Inserir 5 categorias
psql -U cookme -d cookme_db << 'EOF'
INSERT INTO categorias (id, nome, descricao, icone, is_food, criado_em)
VALUES
  (gen_random_uuid(), 'Grãos e Cereais', 'Arroz, feijão, macarrão', '🌾', true, NOW()),
  (gen_random_uuid(), 'Carnes e Peixes', 'Frango, bife, peixe', '🍗', true, NOW()),
  (gen_random_uuid(), 'Laticínios', 'Leite, queijo, iogurte', '🧀', true, NOW()),
  (gen_random_uuid(), 'Frutas e Vegetais', 'Frutas e legumes', '🥗', true, NOW());

-- Inserir 8 produtos
INSERT INTO produtos (id, nome, descricao, codigo_barras, tipo, unidade_padrao, validade_media_dias, imagem_url, tags, informacoes_nutricionais, origem, verificado, criado_em, atualizado_em, categoria_id)
SELECT gen_random_uuid(), 'Arroz Integral', 'Arroz de qualidade', '7891234567890', 'ALIMENTO', 'kg', 730, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200', ARRAY['vegetariano'], '{"calorias": 111}'::jsonb, 'usuario', true, NOW(), NOW(), (SELECT id FROM categorias WHERE nome = 'Grãos e Cereais' LIMIT 1);

INSERT INTO produtos (id, nome, descricao, codigo_barras, tipo, unidade_padrao, validade_media_dias, imagem_url, tags, informacoes_nutricionais, origem, verificado, criado_em, atualizado_em, categoria_id)
SELECT gen_random_uuid(), 'Frango Peito', 'Peito fresco', '7891234567891', 'ALIMENTO', 'kg', 3, 'https://images.unsplash.com/photo-1633203777956-8f6530120795?w=200', ARRAY['proteina'], '{"calorias": 165}'::jsonb, 'usuario', true, NOW(), NOW(), (SELECT id FROM categorias WHERE nome = 'Carnes e Peixes' LIMIT 1);

INSERT INTO produtos (id, nome, descricao, codigo_barras, tipo, unidade_padrao, validade_media_dias, imagem_url, tags, informacoes_nutricionais, origem, verificado, criado_em, atualizado_em, categoria_id)
SELECT gen_random_uuid(), 'Queijo Meia Cura', 'Queijo premium', '7891234567892', 'ALIMENTO', 'kg', 30, 'https://images.unsplash.com/photo-1589985643797-f7ef7c1f1d7d?w=200', ARRAY['vegetariano'], '{"calorias": 402}'::jsonb, 'usuario', true, NOW(), NOW(), (SELECT id FROM categorias WHERE nome = 'Laticínios' LIMIT 1);

INSERT INTO produtos (id, nome, descricao, codigo_barras, tipo, unidade_padrao, validade_media_dias, imagem_url, tags, informacoes_nutricionais, origem, verificado, criado_em, atualizado_em, categoria_id)
SELECT gen_random_uuid(), 'Tomate Caqui', 'Tomates frescos', '7891234567893', 'ALIMENTO', 'kg', 7, 'https://images.unsplash.com/photo-1583502282127-d0b88c4a5a7f?w=200', ARRAY['vegan'], '{"calorias": 18}'::jsonb, 'usuario', true, NOW(), NOW(), (SELECT id FROM categorias WHERE nome = 'Frutas e Vegetais' LIMIT 1);

INSERT INTO produtos (id, nome, descricao, codigo_barras, tipo, unidade_padrao, validade_media_dias, imagem_url, tags, informacoes_nutricionais, origem, verificado, criado_em, atualizado_em, categoria_id)
SELECT gen_random_uuid(), 'Alface Crespa', 'Alface para saladas', '7891234567894', 'ALIMENTO', 'un', 5, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200', ARRAY['vegan'], '{"calorias": 15}'::jsonb, 'usuario', true, NOW(), NOW(), (SELECT id FROM categorias WHERE nome = 'Frutas e Vegetais' LIMIT 1);

INSERT INTO produtos (id, nome, descricao, codigo_barras, tipo, unidade_padrao, validade_media_dias, imagem_url, tags, informacoes_nutricionais, origem, verificado, criado_em, atualizado_em, categoria_id)
SELECT gen_random_uuid(), 'Leite Integral', 'Leite fresco', '7891234567895', 'ALIMENTO', 'l', 7, 'https://images.unsplash.com/photo-1550583724-b2692f2a4c4b?w=200', ARRAY['vegetariano'], '{"calorias": 61}'::jsonb, 'usuario', true, NOW(), NOW(), (SELECT id FROM categorias WHERE nome = 'Laticínios' LIMIT 1);

INSERT INTO produtos (id, nome, descricao, codigo_barras, tipo, unidade_padrao, validade_media_dias, imagem_url, tags, informacoes_nutricionais, origem, verificado, criado_em, atualizado_em, categoria_id)
SELECT gen_random_uuid(), 'Ovos Brancos', 'Ovos frescos', '7891234567896', 'ALIMENTO', 'un', 21, 'https://images.unsplash.com/photo-1585985351026-38bbd3b2c9e2?w=200', ARRAY['vegetariano'], '{"calorias": 155}'::jsonb, 'usuario', true, NOW(), NOW(), (SELECT id FROM categorias WHERE nome = 'Carnes e Peixes' LIMIT 1);

INSERT INTO produtos (id, nome, descricao, codigo_barras, tipo, unidade_padrao, validade_media_dias, imagem_url, tags, informacoes_nutricionais, origem, verificado, criado_em, atualizado_em, categoria_id)
SELECT gen_random_uuid(), 'Iogurte Grego', 'Iogurte probiótico', '7891234567897', 'ALIMENTO', 'un', 14, 'https://images.unsplash.com/photo-1488477181946-6b0b18676feb?w=200', ARRAY['vegetariano'], '{"calorias": 59}'::jsonb, 'usuario', true, NOW(), NOW(), (SELECT id FROM categorias WHERE nome = 'Laticínios' LIMIT 1);

-- Inserir 3 receitas
INSERT INTO receitas (id, nome, descricao, tempo_preparo, rendimento_porcoes, dificuldade, categoria_receita, imagem_url, tags_dieta, tags_preparo, informacoes_nutricionais, origem, avaliacao_media, vezes_executada, criado_em, atualizado_em)
VALUES (gen_random_uuid(), 'Arroz com Frango', 'Arroz com frango grelhado', 35, 4, 'fácil', 'almoço', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300', ARRAY['low-carb'], ARRAY['quick'], '{"calorias": 450}'::jsonb, 'usuario', 4.8, 5, NOW(), NOW());

INSERT INTO receitas (id, nome, descricao, tempo_preparo, rendimento_porcoes, dificuldade, categoria_receita, imagem_url, tags_dieta, tags_preparo, informacoes_nutricionais, origem, avaliacao_media, vezes_executada, criado_em, atualizado_em)
VALUES (gen_random_uuid(), 'Omelete de Queijo', 'Omelete com queijo derretido', 15, 2, 'fácil', 'café_da_manha', 'https://images.unsplash.com/photo-1589985643797-f7ef7c1f1d7d?w=300', ARRAY['vegetariano'], ARRAY['quick'], '{"calorias": 320}'::jsonb, 'usuario', 4.6, 8, NOW(), NOW());

INSERT INTO receitas (id, nome, descricao, tempo_preparo, rendimento_porcoes, dificuldade, categoria_receita, imagem_url, tags_dieta, tags_preparo, informacoes_nutricionais, origem, avaliacao_media, vezes_executada, criado_em, atualizado_em)
VALUES (gen_random_uuid(), 'Salada Fresca', 'Salada com alface e tomate', 10, 2, 'fácil', 'almoço', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300', ARRAY['vegan'], ARRAY['quick'], '{"calorias": 150}'::jsonb, 'usuario', 4.5, 12, NOW(), NOW());

SELECT 'Dados inseridos com sucesso!' as resultado;
EOF
