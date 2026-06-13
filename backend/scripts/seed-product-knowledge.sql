-- =============================================================================
-- SEED: product_knowledge_base — produtos brasileiros de supermercado
-- Mapeia nomes exatos/OCR → ingrediente canônico
-- Seguro para rodar múltiplas vezes (ON CONFLICT DO NOTHING)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE INDEX IF NOT EXISTS idx_pkb_trgm_product_name
  ON product_knowledge_base USING gin(product_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_pkb_trgm_product_name_lower
  ON product_knowledge_base USING gin(lower(product_name) gin_trgm_ops);

-- Tabela temporária para o seed
CREATE TEMP TABLE pkb_seed (
  product_name varchar(255),
  normalized_name varchar(255),
  categoria varchar(50),
  canonical_ingredient varchar(100),
  confidence_score numeric,
  total_validacoes int,
  validacoes_alimento int,
  ingrediente_receita bool,
  is_active bool
);

INSERT INTO pkb_seed
  (product_name, normalized_name, categoria, canonical_ingredient, confidence_score,
   total_validacoes, validacoes_alimento, ingrediente_receita, is_active)
VALUES

-- =============================================================================
-- PROTEÍNAS — FRANGO
-- =============================================================================
('Peito de Frango', 'peito de frango', 'alimento', 'peito de frango', 0.99, 1, 1, true, true),
('File de Frango', 'file de frango', 'alimento', 'peito de frango', 0.99, 1, 1, true, true),
('Filé de Frango', 'file de frango', 'alimento', 'peito de frango', 0.99, 1, 1, true, true),
('Frango Peito KG', 'frango peito kg', 'alimento', 'peito de frango', 0.99, 1, 1, true, true),
('Frango Peito Cong', 'frango peito cong', 'alimento', 'peito de frango', 0.99, 1, 1, true, true),
('Sobrecoxa Frango', 'sobrecoxa frango', 'alimento', 'sobrecoxa de frango', 0.99, 1, 1, true, true),
('Sobrecoxa Frango KG', 'sobrecoxa frango kg', 'alimento', 'sobrecoxa de frango', 0.99, 1, 1, true, true),
('Coxa Frango KG', 'coxa frango kg', 'alimento', 'coxa de frango', 0.99, 1, 1, true, true),
('Coxa e Sobrecoxa', 'coxa e sobrecoxa', 'alimento', 'coxa de frango', 0.99, 1, 1, true, true),
('Coxinha da Asa', 'coxinha da asa', 'alimento', 'coxinha da asa', 0.99, 1, 1, true, true),
('Asa de Frango', 'asa de frango', 'alimento', 'asa de frango', 0.99, 1, 1, true, true),
('Frango Inteiro KG', 'frango inteiro kg', 'alimento', 'frango', 0.99, 1, 1, true, true),
('Frango Caipira KG', 'frango caipira kg', 'alimento', 'frango', 0.99, 1, 1, true, true),
('Frango Resfriado KG', 'frango resfriado kg', 'alimento', 'frango', 0.99, 1, 1, true, true),
('Caldo de Frango Knorr', 'caldo de frango knorr', 'alimento', 'caldo de frango', 0.99, 1, 1, true, true),
('Caldo Galinha Knorr', 'caldo galinha knorr', 'alimento', 'caldo de galinha', 0.99, 1, 1, true, true),

-- =============================================================================
-- PROTEÍNAS — BOVINA
-- =============================================================================
('Carne Moida KG', 'carne moida kg', 'alimento', 'carne moída', 0.99, 1, 1, true, true),
('Carne Moída KG', 'carne moida kg', 'alimento', 'carne moída', 0.99, 1, 1, true, true),
('Patinho Moido KG', 'patinho moido kg', 'alimento', 'carne moída', 0.99, 1, 1, true, true),
('Acém KG', 'acem kg', 'alimento', 'acém', 0.99, 1, 1, true, true),
('Acem KG', 'acem kg', 'alimento', 'acém', 0.99, 1, 1, true, true),
('Acem', 'acem', 'alimento', 'acém', 0.99, 1, 1, true, true),
('Picanha KG', 'picanha kg', 'alimento', 'picanha', 0.99, 1, 1, true, true),
('Contrafile KG', 'contrafile kg', 'alimento', 'contrafilé', 0.99, 1, 1, true, true),
('Contrafilé KG', 'contrafile kg', 'alimento', 'contrafilé', 0.99, 1, 1, true, true),
('Alcatra KG', 'alcatra kg', 'alimento', 'alcatra', 0.99, 1, 1, true, true),
('Musculo Bovino KG', 'musculo bovino kg', 'alimento', 'músculo bovino', 0.99, 1, 1, true, true),
('Músculo KG', 'musculo kg', 'alimento', 'músculo bovino', 0.99, 1, 1, true, true),
('Coxao Mole KG', 'coxao mole kg', 'alimento', 'coxão mole', 0.99, 1, 1, true, true),
('Coxão Mole KG', 'coxao mole kg', 'alimento', 'coxão mole', 0.99, 1, 1, true, true),
('Coxão Duro KG', 'coxao duro kg', 'alimento', 'coxão duro', 0.99, 1, 1, true, true),
('Paleta Bovina KG', 'paleta bovina kg', 'alimento', 'paleta bovina', 0.99, 1, 1, true, true),
('Costela Bovina KG', 'costela bovina kg', 'alimento', 'costela bovina', 0.99, 1, 1, true, true),
('Rabada KG', 'rabada kg', 'alimento', 'rabada', 0.99, 1, 1, true, true),
('Carne Seca KG', 'carne seca kg', 'alimento', 'carne seca', 0.99, 1, 1, true, true),
('Charque KG', 'charque kg', 'alimento', 'charque', 0.99, 1, 1, true, true),
('Bife KG', 'bife kg', 'alimento', 'carne bovina', 0.99, 1, 1, true, true),
('Carne Bovina KG', 'carne bovina kg', 'alimento', 'carne bovina', 0.99, 1, 1, true, true),
('Carne Para Churrasco', 'carne para churrasco', 'alimento', 'carne bovina', 0.99, 1, 1, true, true),

-- =============================================================================
-- PROTEÍNAS — SUÍNA
-- =============================================================================
('Costelinha Porco KG', 'costelinha porco kg', 'alimento', 'costelinha de porco', 0.99, 1, 1, true, true),
('Costelinha de Porco KG', 'costelinha de porco kg', 'alimento', 'costelinha de porco', 0.99, 1, 1, true, true),
('Lombo Suino KG', 'lombo suino kg', 'alimento', 'lombo suíno', 0.99, 1, 1, true, true),
('Lombo Suíno KG', 'lombo suino kg', 'alimento', 'lombo suíno', 0.99, 1, 1, true, true),
('Pernil Suino KG', 'pernil suino kg', 'alimento', 'pernil suíno', 0.99, 1, 1, true, true),
('Bacon Fatiado', 'bacon fatiado', 'alimento', 'bacon', 0.99, 1, 1, true, true),
('Bacon KG', 'bacon kg', 'alimento', 'bacon', 0.99, 1, 1, true, true),
('Bacon Sadia', 'bacon sadia', 'alimento', 'bacon', 0.99, 1, 1, true, true),
('Linguica Calabresa KG', 'linguica calabresa kg', 'alimento', 'linguiça calabresa', 0.99, 1, 1, true, true),
('Linguiça Calabresa KG', 'linguica calabresa kg', 'alimento', 'linguiça calabresa', 0.99, 1, 1, true, true),
('Linguica Toscana KG', 'linguica toscana kg', 'alimento', 'linguiça toscana', 0.99, 1, 1, true, true),
('Linguica Defumada KG', 'linguica defumada kg', 'alimento', 'linguiça defumada', 0.99, 1, 1, true, true),
('Paio Sadia', 'paio sadia', 'alimento', 'paio', 0.99, 1, 1, true, true),
('Torresmo KG', 'torresmo kg', 'alimento', 'torresmo', 0.99, 1, 1, true, true),
('Toucinho KG', 'toucinho kg', 'alimento', 'toucinho', 0.99, 1, 1, true, true),
('Presunto Fatiado', 'presunto fatiado', 'alimento', 'presunto', 0.99, 1, 1, true, true),

-- =============================================================================
-- FRUTOS DO MAR
-- =============================================================================
('Tilapia Cong KG', 'tilapia cong kg', 'alimento', 'tilápia', 0.99, 1, 1, true, true),
('Tilápia KG', 'tilapia kg', 'alimento', 'tilápia', 0.99, 1, 1, true, true),
('Salmao KG', 'salmao kg', 'alimento', 'salmão', 0.99, 1, 1, true, true),
('Salmão KG', 'salmao kg', 'alimento', 'salmão', 0.99, 1, 1, true, true),
('Bacalhau KG', 'bacalhau kg', 'alimento', 'bacalhau', 0.99, 1, 1, true, true),
('Camarao KG', 'camarao kg', 'alimento', 'camarão', 0.99, 1, 1, true, true),
('Camarão KG', 'camarao kg', 'alimento', 'camarão', 0.99, 1, 1, true, true),
('Atum Lata', 'atum lata', 'alimento', 'atum em lata', 0.99, 1, 1, true, true),
('Atum Em Oleo Lata', 'atum em oleo lata', 'alimento', 'atum em lata', 0.99, 1, 1, true, true),
('Sardinha Lata', 'sardinha lata', 'alimento', 'sardinha', 0.99, 1, 1, true, true),
('Merluza Cong KG', 'merluza cong kg', 'alimento', 'merluza', 0.99, 1, 1, true, true),

-- =============================================================================
-- LATICÍNIOS
-- =============================================================================
('Leite Integral', 'leite integral', 'alimento', 'leite', 0.99, 1, 1, true, true),
('Leite Integral 1L', 'leite integral 1l', 'alimento', 'leite', 0.99, 1, 1, true, true),
('Leite Italac Int', 'leite italac int', 'alimento', 'leite', 0.99, 1, 1, true, true),
('Leite Piracanjuba Int', 'leite piracanjuba int', 'alimento', 'leite', 0.99, 1, 1, true, true),
('Leite Ninho 1L', 'leite ninho 1l', 'alimento', 'leite', 0.99, 1, 1, true, true),
('Leite Desnatado 1L', 'leite desnatado 1l', 'alimento', 'leite desnatado', 0.99, 1, 1, true, true),
('Leite Semidesnatado', 'leite semidesnatado', 'alimento', 'leite semidesnatado', 0.99, 1, 1, true, true),
('Leite Condensado Moca', 'leite condensado moca', 'alimento', 'leite condensado', 0.99, 1, 1, true, true),
('Leite Condensado 395G', 'leite condensado 395g', 'alimento', 'leite condensado', 0.99, 1, 1, true, true),
('Creme de Leite Neslte 200G', 'creme de leite neslte 200g', 'alimento', 'creme de leite', 0.99, 1, 1, true, true),
('Creme de Leite 200G', 'creme de leite 200g', 'alimento', 'creme de leite', 0.99, 1, 1, true, true),
('Creme De Leite Lata', 'creme de leite lata', 'alimento', 'creme de leite', 0.99, 1, 1, true, true),
('Leite de Coco 200ML', 'leite de coco 200ml', 'alimento', 'leite de coco', 0.99, 1, 1, true, true),
('Leite de Coco Lata', 'leite de coco lata', 'alimento', 'leite de coco', 0.99, 1, 1, true, true),
('Manteiga Aviacao 200G', 'manteiga aviacao 200g', 'alimento', 'manteiga', 0.99, 1, 1, true, true),
('Manteiga Aviação 200G', 'manteiga aviacao 200g', 'alimento', 'manteiga', 0.99, 1, 1, true, true),
('Manteiga Qualy 200G', 'manteiga qualy 200g', 'alimento', 'manteiga', 0.99, 1, 1, true, true),
('Manteiga Presidente 200G', 'manteiga presidente 200g', 'alimento', 'manteiga', 0.99, 1, 1, true, true),
('Manteiga Com Sal', 'manteiga com sal', 'alimento', 'manteiga', 0.99, 1, 1, true, true),
('Manteiga Sem Sal', 'manteiga sem sal', 'alimento', 'manteiga sem sal', 0.99, 1, 1, true, true),
('Margarina Qualy 500G', 'margarina qualy 500g', 'alimento', 'margarina', 0.99, 1, 1, true, true),
('Margarina 500G', 'margarina 500g', 'alimento', 'margarina', 0.99, 1, 1, true, true),
('Queijo Mussarela KG', 'queijo mussarela kg', 'alimento', 'queijo mussarela', 0.99, 1, 1, true, true),
('Queijo Mussarela Fatiado', 'queijo mussarela fatiado', 'alimento', 'queijo mussarela', 0.99, 1, 1, true, true),
('Queijo Parmesao 100G', 'queijo parmesao 100g', 'alimento', 'queijo parmesão', 0.99, 1, 1, true, true),
('Queijo Parmesão Ralado', 'queijo parmesao ralado', 'alimento', 'queijo parmesão', 0.99, 1, 1, true, true),
('Queijo Prato Fatiado', 'queijo prato fatiado', 'alimento', 'queijo prato', 0.99, 1, 1, true, true),
('Queijo Prato KG', 'queijo prato kg', 'alimento', 'queijo prato', 0.99, 1, 1, true, true),
('Queijo Coalho KG', 'queijo coalho kg', 'alimento', 'queijo coalho', 0.99, 1, 1, true, true),
('Queijo Coalho Bd', 'queijo coalho bd', 'alimento', 'queijo coalho', 0.99, 1, 1, true, true),
('Queijo Mineiro KG', 'queijo mineiro kg', 'alimento', 'queijo minas', 0.99, 1, 1, true, true),
('Queijo Minas Frescal', 'queijo minas frescal', 'alimento', 'queijo minas', 0.99, 1, 1, true, true),
('Cream Cheese 150G', 'cream cheese 150g', 'alimento', 'cream cheese', 0.99, 1, 1, true, true),
('Requeijao 200G', 'requeijao 200g', 'alimento', 'requeijão', 0.99, 1, 1, true, true),
('Requeijão Cremoso', 'requeijao cremoso', 'alimento', 'requeijão', 0.99, 1, 1, true, true),
('Iogurte Natural 170G', 'iogurte natural 170g', 'alimento', 'iogurte', 0.99, 1, 1, true, true),
('Iogurte Grego 100G', 'iogurte grego 100g', 'alimento', 'iogurte grego', 0.99, 1, 1, true, true),
('Iog Batido Morango', 'iog batido morango', 'alimento', 'iogurte', 0.99, 1, 1, true, true),
('Ricota 250G', 'ricota 250g', 'alimento', 'ricota', 0.99, 1, 1, true, true),
('Coalhada Seca 200G', 'coalhada seca 200g', 'alimento', 'coalhada', 0.99, 1, 1, true, true),

-- =============================================================================
-- OVOS
-- =============================================================================
('Ovos Caipira Naturegg Verm C/10', 'ovos caipira naturegg verm c10', 'alimento', 'ovo', 0.99, 1, 1, true, true),
('Ovos Brancos C/12', 'ovos brancos c12', 'alimento', 'ovo', 0.99, 1, 1, true, true),
('Ovos Caipira C/10', 'ovos caipira c10', 'alimento', 'ovo', 0.99, 1, 1, true, true),
('Ovos Vermelho C/12', 'ovos vermelho c12', 'alimento', 'ovo', 0.99, 1, 1, true, true),
('Ovos Grandes C/6', 'ovos grandes c6', 'alimento', 'ovo', 0.99, 1, 1, true, true),
('Ovo Bdj', 'ovo bdj', 'alimento', 'ovo', 0.99, 1, 1, true, true),
('Ovos Organicos C/6', 'ovos organicos c6', 'alimento', 'ovo', 0.99, 1, 1, true, true),
('Ovos Codorna C/24', 'ovos codorna c24', 'alimento', 'ovo de codorna', 0.99, 1, 1, true, true),

-- =============================================================================
-- GRÃOS E CARBOIDRATOS
-- =============================================================================
('Arroz Branco 5KG', 'arroz branco 5kg', 'alimento', 'arroz', 0.99, 1, 1, true, true),
('Arroz Broto Legal 5Kg', 'arroz broto legal 5kg', 'alimento', 'arroz', 0.99, 1, 1, true, true),
('Arroz Tio Joao 5KG', 'arroz tio joao 5kg', 'alimento', 'arroz', 0.99, 1, 1, true, true),
('Arroz Camil 5KG', 'arroz camil 5kg', 'alimento', 'arroz', 0.99, 1, 1, true, true),
('Arroz Integral 2KG', 'arroz integral 2kg', 'alimento', 'arroz integral', 0.99, 1, 1, true, true),
('ARROZ INTEGRAL 2KG', 'arroz integral 2kg', 'alimento', 'arroz integral', 0.99, 1, 1, true, true),
('Arroz Parboilizado 5KG', 'arroz parboilizado 5kg', 'alimento', 'arroz parboilizado', 0.99, 1, 1, true, true),
('Feijao Carioca 1KG', 'feijao carioca 1kg', 'alimento', 'feijão carioca', 0.99, 1, 1, true, true),
('FEIJÃO CARIOCA 1KG', 'feijao carioca 1kg', 'alimento', 'feijão carioca', 0.99, 1, 1, true, true),
('Feijão Carioca 1KG', 'feijao carioca 1kg', 'alimento', 'feijão carioca', 0.99, 1, 1, true, true),
('Feijao Preto 1KG', 'feijao preto 1kg', 'alimento', 'feijão preto', 0.99, 1, 1, true, true),
('Feijão Preto 1KG', 'feijao preto 1kg', 'alimento', 'feijão preto', 0.99, 1, 1, true, true),
('Feijao Mulatinho 1KG', 'feijao mulatinho 1kg', 'alimento', 'feijão mulatinho', 0.99, 1, 1, true, true),
('Feijao Verde 1KG', 'feijao verde 1kg', 'alimento', 'feijão verde', 0.99, 1, 1, true, true),
('Grao de Bico 500G', 'grao de bico 500g', 'alimento', 'grão-de-bico', 0.99, 1, 1, true, true),
('Lentilha 500G', 'lentilha 500g', 'alimento', 'lentilha', 0.99, 1, 1, true, true),
('Ervilha Seca 500G', 'ervilha seca 500g', 'alimento', 'ervilha seca', 0.99, 1, 1, true, true),
('Milho Verde Enlatado', 'milho verde enlatado', 'alimento', 'milho verde', 0.99, 1, 1, true, true),
('Milho Verde Lata 200G', 'milho verde lata 200g', 'alimento', 'milho verde', 0.99, 1, 1, true, true),
('Milho Verde Espiga Bdj', 'milho verde espiga bdj', 'alimento', 'milho', 0.99, 1, 1, true, true),
('Milho Verde Espiga Bdj.', 'milho verde espiga bdj', 'alimento', 'milho', 0.99, 1, 1, true, true),

-- =============================================================================
-- FARINHAS E MASSAS
-- =============================================================================
('Farinha de Trigo 1KG', 'farinha de trigo 1kg', 'alimento', 'farinha de trigo', 0.99, 1, 1, true, true),
('Farinha Trigo 1KG', 'farinha trigo 1kg', 'alimento', 'farinha de trigo', 0.99, 1, 1, true, true),
('Farinha de Mandioca 500G', 'farinha de mandioca 500g', 'alimento', 'farinha de mandioca', 0.99, 1, 1, true, true),
('Farinha Mandioca 500G', 'farinha mandioca 500g', 'alimento', 'farinha de mandioca', 0.99, 1, 1, true, true),
('Fuba 1KG', 'fuba 1kg', 'alimento', 'fubá', 0.99, 1, 1, true, true),
('Fubá 1KG', 'fuba 1kg', 'alimento', 'fubá', 0.99, 1, 1, true, true),
('Polvilho Azedo 500G', 'polvilho azedo 500g', 'alimento', 'polvilho azedo', 0.99, 1, 1, true, true),
('Polvilho Doce 500G', 'polvilho doce 500g', 'alimento', 'polvilho doce', 0.99, 1, 1, true, true),
('Farinha de Rosca 500G', 'farinha de rosca 500g', 'alimento', 'farinha de rosca', 0.99, 1, 1, true, true),
('Amido de Milho 500G', 'amido de milho 500g', 'alimento', 'amido de milho', 0.99, 1, 1, true, true),
('Maizena 500G', 'maizena 500g', 'alimento', 'amido de milho', 0.99, 1, 1, true, true),
('Macarrao Espaguete 500G', 'macarrao espaguete 500g', 'alimento', 'macarrão espaguete', 0.99, 1, 1, true, true),
('Macarrão Espaguete 500G', 'macarrao espaguete 500g', 'alimento', 'macarrão espaguete', 0.99, 1, 1, true, true),
('Macarrao Parafuso 500G', 'macarrao parafuso 500g', 'alimento', 'macarrão parafuso', 0.99, 1, 1, true, true),
('Macarrao Penne 500G', 'macarrao penne 500g', 'alimento', 'macarrão penne', 0.99, 1, 1, true, true),
('Massa de Lasanha 500G', 'massa de lasanha 500g', 'alimento', 'lasanha', 0.99, 1, 1, true, true),
('Macarrao Cabelo Anjo', 'macarrao cabelo anjo', 'alimento', 'macarrão', 0.99, 1, 1, true, true),
('Aveia em Flocos 500G', 'aveia em flocos 500g', 'alimento', 'aveia', 0.99, 1, 1, true, true),
('Aveia Flocos 500G', 'aveia flocos 500g', 'alimento', 'aveia', 0.99, 1, 1, true, true),
('Aveia Quaker 500G', 'aveia quaker 500g', 'alimento', 'aveia', 0.99, 1, 1, true, true),
('Farofa Pronta 500G', 'farofa pronta 500g', 'alimento', 'farofa', 0.99, 1, 1, true, true),
('Tapioca 500G', 'tapioca 500g', 'alimento', 'tapioca', 0.99, 1, 1, true, true),
('Cuscuz 500G', 'cuscuz 500g', 'alimento', 'cuscuz', 0.99, 1, 1, true, true),

-- =============================================================================
-- ÓLEOS E GORDURAS
-- =============================================================================
('Oleo de Soja 900ML', 'oleo de soja 900ml', 'alimento', 'óleo de soja', 0.99, 1, 1, true, true),
('ÓLEO DE SOJA 900ML', 'oleo de soja 900ml', 'alimento', 'óleo de soja', 0.99, 1, 1, true, true),
('Oleo Soja 900ML', 'oleo soja 900ml', 'alimento', 'óleo de soja', 0.99, 1, 1, true, true),
('Óleo de Soja 900ML', 'oleo de soja 900ml', 'alimento', 'óleo de soja', 0.99, 1, 1, true, true),
('Oleo de Girassol 900ML', 'oleo de girassol 900ml', 'alimento', 'óleo de girassol', 0.99, 1, 1, true, true),
('Azeite Extra Virgem 500ML', 'azeite extra virgem 500ml', 'alimento', 'azeite de oliva', 0.99, 1, 1, true, true),
('Azeite Oliva 500ML', 'azeite oliva 500ml', 'alimento', 'azeite de oliva', 0.99, 1, 1, true, true),
('Oleo de Coco 200ML', 'oleo de coco 200ml', 'alimento', 'óleo de coco', 0.99, 1, 1, true, true),
('Banha de Porco 500G', 'banha de porco 500g', 'alimento', 'banha de porco', 0.99, 1, 1, true, true),

-- =============================================================================
-- VEGETAIS — FOLHAS E ERVAS
-- =============================================================================
('Cheiro Verde UN', 'cheiro verde un', 'alimento', 'cheiro verde', 0.99, 1, 1, true, true),
('Cheiro- Verde UN', 'cheiro verde un', 'alimento', 'cheiro verde', 0.99, 1, 1, true, true),
('Cheiro- Verde Un', 'cheiro verde un', 'alimento', 'cheiro verde', 0.99, 1, 1, true, true),
('Cheiro Verde KG', 'cheiro verde kg', 'alimento', 'cheiro verde', 0.99, 1, 1, true, true),
('Cheiro-Verde', 'cheiro verde', 'alimento', 'cheiro verde', 0.99, 1, 1, true, true),
('Coentro UN', 'coentro un', 'alimento', 'coentro', 0.99, 1, 1, true, true),
('Coentro KG', 'coentro kg', 'alimento', 'coentro', 0.99, 1, 1, true, true),
('Salsinha UN', 'salsinha un', 'alimento', 'salsinha', 0.99, 1, 1, true, true),
('Salsa UN', 'salsa un', 'alimento', 'salsinha', 0.99, 1, 1, true, true),
('Cebolinha UN', 'cebolinha un', 'alimento', 'cebolinha', 0.99, 1, 1, true, true),
('Cebolinha KG', 'cebolinha kg', 'alimento', 'cebolinha', 0.99, 1, 1, true, true),
('Alface Crespa UN', 'alface crespa un', 'alimento', 'alface', 0.99, 1, 1, true, true),
('Alface Lisa UN', 'alface lisa un', 'alimento', 'alface', 0.99, 1, 1, true, true),
('Alface Americana UN', 'alface americana un', 'alimento', 'alface', 0.99, 1, 1, true, true),
('Espinafre UN', 'espinafre un', 'alimento', 'espinafre', 0.99, 1, 1, true, true),
('Rucula UN', 'rucula un', 'alimento', 'rúcula', 0.99, 1, 1, true, true),
('Rúcula KG', 'rucula kg', 'alimento', 'rúcula', 0.99, 1, 1, true, true),
('Couve Manteiga Maco', 'couve manteiga maco', 'alimento', 'couve', 0.99, 1, 1, true, true),
('Couve Maco', 'couve maco', 'alimento', 'couve', 0.99, 1, 1, true, true),
('Repolho UN', 'repolho un', 'alimento', 'repolho', 0.99, 1, 1, true, true),
('Repolho Roxo UN', 'repolho roxo un', 'alimento', 'repolho roxo', 0.99, 1, 1, true, true),
('Brocolis UN', 'brocolis un', 'alimento', 'brócolis', 0.99, 1, 1, true, true),
('Brócolis UN', 'brocolis un', 'alimento', 'brócolis', 0.99, 1, 1, true, true),
('Couve Flor UN', 'couve flor un', 'alimento', 'couve-flor', 0.99, 1, 1, true, true),
('Couve-Flor UN', 'couve flor un', 'alimento', 'couve-flor', 0.99, 1, 1, true, true),
('Manjericao UN', 'manjericao un', 'alimento', 'manjericão', 0.99, 1, 1, true, true),
('Hortelã UN', 'hortela un', 'alimento', 'hortelã', 0.99, 1, 1, true, true),
('Louro UN', 'louro un', 'alimento', 'folha de louro', 0.99, 1, 1, true, true),

-- =============================================================================
-- VEGETAIS — RAÍZES E TUBÉRCULOS
-- =============================================================================
('Batata KG', 'batata kg', 'alimento', 'batata', 0.99, 1, 1, true, true),
('Batata Inglesa KG', 'batata inglesa kg', 'alimento', 'batata', 0.99, 1, 1, true, true),
('Batata Doce KG', 'batata doce kg', 'alimento', 'batata doce', 0.99, 1, 1, true, true),
('Batata Doce Roxa KG', 'batata doce roxa kg', 'alimento', 'batata doce roxa', 0.99, 1, 1, true, true),
('Mandioca KG', 'mandioca kg', 'alimento', 'mandioca', 0.99, 1, 1, true, true),
('Mandioca Cong KG', 'mandioca cong kg', 'alimento', 'mandioca', 0.99, 1, 1, true, true),
('Mandioquinha KG', 'mandioquinha kg', 'alimento', 'mandioquinha', 0.99, 1, 1, true, true),
('Cenoura KG', 'cenoura kg', 'alimento', 'cenoura', 0.99, 1, 1, true, true),
('Cenoura Bdj', 'cenoura bdj', 'alimento', 'cenoura', 0.99, 1, 1, true, true),
('Beterraba KG', 'beterraba kg', 'alimento', 'beterraba', 0.99, 1, 1, true, true),
('Beterraba Bdj', 'beterraba bdj', 'alimento', 'beterraba', 0.99, 1, 1, true, true),
('Nabo KG', 'nabo kg', 'alimento', 'nabo', 0.99, 1, 1, true, true),
('Inhame KG', 'inhame kg', 'alimento', 'inhame', 0.99, 1, 1, true, true),
('Cará KG', 'cara kg', 'alimento', 'cará', 0.99, 1, 1, true, true),

-- =============================================================================
-- VEGETAIS — CEBOLA, ALHO E PIMENTAS
-- =============================================================================
('Cebola KG', 'cebola kg', 'alimento', 'cebola', 0.99, 1, 1, true, true),
('Cebola Kg', 'cebola kg', 'alimento', 'cebola', 0.99, 1, 1, true, true),
('Cebola Roxa KG', 'cebola roxa kg', 'alimento', 'cebola roxa', 0.99, 1, 1, true, true),
('Cebola Bdj', 'cebola bdj', 'alimento', 'cebola', 0.99, 1, 1, true, true),
('Alho KG', 'alho kg', 'alimento', 'alho', 0.99, 1, 1, true, true),
('Alho Cabeca UN', 'alho cabeca un', 'alimento', 'alho', 0.99, 1, 1, true, true),
('Alho Granulado 30G', 'alho granulado 30g', 'alimento', 'alho', 0.99, 1, 1, true, true),
('Alho Poco UN', 'alho poco un', 'alimento', 'alho-poró', 0.99, 1, 1, true, true),
('Alho-Poro UN', 'alho poro un', 'alimento', 'alho-poró', 0.99, 1, 1, true, true),
('Pimentao Vermelho KG', 'pimentao vermelho kg', 'alimento', 'pimentão vermelho', 0.99, 1, 1, true, true),
('Pimentão Vermelho KG', 'pimentao vermelho kg', 'alimento', 'pimentão vermelho', 0.99, 1, 1, true, true),
('Pimentao Amarelo KG', 'pimentao amarelo kg', 'alimento', 'pimentão amarelo', 0.99, 1, 1, true, true),
('Pimentao Verde KG', 'pimentao verde kg', 'alimento', 'pimentão verde', 0.99, 1, 1, true, true),
('Pimenta Dedo de Moca', 'pimenta dedo de moca', 'alimento', 'pimenta dedo-de-moça', 0.99, 1, 1, true, true),
('Pimenta Biquinho', 'pimenta biquinho', 'alimento', 'pimenta biquinho', 0.99, 1, 1, true, true),

-- =============================================================================
-- VEGETAIS — TOMATE E OUTROS
-- =============================================================================
('Tomate KG', 'tomate kg', 'alimento', 'tomate', 0.99, 1, 1, true, true),
('Tomate Cereja Bdj', 'tomate cereja bdj', 'alimento', 'tomate cereja', 0.99, 1, 1, true, true),
('Tomate Cereja Bandeja', 'tomate cereja bandeja', 'alimento', 'tomate cereja', 0.99, 1, 1, true, true),
('Tomate Grape Bdj', 'tomate grape bdj', 'alimento', 'tomate cereja', 0.99, 1, 1, true, true),
('Abobrinha UN', 'abobrinha un', 'alimento', 'abobrinha', 0.99, 1, 1, true, true),
('Abobrinha KG', 'abobrinha kg', 'alimento', 'abobrinha', 0.99, 1, 1, true, true),
('Abobora KG', 'abobora kg', 'alimento', 'abóbora', 0.99, 1, 1, true, true),
('Abóbora KG', 'abobora kg', 'alimento', 'abóbora', 0.99, 1, 1, true, true),
('Chuchu KG', 'chuchu kg', 'alimento', 'chuchu', 0.99, 1, 1, true, true),
('Berinjela KG', 'berinjela kg', 'alimento', 'berinjela', 0.99, 1, 1, true, true),
('Quiabo KG', 'quiabo kg', 'alimento', 'quiabo', 0.99, 1, 1, true, true),
('Ervilha Bdj 200G', 'ervilha bdj 200g', 'alimento', 'ervilha', 0.99, 1, 1, true, true),
('Vagem KG', 'vagem kg', 'alimento', 'vagem', 0.99, 1, 1, true, true),
('Salsao KG', 'salsao kg', 'alimento', 'salsão', 0.99, 1, 1, true, true),
('Cogumelo Paris Bdj', 'cogumelo paris bdj', 'alimento', 'cogumelo', 0.99, 1, 1, true, true),
('Cogumelo Shimeji Bdj', 'cogumelo shimeji bdj', 'alimento', 'shimeji', 0.99, 1, 1, true, true),

-- =============================================================================
-- FRUTAS
-- =============================================================================
('Banana Nanica KG', 'banana nanica kg', 'alimento', 'banana', 0.99, 1, 1, true, true),
('Banana Nanica', 'banana nanica', 'alimento', 'banana nanica', 0.99, 1, 1, true, true),
('Banana Prata KG', 'banana prata kg', 'alimento', 'banana', 0.99, 1, 1, true, true),
('Banana Da Terra KG', 'banana da terra kg', 'alimento', 'banana da terra', 0.99, 1, 1, true, true),
('Laranja KG', 'laranja kg', 'alimento', 'laranja', 0.99, 1, 1, true, true),
('Laranja Kg', 'laranja kg', 'alimento', 'laranja', 0.99, 1, 1, true, true),
('Laraganja KG', 'laraganja kg', 'alimento', 'laranja', 0.99, 1, 1, true, true),
('Laranja Pera KG', 'laranja pera kg', 'alimento', 'laranja', 0.99, 1, 1, true, true),
('Laranja Lima KG', 'laranja lima kg', 'alimento', 'laranja lima', 0.99, 1, 1, true, true),
('Limao KG', 'limao kg', 'alimento', 'limão', 0.99, 1, 1, true, true),
('Limão KG', 'limao kg', 'alimento', 'limão', 0.99, 1, 1, true, true),
('Limao Taiti KG', 'limao taiti kg', 'alimento', 'limão', 0.99, 1, 1, true, true),
('Limao Siciliano UN', 'limao siciliano un', 'alimento', 'limão siciliano', 0.99, 1, 1, true, true),
('Maca KG', 'maca kg', 'alimento', 'maçã', 0.99, 1, 1, true, true),
('Maçã KG', 'maca kg', 'alimento', 'maçã', 0.99, 1, 1, true, true),
('Maca Fuji KG', 'maca fuji kg', 'alimento', 'maçã', 0.99, 1, 1, true, true),
('Pera KG', 'pera kg', 'alimento', 'pera', 0.99, 1, 1, true, true),
('Manga KG', 'manga kg', 'alimento', 'manga', 0.99, 1, 1, true, true),
('Manga Tommy KG', 'manga tommy kg', 'alimento', 'manga', 0.99, 1, 1, true, true),
('Abacaxi UN', 'abacaxi un', 'alimento', 'abacaxi', 0.99, 1, 1, true, true),
('Morango Bdj', 'morango bdj', 'alimento', 'morango', 0.99, 1, 1, true, true),
('Morango Bandeja', 'morango bandeja', 'alimento', 'morango', 0.99, 1, 1, true, true),
('Uva Italia KG', 'uva italia kg', 'alimento', 'uva', 0.99, 1, 1, true, true),
('Uva Thompson KG', 'uva thompson kg', 'alimento', 'uva', 0.99, 1, 1, true, true),
('Caqui Bandeja', 'caqui bandeja', 'alimento', 'caqui', 0.99, 1, 1, true, true),
('Caqui Bandeija', 'caqui bandeija', 'alimento', 'caqui', 0.99, 1, 1, true, true),
('Caqui Bdj', 'caqui bdj', 'alimento', 'caqui', 0.99, 1, 1, true, true),
('Mamao Papaia KG', 'mamao papaia kg', 'alimento', 'mamão papaia', 0.99, 1, 1, true, true),
('Mamão Papaia KG', 'mamao papaia kg', 'alimento', 'mamão papaia', 0.99, 1, 1, true, true),
('Melao KG', 'melao kg', 'alimento', 'melão', 0.99, 1, 1, true, true),
('Melancia UN', 'melancia un', 'alimento', 'melancia', 0.99, 1, 1, true, true),
('Coco Verde UN', 'coco verde un', 'alimento', 'coco', 0.99, 1, 1, true, true),
('Coco Ralado 100G', 'coco ralado 100g', 'alimento', 'coco ralado', 0.99, 1, 1, true, true),
('Goiaba KG', 'goiaba kg', 'alimento', 'goiaba', 0.99, 1, 1, true, true),
('Graviola KG', 'graviola kg', 'alimento', 'graviola', 0.99, 1, 1, true, true),
('Acai 400G', 'acai 400g', 'alimento', 'açaí', 0.99, 1, 1, true, true),
('Acerola KG', 'acerola kg', 'alimento', 'acerola', 0.99, 1, 1, true, true),
('Pêssego KG', 'pessego kg', 'alimento', 'pêssego', 0.99, 1, 1, true, true),
('Maracuja KG', 'maracuja kg', 'alimento', 'maracujá', 0.99, 1, 1, true, true),
('Abacate UN', 'abacate un', 'alimento', 'abacate', 0.99, 1, 1, true, true),

-- =============================================================================
-- TEMPEROS SECOS E MOLHOS
-- =============================================================================
('Sal Refinado 1KG', 'sal refinado 1kg', 'alimento', 'sal', 0.99, 1, 1, true, true),
('Sal Marinho 500G', 'sal marinho 500g', 'alimento', 'sal', 0.99, 1, 1, true, true),
('Pimenta do Reino 50G', 'pimenta do reino 50g', 'alimento', 'pimenta-do-reino', 0.99, 1, 1, true, true),
('Pimenta-Do-Reino Moida', 'pimenta do reino moida', 'alimento', 'pimenta-do-reino', 0.99, 1, 1, true, true),
('Pimenta Caiena 30G', 'pimenta caiena 30g', 'alimento', 'pimenta caiena', 0.99, 1, 1, true, true),
('Colorau 100G', 'colorau 100g', 'alimento', 'colorau', 0.99, 1, 1, true, true),
('Coloral 100G', 'coloral 100g', 'alimento', 'colorau', 0.99, 1, 1, true, true),
('Curcuma 50G', 'curcuma 50g', 'alimento', 'cúrcuma', 0.99, 1, 1, true, true),
('Açafrão 50G', 'acafrao 50g', 'alimento', 'cúrcuma', 0.99, 1, 1, true, true),
('Cominho 50G', 'cominho 50g', 'alimento', 'cominho', 0.99, 1, 1, true, true),
('Oregano 30G', 'oregano 30g', 'alimento', 'orégano', 0.99, 1, 1, true, true),
('Orégano 30G', 'oregano 30g', 'alimento', 'orégano', 0.99, 1, 1, true, true),
('Tempero Baiano 50G', 'tempero baiano 50g', 'alimento', 'tempero baiano', 0.99, 1, 1, true, true),
('Chimichurri 50G', 'chimichurri 50g', 'alimento', 'chimichurri', 0.99, 1, 1, true, true),
('Caldo Carne Knorr', 'caldo carne knorr', 'alimento', 'caldo de carne', 0.99, 1, 1, true, true),
('Caldo Legumes Knorr', 'caldo legumes knorr', 'alimento', 'caldo de legumes', 0.99, 1, 1, true, true),
('Caldo Frango Knorr', 'caldo frango knorr', 'alimento', 'caldo de frango', 0.99, 1, 1, true, true),
('Extrato de Tomate 340G', 'extrato de tomate 340g', 'alimento', 'extrato de tomate', 0.99, 1, 1, true, true),
('Molho de Tomate 340G', 'molho de tomate 340g', 'alimento', 'molho de tomate', 0.99, 1, 1, true, true),
('Molho Tomate Caixa', 'molho tomate caixa', 'alimento', 'molho de tomate', 0.99, 1, 1, true, true),
('Shoyu 150ML', 'shoyu 150ml', 'alimento', 'shoyu', 0.99, 1, 1, true, true),
('Molho Shoyu 150ML', 'molho shoyu 150ml', 'alimento', 'shoyu', 0.99, 1, 1, true, true),
('Vinagre Tinto 750ML', 'vinagre tinto 750ml', 'alimento', 'vinagre', 0.99, 1, 1, true, true),
('Vinagre Branco 750ML', 'vinagre branco 750ml', 'alimento', 'vinagre', 0.99, 1, 1, true, true),
('Mostarda 200G', 'mostarda 200g', 'alimento', 'mostarda', 0.99, 1, 1, true, true),
('Maionese 500G', 'maionese 500g', 'alimento', 'maionese', 0.99, 1, 1, true, true),
('Ketchup 397G', 'ketchup 397g', 'alimento', 'ketchup', 0.99, 1, 1, true, true),
('Tabasco 60ML', 'tabasco 60ml', 'alimento', 'molho de pimenta', 0.99, 1, 1, true, true),
('Molho de Pimenta 150ML', 'molho de pimenta 150ml', 'alimento', 'molho de pimenta', 0.99, 1, 1, true, true),
('Gengibre KG', 'gengibre kg', 'alimento', 'gengibre', 0.99, 1, 1, true, true),
('Gengibre UN', 'gengibre un', 'alimento', 'gengibre', 0.99, 1, 1, true, true),
('Canela Po 30G', 'canela po 30g', 'alimento', 'canela em pó', 0.99, 1, 1, true, true),
('Canela Pau', 'canela pau', 'alimento', 'canela em pau', 0.99, 1, 1, true, true),
('Cravo 10G', 'cravo 10g', 'alimento', 'cravo', 0.99, 1, 1, true, true),
('Noz Moscada 30G', 'noz moscada 30g', 'alimento', 'noz-moscada', 0.99, 1, 1, true, true),

-- =============================================================================
-- PÃES E PANIFICAÇÃO
-- =============================================================================
('Pao Frances', 'pao frances', 'alimento', 'pão francês', 0.99, 1, 1, true, true),
('Pao Frances KG', 'pao frances kg', 'alimento', 'pão francês', 0.99, 1, 1, true, true),
('Pao de Forma 500G', 'pao de forma 500g', 'alimento', 'pão de forma', 0.99, 1, 1, true, true),
('Pao de Forma Wickbold', 'pao de forma wickbold', 'alimento', 'pão de forma', 0.99, 1, 1, true, true),
('Pao Integral 500G', 'pao integral 500g', 'alimento', 'pão integral', 0.99, 1, 1, true, true),
('Pao de Queijo Congelado', 'pao de queijo congelado', 'alimento', 'pão de queijo', 0.99, 1, 1, true, true),
('Pao De Queijo Massa Boa 1Kg', 'pao de queijo massa boa 1kg', 'alimento', 'pão de queijo', 0.99, 1, 1, true, true),
('Pao de Mel Lune', 'pao de mel lune', 'alimento', 'pão de mel', 0.99, 1, 1, true, true),
('Pão de Mel Lune', 'pao de mel lune', 'alimento', 'pão de mel', 0.99, 1, 1, true, true),
('Bisnaguinha 200G', 'bisnaguinha 200g', 'alimento', 'bisnaguinha', 0.99, 1, 1, true, true),
('Torrada 200G', 'torrada 200g', 'alimento', 'torrada', 0.99, 1, 1, true, true),
('Fermento Biologico 15G', 'fermento biologico 15g', 'alimento', 'fermento biológico', 0.99, 1, 1, true, true),
('Fermento Po 100G', 'fermento po 100g', 'alimento', 'fermento em pó', 0.99, 1, 1, true, true),
('Bicarbonato Sodio 100G', 'bicarbonato sodio 100g', 'alimento', 'bicarbonato de sódio', 0.99, 1, 1, true, true),

-- =============================================================================
-- AÇÚCAR E DOCES
-- =============================================================================
('Acucar Cristal 1KG', 'acucar cristal 1kg', 'alimento', 'açúcar', 0.99, 1, 1, true, true),
('Açúcar Cristal 1KG', 'acucar cristal 1kg', 'alimento', 'açúcar', 0.99, 1, 1, true, true),
('Acucar Refinado 1KG', 'acucar refinado 1kg', 'alimento', 'açúcar', 0.99, 1, 1, true, true),
('Acucar Demerara 1KG', 'acucar demerara 1kg', 'alimento', 'açúcar demerara', 0.99, 1, 1, true, true),
('Acucar Mascavo 500G', 'acucar mascavo 500g', 'alimento', 'açúcar mascavo', 0.99, 1, 1, true, true),
('Mel 300G', 'mel 300g', 'alimento', 'mel', 0.99, 1, 1, true, true),
('Mel de Abelha 250G', 'mel de abelha 250g', 'alimento', 'mel', 0.99, 1, 1, true, true),
('Melado de Cana 300ML', 'melado de cana 300ml', 'alimento', 'melado', 0.99, 1, 1, true, true),
('Chocolate Ao Leite 100G', 'chocolate ao leite 100g', 'alimento', 'chocolate ao leite', 0.99, 1, 1, true, true),
('Choc Classic Ao Leite', 'choc classic ao leite', 'alimento', 'chocolate ao leite', 0.99, 1, 1, true, true),
('Chocolate Em Po 400G', 'chocolate em po 400g', 'alimento', 'chocolate em pó', 0.99, 1, 1, true, true),
('Achocolatado Nescau 400G', 'achocolatado nescau 400g', 'alimento', 'chocolate em pó', 0.99, 1, 1, true, true),
('Cacau Po 100G', 'cacau po 100g', 'alimento', 'cacau em pó', 0.99, 1, 1, true, true),
('Doce de Leite 400G', 'doce de leite 400g', 'alimento', 'doce de leite', 0.99, 1, 1, true, true),
('Geleia de Morango 280G', 'geleia de morango 280g', 'alimento', 'geleia', 0.99, 1, 1, true, true),
('Granulado Chocolate', 'granulado chocolate', 'alimento', 'granulado', 0.99, 1, 1, true, true),

-- =============================================================================
-- ENLATADOS E CONSERVAS
-- =============================================================================
('Milho Verde Lata Bonduelle', 'milho verde lata bonduelle', 'alimento', 'milho verde', 0.99, 1, 1, true, true),
('Ervilha Lata Bonduelle', 'ervilha lata bonduelle', 'alimento', 'ervilha', 0.99, 1, 1, true, true),
('Palmito Vidro 300G', 'palmito vidro 300g', 'alimento', 'palmito', 0.99, 1, 1, true, true),
('Azeitona Verde Vidro', 'azeitona verde vidro', 'alimento', 'azeitona', 0.99, 1, 1, true, true),
('Azeitona Preta Vidro', 'azeitona preta vidro', 'alimento', 'azeitona preta', 0.99, 1, 1, true, true),
('Tomate Pelado Lata 400G', 'tomate pelado lata 400g', 'alimento', 'tomate pelado', 0.99, 1, 1, true, true),
('Passata de Tomate 680G', 'passata de tomate 680g', 'alimento', 'molho de tomate', 0.99, 1, 1, true, true),

-- =============================================================================
-- NÃO ALIMENTOS — classificar para excluir de receitas
-- =============================================================================
('Detergente Ype 500ML', 'detergente ype 500ml', 'nao_alimento', NULL, 0.99, 1, 0, false, true),
('Sabao Em Po Ariel 1KG', 'sabao em po ariel 1kg', 'nao_alimento', NULL, 0.99, 1, 0, false, true),
('Shampoo Elseve 400ML', 'shampoo elseve 400ml', 'nao_alimento', NULL, 0.99, 1, 0, false, true),
('Condicionador 400ML', 'condicionador 400ml', 'nao_alimento', NULL, 0.99, 1, 0, false, true),
('Papel Higienico Neve', 'papel higienico neve', 'nao_alimento', NULL, 0.99, 1, 0, false, true),
('Fralda Pampers', 'fralda pampers', 'nao_alimento', NULL, 0.99, 1, 0, false, true),
('Absorvente Always', 'absorvente always', 'nao_alimento', NULL, 0.99, 1, 0, false, true),
('Agua Mineral 500ML', 'agua mineral 500ml', 'nao_alimento', NULL, 0.85, 1, 0, false, true),
('Refrigerante Coca Cola', 'refrigerante coca cola', 'nao_alimento', NULL, 0.90, 1, 0, false, true),
('Cerveja Lata 350ML', 'cerveja lata 350ml', 'alimento', 'cerveja', 0.99, 1, 1, true, true),
('Vinho Tinto 750ML', 'vinho tinto 750ml', 'alimento', 'vinho tinto', 0.99, 1, 1, true, true),
('Vinho Branco 750ML', 'vinho branco 750ml', 'alimento', 'vinho branco', 0.99, 1, 1, true, true)

;

-- Remove duplicatas do seed (mesmo product_name) antes de inserir
INSERT INTO product_knowledge_base
  (product_name, normalized_name, categoria, canonical_ingredient, confidence_score,
   total_validacoes, validacoes_alimento, ingrediente_receita, is_active)
SELECT DISTINCT ON (product_name)
  s.product_name, s.normalized_name, s.categoria, s.canonical_ingredient,
  s.confidence_score, s.total_validacoes, s.validacoes_alimento,
  s.ingrediente_receita, s.is_active
FROM pkb_seed s
ON CONFLICT (product_name) DO UPDATE
  SET canonical_ingredient = EXCLUDED.canonical_ingredient,
      categoria = EXCLUDED.categoria,
      ingrediente_receita = EXCLUDED.ingrediente_receita
  WHERE product_knowledge_base.canonical_ingredient IS NULL
     OR product_knowledge_base.canonical_ingredient = '';

DROP TABLE pkb_seed;

-- Relatório
SELECT
  categoria,
  COUNT(*) as total,
  COUNT(canonical_ingredient) as com_canonical
FROM product_knowledge_base
GROUP BY categoria
ORDER BY total DESC;
