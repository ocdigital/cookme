import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbbreviationExpansion } from '../entities/abbreviation-expansion.entity';

// Abreviações comuns de supermercados brasileiros
// Formato: [abbr, expanded, is_ingredient, categoria]
export const SEED_ABBREVIATIONS: [string, string, boolean, string][] = [
  // Palavras completas que o OCR trunca (passthrough para evitar false negative)
  ['CHOCOL', 'chocolate', false, 'guloseimas'],
  ['CHOCLT', 'chocolate', false, 'guloseimas'],
  ['PANETTONE', 'panetone', false, 'guloseimas'],
  ['PANETT', 'panetone', false, 'guloseimas'],
  ['PANET', 'panetone', false, 'guloseimas'],
  ['BISCOITO', 'biscoito', false, 'biscoitos'],
  ['BOLACHA', 'bolacha', false, 'biscoitos'],
  ['BOLO', 'bolo', false, 'guloseimas'],
  ['TORTA', 'torta', false, 'guloseimas'],
  ['PAO', 'pão', true, 'panificação'],
  ['CAFE', 'café', true, 'bebidas'],
  ['CAFEZINHO', 'café', true, 'bebidas'],
  ['IOGURTE', 'iogurte', true, 'laticínios'],
  ['MANTEIGA', 'manteiga', true, 'laticínios'],
  ['MARGARINA', 'margarina', true, 'laticínios'],
  ['VINAGRE', 'vinagre', true, 'temperos'],
  // Palavras completas de alimentos (fallback para OCR sem abreviação)
  ['ARROZ', 'arroz', true, 'grãos'],
  ['FEIJAO', 'feijão', true, 'grãos'],
  ['FARINHA', 'farinha de trigo', true, 'farináceos'],
  ['MACARRAO', 'macarrão', true, 'massas'],
  ['AZEITE', 'azeite', true, 'óleos'],
  ['QUEIJO', 'queijo', true, 'laticínios'],
  ['FRANGO', 'frango', true, 'proteínas'],
  ['CARNE', 'carne', true, 'proteínas'],

  // Higiene — formas curtas comuns em OCR
  ['SAB', 'sabão', false, 'higiene'],
  ['CR DENT', 'creme dental', false, 'higiene'],
  ['CR TRAT', 'creme de tratamento capilar', false, 'higiene'],
  ['CR HIDRAT', 'creme hidratante', false, 'higiene'],
  ['CR CORP', 'creme corporal', false, 'higiene'],
  ['COND', 'condicionador', false, 'higiene'],
  ['DESOD', 'desodorante', false, 'higiene'],

  // Açúcar — formas OCR comuns
  ['AC', 'açúcar', true, 'temperos'],
  ['ACU', 'açúcar', true, 'temperos'],

  // Massas e grãos
  ['MAC', 'macarrão', true, 'massas'],
  ['MACAR', 'macarrão', true, 'massas'],
  ['ARR', 'arroz', true, 'grãos'],
  ['FEJ', 'feijão', true, 'grãos'],
  ['FEIJ', 'feijão', true, 'grãos'],
  ['LENT', 'lentilha', true, 'grãos'],
  ['GRAO', 'grão de bico', true, 'grãos'],
  ['AVEIA', 'aveia', true, 'grãos'],
  ['FARIN', 'farinha de trigo', true, 'farináceos'],
  ['FAR TR', 'farinha de trigo', true, 'farináceos'],
  ['FAR MIL', 'farinha de milho', true, 'farináceos'],
  ['AMID', 'amido de milho', true, 'farináceos'],
  ['FUBA', 'fubá', true, 'farináceos'],
  ['SEMOL', 'semolina', true, 'farináceos'],

  // Laticínios
  ['LEITE', 'leite', true, 'laticínios'],
  ['LT INT', 'leite integral', true, 'laticínios'],
  ['LT DESC', 'leite desnatado', true, 'laticínios'],
  ['QUEIJO', 'queijo', true, 'laticínios'],
  ['QUIJ', 'queijo', true, 'laticínios'],
  ['MOZAR', 'mussarela', true, 'laticínios'],
  ['MUSAR', 'mussarela', true, 'laticínios'],
  ['MUSSA', 'mussarela', true, 'laticínios'],
  ['PARM', 'parmesão', true, 'laticínios'],
  ['MANT', 'manteiga', true, 'laticínios'],
  ['MARG', 'margarina', true, 'laticínios'],
  ['CR LEITE', 'creme de leite', true, 'laticínios'],
  ['CREME LT', 'creme de leite', true, 'laticínios'],
  ['IOGURT', 'iogurte', true, 'laticínios'],
  ['IOGUR', 'iogurte', true, 'laticínios'],
  ['REQUEIJ', 'requeijão', true, 'laticínios'],
  ['REQUIJ', 'requeijão', true, 'laticínios'],
  ['NATA', 'nata', true, 'laticínios'],

  // Proteínas animais
  ['FRANG', 'frango', true, 'proteínas'],
  ['FRANG FILE', 'filé de frango', true, 'proteínas'],
  ['PEITO FRANG', 'peito de frango', true, 'proteínas'],
  ['COX FRANG', 'coxa de frango', true, 'proteínas'],
  ['SOBRECOXA', 'sobrecoxa de frango', true, 'proteínas'],
  ['CARNE BOV', 'carne bovina', true, 'proteínas'],
  ['CARNE MOIDA', 'carne moída', true, 'proteínas'],
  ['CARNE MOI', 'carne moída', true, 'proteínas'],
  ['PATINHO', 'patinho', true, 'proteínas'],
  ['ALCATRA', 'alcatra', true, 'proteínas'],
  ['FILE', 'filé', true, 'proteínas'],
  ['PICANHA', 'picanha', true, 'proteínas'],
  ['COSTELA', 'costela', true, 'proteínas'],
  ['BACON', 'bacon', true, 'proteínas'],
  ['LINGUICA', 'linguiça', true, 'proteínas'],
  ['LING', 'linguiça', true, 'proteínas'],
  ['SALSICHA', 'salsicha', true, 'proteínas'],
  ['PRESUNTO', 'presunto', true, 'proteínas'],
  ['APRES', 'apresuntado', true, 'proteínas'],
  ['PEIXE', 'peixe', true, 'proteínas'],
  ['SARDINHA', 'sardinha', true, 'proteínas'],
  ['ATUM', 'atum', true, 'proteínas'],
  ['CAMARO', 'camarão', true, 'proteínas'],
  ['OVO', 'ovo', true, 'proteínas'],

  // Vegetais e hortaliças
  ['TOMATE', 'tomate', true, 'vegetais'],
  ['TOM', 'tomate', true, 'vegetais'],
  ['BATATA', 'batata', true, 'vegetais'],
  ['BAT', 'batata', true, 'vegetais'],
  ['CEBOLA', 'cebola', true, 'vegetais'],
  ['CEB', 'cebola', true, 'vegetais'],
  ['ALHO', 'alho', true, 'vegetais'],
  ['CENOURA', 'cenoura', true, 'vegetais'],
  ['CEN', 'cenoura', true, 'vegetais'],
  ['PIMENT', 'pimentão', true, 'vegetais'],
  ['PIMENTAO', 'pimentão', true, 'vegetais'],
  ['ALFACE', 'alface', true, 'vegetais'],
  ['BROCOLIS', 'brócolis', true, 'vegetais'],
  ['BROC', 'brócolis', true, 'vegetais'],
  ['COUVE', 'couve', true, 'vegetais'],
  ['ESPINAF', 'espinafre', true, 'vegetais'],
  ['ABOBRINHA', 'abobrinha', true, 'vegetais'],
  ['ABOBORA', 'abóbora', true, 'vegetais'],
  ['PEPINO', 'pepino', true, 'vegetais'],
  ['MILHO', 'milho', true, 'vegetais'],
  ['ERVILHA', 'ervilha', true, 'vegetais'],
  ['MANDIOCA', 'mandioca', true, 'vegetais'],
  ['INHAME', 'inhame', true, 'vegetais'],
  ['BETERRABA', 'beterraba', true, 'vegetais'],

  // Frutas
  ['BANANA', 'banana', true, 'frutas'],
  ['BAN', 'banana', true, 'frutas'],
  ['MACA', 'maçã', true, 'frutas'],
  ['LARA', 'laranja', true, 'frutas'],
  ['LARANJA', 'laranja', true, 'frutas'],
  ['LIMAO', 'limão', true, 'frutas'],
  ['MORANGO', 'morango', true, 'frutas'],
  ['MAMAO', 'mamão', true, 'frutas'],
  ['MANGA', 'manga', true, 'frutas'],
  ['ABACATE', 'abacate', true, 'frutas'],
  ['ABACAXI', 'abacaxi', true, 'frutas'],
  ['UVA', 'uva', true, 'frutas'],
  ['MELAO', 'melão', true, 'frutas'],
  ['MELANCIA', 'melancia', true, 'frutas'],

  // Óleos e gorduras
  ['OLEO', 'óleo', true, 'óleos'],
  ['OL SOJ', 'óleo de soja', true, 'óleos'],
  ['OL MILHO', 'óleo de milho', true, 'óleos'],
  ['OL OLIVA', 'azeite de oliva', true, 'óleos'],
  ['AZEITE', 'azeite', true, 'óleos'],
  ['AZ OLIVA', 'azeite de oliva', true, 'óleos'],
  ['BANHA', 'banha', true, 'óleos'],

  // Temperos e condimentos
  ['SAL', 'sal', true, 'temperos'],
  ['ACUCAR', 'açúcar', true, 'temperos'],
  ['ACU', 'açúcar', true, 'temperos'],
  ['PIMENTA', 'pimenta', true, 'temperos'],
  ['COMINHO', 'cominho', true, 'temperos'],
  ['OREGANO', 'orégano', true, 'temperos'],
  ['LOURO', 'louro', true, 'temperos'],
  ['COLORAU', 'colorau', true, 'temperos'],
  ['COLORIF', 'colorífico', true, 'temperos'],
  ['CURCUMA', 'cúrcuma', true, 'temperos'],
  ['CANELA', 'canela', true, 'temperos'],
  ['CRAVO', 'cravo', true, 'temperos'],
  ['GENGIBRE', 'gengibre', true, 'temperos'],
  ['CALDO', 'caldo', true, 'temperos'],
  ['EXTRATO', 'extrato de tomate', true, 'temperos'],
  ['EXTR TOM', 'extrato de tomate', true, 'temperos'],
  ['MOLHO TOM', 'molho de tomate', true, 'temperos'],
  ['VINAGRE', 'vinagre', true, 'temperos'],
  ['MOSTARDA', 'mostarda', true, 'temperos'],
  ['KETCHUP', 'ketchup', true, 'temperos'],
  ['MAIONESE', 'maionese', true, 'temperos'],
  ['SHOYU', 'shoyu', true, 'temperos'],

  // Bebidas (eligíveis para receitas)
  ['LEITE COCO', 'leite de coco', true, 'bebidas'],
  ['LT COCO', 'leite de coco', true, 'bebidas'],
  ['SUCO', 'suco', true, 'bebidas'],
  ['VINHO', 'vinho', true, 'bebidas'],
  ['CALDO LG', 'caldo de legumes', true, 'bebidas'],

  // Panificação e confeitaria
  ['FERM', 'fermento', true, 'panificação'],
  ['FERM BIO', 'fermento biológico', true, 'panificação'],
  ['FERM QUI', 'fermento químico', true, 'panificação'],
  ['CACAU', 'cacau em pó', true, 'panificação'],
  ['CHOC PO', 'chocolate em pó', true, 'panificação'],
  ['BAUNILHA', 'essência de baunilha', true, 'panificação'],
  ['ESSENCIA', 'essência', true, 'panificação'],
  ['GELATINA', 'gelatina', true, 'panificação'],

  // Enlatados e conservas
  ['MILHO CONS', 'milho em conserva', true, 'conservas'],
  ['ERVILHA CONS', 'ervilha em conserva', true, 'conservas'],
  ['ATUM CONS', 'atum em conserva', true, 'conservas'],
  ['SARDINHA CONS', 'sardinha em conserva', true, 'conservas'],
  ['AZE', 'azeitona', true, 'conservas'],
  ['AZEITONA', 'azeitona', true, 'conservas'],
  ['PALMITO', 'palmito', true, 'conservas'],

  // ====== NÃO INGREDIENTES ======
  // Higiene pessoal
  ['SABONETE', 'sabonete', false, 'higiene'],
  ['SAB LIQ', 'sabonete líquido', false, 'higiene'],
  ['SHAMPO', 'shampoo', false, 'higiene'],
  ['SHAM', 'shampoo', false, 'higiene'],
  ['CONDIC', 'condicionador', false, 'higiene'],
  ['COND CAB', 'condicionador capilar', false, 'higiene'],
  ['CR DENTAL', 'creme dental', false, 'higiene'],
  ['DENTIFRICIO', 'dentifrício', false, 'higiene'],
  ['PASTA DENT', 'pasta de dente', false, 'higiene'],
  ['DESODOR', 'desodorante', false, 'higiene'],
  ['DESOD', 'desodorante', false, 'higiene'],
  ['PAPEL HIG', 'papel higiênico', false, 'higiene'],
  ['PAP HIG', 'papel higiênico', false, 'higiene'],
  ['ABSORV', 'absorvente', false, 'higiene'],
  ['FRALDA', 'fralda', false, 'higiene'],
  ['COTONETE', 'cotonete', false, 'higiene'],
  ['BARBEADOR', 'barbeador', false, 'higiene'],
  ['APARA', 'aparelho de barbear', false, 'higiene'],

  // Limpeza
  ['DET', 'detergente', false, 'limpeza'],
  ['DETER', 'detergente', false, 'limpeza'],
  ['DESINF', 'desinfetante', false, 'limpeza'],
  ['AGUA SAB', 'água sanitária', false, 'limpeza'],
  ['AG SAN', 'água sanitária', false, 'limpeza'],
  ['ALVEJ', 'alvejante', false, 'limpeza'],
  ['SABAO PO', 'sabão em pó', false, 'limpeza'],
  ['SAB PO', 'sabão em pó', false, 'limpeza'],
  ['SAB ROUPA', 'sabão para roupa', false, 'limpeza'],
  ['AMACIANTE', 'amaciante', false, 'limpeza'],
  ['AMAC', 'amaciante', false, 'limpeza'],
  ['ESPONJA', 'esponja', false, 'limpeza'],
  ['RODO', 'rodo', false, 'limpeza'],
  ['VASSOURA', 'vassoura', false, 'limpeza'],
  ['LIMPADOR', 'limpador', false, 'limpeza'],
  ['MULTIUSO', 'limpador multiuso', false, 'limpeza'],

  // Descartáveis
  ['SACO LIXO', 'saco de lixo', false, 'descartáveis'],
  ['SAC LIXO', 'saco de lixo', false, 'descartáveis'],
  ['PAPEL TOA', 'papel toalha', false, 'descartáveis'],
  ['PAP TOALHA', 'papel toalha', false, 'descartáveis'],
  ['PAPEL ADES', 'papel aderente', false, 'descartáveis'],
  ['PAPEL ALUM', 'papel alumínio', false, 'descartáveis'],
  ['PAPEL MANTEIG', 'papel manteiga', false, 'descartáveis'],

  // Biscoitos e guloseimas (não são ingredientes de culinária)
  ['BIS', 'biscoito', false, 'biscoitos'],
  ['BISC', 'biscoito', false, 'biscoitos'],
  ['BOLACHA', 'bolacha', false, 'biscoitos'],
  ['BALA', 'bala', false, 'guloseimas'],
  ['CHICLETE', 'chiclete', false, 'guloseimas'],
  ['CHOC', 'chocolate', false, 'guloseimas'],
  ['BOMBOM', 'bombom', false, 'guloseimas'],
  ['PIRULITO', 'pirulito', false, 'guloseimas'],

  // Bebidas industrializadas
  ['REFRIG', 'refrigerante', false, 'bebidas industrializadas'],
  ['REFR', 'refrigerante', false, 'bebidas industrializadas'],
  ['CERVEJA', 'cerveja', false, 'bebidas industrializadas'],
  ['CERV', 'cerveja', false, 'bebidas industrializadas'],
  ['ENERGETIC', 'energético', false, 'bebidas industrializadas'],
  ['ENERGETICO', 'energético', false, 'bebidas industrializadas'],
  ['ISOTON', 'isotônico', false, 'bebidas industrializadas'],
  ['AGUA MIN', 'água mineral', false, 'bebidas industrializadas'],
  ['AG MIN', 'água mineral', false, 'bebidas industrializadas'],

  // ====== EXPANSÃO GOLDEN SET (2026-07) ======
  // Compostos com qualificador — prefixo 2-3 tokens vence o genérico de 1 token
  // Laticínios / geladeira
  ['LEITE COND', 'leite condensado', true, 'laticínios'],
  ['LT COND', 'leite condensado', true, 'laticínios'],
  ['LEITE PO', 'leite em pó', true, 'laticínios'],
  ['LEITE FERMENTADO', 'leite fermentado', true, 'laticínios'],
  ['LEITE SOJA', 'leite de soja', true, 'laticínios'],
  ['DOCE LEITE', 'doce de leite', true, 'laticínios'],
  ['DOCE DE LEITE', 'doce de leite', true, 'laticínios'],
  ['IOG', 'iogurte', true, 'laticínios'],
  ['IOG NAT', 'iogurte natural', true, 'laticínios'],
  ['BEB LACTEA', 'bebida láctea', false, 'laticínios'],
  ['CHANTILLY', 'chantilly', true, 'laticínios'],
  ['QJO', 'queijo', true, 'laticínios'],
  ['QJO PRATO', 'queijo prato', true, 'laticínios'],
  ['QJO COALHO', 'queijo coalho', true, 'laticínios'],
  ['QJO MINAS', 'queijo minas', true, 'laticínios'],
  ['QUEIJO MINAS', 'queijo minas', true, 'laticínios'],
  ['QUEIJO PRATO', 'queijo prato', true, 'laticínios'],
  ['QUEIJO COALHO', 'queijo coalho', true, 'laticínios'],
  ['REQ', 'requeijão', true, 'laticínios'],
  // Frios / embutidos
  ['PRES', 'presunto', true, 'proteínas'],
  ['MORT', 'mortadela', true, 'proteínas'],
  ['MORTADELA', 'mortadela', true, 'proteínas'],
  ['SALAME', 'salame', true, 'proteínas'],
  ['PEITO PERU', 'peito de peru', true, 'proteínas'],
  // Carnes bovinas (cortes)
  ['CONTRA FILE', 'contra filé', true, 'proteínas'],
  ['COXAO MOLE', 'coxão mole', true, 'proteínas'],
  ['COXAO DURO', 'coxão duro', true, 'proteínas'],
  ['CUPIM', 'cupim', true, 'proteínas'],
  ['MUSCULO', 'músculo', true, 'proteínas'],
  ['FIGADO', 'fígado', true, 'proteínas'],
  ['FRALDINHA', 'fraldinha', true, 'proteínas'],
  ['MAMINHA', 'maminha', true, 'proteínas'],
  ['FILE MIGNON', 'filé mignon', true, 'proteínas'],
  ['FILE PEITO', 'peito de frango', true, 'proteínas'],
  ['FILE TILAPIA', 'filé de tilápia', true, 'proteínas'],
  ['BISTECA', 'bisteca suína', true, 'proteínas'],
  ['HAMB', 'hambúrguer', true, 'proteínas'],
  ['HAMBURGUER', 'hambúrguer', true, 'proteínas'],
  // Aves
  ['PEITO FRANGO', 'peito de frango', true, 'proteínas'],
  ['FRANGO INTEIRO', 'frango inteiro', true, 'proteínas'],
  ['ASA', 'asa de frango', true, 'proteínas'],
  ['ASA FGO', 'asa de frango', true, 'proteínas'],
  ['CORACAO FGO', 'coração de frango', true, 'proteínas'],
  ['COXA C/SOBRECOXA', 'coxa de frango', true, 'proteínas'],
  ['EMPANADO FGO', 'nuggets', true, 'proteínas'],
  ['LINGUICA CALABRESA', 'linguiça calabresa', true, 'proteínas'],
  ['LING CALABRESA', 'linguiça calabresa', true, 'proteínas'],
  ['LING TOSCANA', 'linguiça toscana', true, 'proteínas'],
  ['LINGUICA TOSCANA', 'linguiça toscana', true, 'proteínas'],
  ['LINGUICA FINA', 'linguiça de frango', true, 'proteínas'],
  // Ovos
  ['OVO CODORNA', 'ovo de codorna', true, 'proteínas'],
  ['OVOS', 'ovo', true, 'proteínas'],
  // Grãos / farináceos / massas
  ['ARROZ INTEGRAL', 'arroz integral', true, 'grãos'],
  ['ARROZ PARBOILIZADO', 'arroz parboilizado', true, 'grãos'],
  ['FEIJAO BRANCO', 'feijão branco', true, 'grãos'],
  ['FEIJAO PRETO', 'feijão preto', true, 'grãos'],
  ['FEJ PRETO', 'feijão preto', true, 'grãos'],
  ['FEJ FRADINHO', 'feijão fradinho', true, 'grãos'],
  ['FEIJAO FRADINHO', 'feijão fradinho', true, 'grãos'],
  ['FEIJAO CARIOCA', 'feijão carioca', true, 'grãos'],
  ['QUINOA', 'quinoa', true, 'grãos'],
  ['GRANOLA', 'granola', true, 'grãos'],
  ['CEREAL', 'cereal matinal', false, 'grãos'],
  ['AMENDOIM', 'amendoim', true, 'grãos'],
  ['FAR MANDIOCA', 'farinha de mandioca', true, 'farináceos'],
  ['FARINHA MANDIOCA', 'farinha de mandioca', true, 'farináceos'],
  ['POLVILHO', 'polvilho', true, 'farináceos'],
  ['POLVILHO DOCE', 'polvilho doce', true, 'farináceos'],
  ['POLVILHO AZEDO', 'polvilho azedo', true, 'farináceos'],
  ['TAPIOCA', 'tapioca', true, 'farináceos'],
  ['CANJIQUINHA', 'canjiquinha', true, 'farináceos'],
  ['MAC INST', 'macarrão instantâneo', true, 'massas'],
  ['LAMEN', 'macarrão instantâneo', true, 'massas'],
  ['MIOJO', 'macarrão instantâneo', true, 'massas'],
  ['MASSA LASANHA', 'massa de lasanha', true, 'massas'],
  ['MASSA PASTEL', 'massa de pastel', true, 'massas'],
  // Açúcares / doces / confeitaria
  ['ACUCAR CRISTAL', 'açúcar cristal', true, 'temperos'],
  ['ACUCAR MASCAVO', 'açúcar mascavo', true, 'temperos'],
  ['ACUCAR DEMERARA', 'açúcar demerara', true, 'temperos'],
  ['AC DEMERARA', 'açúcar demerara', true, 'temperos'],
  ['ACUCAR REF', 'açúcar refinado', true, 'temperos'],
  ['ACUCAR REFINADO', 'açúcar refinado', true, 'temperos'],
  ['ADOCANTE', 'adoçante', true, 'temperos'],
  ['GOIABADA', 'goiabada', false, 'guloseimas'],
  ['PACOCA', 'paçoca', false, 'guloseimas'],
  ['RAPADURA', 'rapadura', true, 'guloseimas'],
  ['RAPADURINHA', 'rapadura', true, 'guloseimas'],
  ['GELEIA', 'geleia', true, 'guloseimas'],
  ['MEL', 'mel', true, 'temperos'],
  ['COCO RALADO', 'coco ralado', true, 'panificação'],
  ['COCO', 'coco', true, 'frutas'],
  // Matinais
  ['ACHOC', 'achocolatado', false, 'bebidas'],
  ['ACHOC PO', 'achocolatado', false, 'bebidas'],
  ['ACHOCOLATADO', 'achocolatado', false, 'bebidas'],
  ['CAFE SOLUVEL', 'café solúvel', true, 'bebidas'],
  ['TORRADA', 'torrada', false, 'panificação'],
  ['BISC CREAM CRACKER', 'biscoito cream cracker', false, 'biscoitos'],
  ['BISC MAISENA', 'biscoito maisena', false, 'biscoitos'],
  // Pães
  ['PAO FRANCES', 'pão francês', true, 'panificação'],
  ['PAO DE FORMA', 'pão de forma', true, 'panificação'],
  ['PAO FORMA', 'pão de forma', true, 'panificação'],
  ['PAO QJO', 'pão de queijo', true, 'panificação'],
  ['PAO QUEIJO', 'pão de queijo', true, 'panificação'],
  ['PAO ALHO', 'pão de alho', true, 'panificação'],
  // Temperos / condimentos
  ['MAION', 'maionese', true, 'temperos'],
  ['MOLHO SHOYU', 'shoyu', true, 'temperos'],
  ['MOLHO INGLES', 'molho inglês', true, 'temperos'],
  ['MOLHO PIMENTA', 'molho de pimenta', true, 'temperos'],
  ['SAL GROSSO', 'sal grosso', true, 'temperos'],
  ['PIM', 'pimenta', true, 'temperos'],
  ['PIM REINO', 'pimenta do reino', true, 'temperos'],
  ['PIMENTA REINO', 'pimenta do reino', true, 'temperos'],
  ['FOLHA LOURO', 'louro', true, 'temperos'],
  ['CALDO GALINHA', 'caldo de galinha', true, 'temperos'],
  ['CALDO CARNE', 'caldo de carne', true, 'temperos'],
  ['TEMPERO COMPLETO', 'tempero completo', true, 'temperos'],
  ['VINAGRE MACA', 'vinagre de maçã', true, 'temperos'],
  ['ACETO', 'aceto balsâmico', true, 'temperos'],
  ['ACETO BALSAMICO', 'aceto balsâmico', true, 'temperos'],
  ['EXTR TOMATE', 'extrato de tomate', true, 'temperos'],
  ['SELETA', 'seleta de legumes', true, 'conservas'],
  ['SELETA LEGUMES', 'seleta de legumes', true, 'conservas'],
  // Óleos
  ['OLEO SOJA', 'óleo de soja', true, 'óleos'],
  ['OLEO MILHO', 'óleo de milho', true, 'óleos'],
  ['OLEO GIRASSOL', 'óleo de girassol', true, 'óleos'],
  // Hortifruti (singles com acento / compostos)
  ['RUCULA', 'rúcula', true, 'vegetais'],
  ['HORTELA', 'hortelã', true, 'vegetais'],
  ['MANJERICAO', 'manjericão', true, 'vegetais'],
  ['BERINJELA', 'berinjela', true, 'vegetais'],
  ['VAGEM', 'vagem', true, 'vegetais'],
  ['QUIABO', 'quiabo', true, 'vegetais'],
  ['CHUCHU', 'chuchu', true, 'vegetais'],
  ['REPOLHO', 'repolho', true, 'vegetais'],
  ['COUVE FLOR', 'couve-flor', true, 'vegetais'],
  ['CEBOLA ROXA', 'cebola roxa', true, 'vegetais'],
  ['BATATA DOCE', 'batata doce', true, 'vegetais'],
  ['BATATA PALITO', 'batata palito', true, 'vegetais'],
  ['MILHO VERDE', 'milho verde', true, 'vegetais'],
  ['MILHO VDE', 'milho verde', true, 'vegetais'],
  ['MILHO PIPOCA', 'milho de pipoca', true, 'grãos'],
  ['PERA', 'pêra', true, 'frutas'],
  ['KIWI', 'kiwi', true, 'frutas'],
  ['ACAI', 'açaí', true, 'frutas'],
  ['POLPA FRUTA', 'polpa de fruta', true, 'frutas'],
  ['POLPA', 'polpa de fruta', true, 'frutas'],
  // Congelados / prontos
  ['PIZZA', 'pizza', false, 'congelados'],
  ['LASANHA', 'lasanha', false, 'congelados'],
  ['SORVETE', 'sorvete', false, 'congelados'],
  ['NUGGETS', 'nuggets', true, 'congelados'],
  // Bebidas
  ['SUCO UVA', 'suco de uva', true, 'bebidas'],
  ['SUCO LARANJA', 'suco de laranja', true, 'bebidas'],
  ['AGUA COCO', 'água de coco', true, 'bebidas'],
  ['AGUA MIN C/GAS', 'água mineral com gás', false, 'bebidas industrializadas'],
  ['CHA', 'chá', true, 'bebidas'],
  ['CHA MATE', 'chá mate', false, 'bebidas industrializadas'],
  ['VINHO TINTO', 'vinho tinto', true, 'bebidas'],
  ['VINHO BRANCO', 'vinho branco', true, 'bebidas'],
  // Higiene / limpeza (formas completas que o OCR também emite)
  ['DETERG', 'detergente', false, 'limpeza'],
  ['SHAMPOO', 'shampoo', false, 'higiene'],
  ['DESODORANTE', 'desodorante', false, 'higiene'],
  ['AGUA SANITARIA', 'água sanitária', false, 'limpeza'],
  ['ESPONJA ACO', 'esponja de aço', false, 'limpeza'],
];

@Injectable()
export class AbbreviationService implements OnModuleInit {
  private readonly logger = new Logger(AbbreviationService.name);
  // Cache em memória para performance (abreviação → linha)
  private cache = new Map<string, AbbreviationExpansion>();

  constructor(
    @InjectRepository(AbbreviationExpansion)
    private readonly repo: Repository<AbbreviationExpansion>,
  ) {}

  async onModuleInit() {
    await this.seedIfEmpty();
    await this.loadCache();
  }

  private async seedIfEmpty() {
    this.logger.log('Populando tabela de abreviações com seed inicial...');
    const seen = new Set<string>();
    const unique = SEED_ABBREVIATIONS.filter(([abbr]) => {
      if (seen.has(abbr)) return false;
      seen.add(abbr);
      return true;
    });
    const rows = unique.map(([abbr, expanded, is_ingredient, categoria]) => ({
      abbr, expanded, is_ingredient, categoria, source: 'seed' as const,
    }));
    await this.repo.upsert(rows, { conflictPaths: ['abbr'], skipUpdateIfNoValuesChanged: true });
    this.logger.log(`${rows.length} abreviações inseridas.`);
  }

  private async loadCache() {
    const all = await this.repo.find({ where: { is_active: true } });
    this.cache.clear();
    for (const row of all) {
      this.cache.set(row.abbr.toUpperCase(), row);
    }
    this.logger.log(`Cache de abreviações carregado: ${this.cache.size} entradas.`);
  }

  /**
   * Tenta expandir tokens de abreviação em um nome OCR.
   * Retorna null se nenhuma abreviação for reconhecida.
   * Retorna { expanded, is_ingredient } se encontrou.
   */
  expand(nomeOcr: string): { expanded: string; is_ingredient: boolean } | null {
    const upper = nomeOcr.trim().toUpperCase();

    // Tenta match exato primeiro
    const exact = this.cache.get(upper);
    if (exact) {
      return { expanded: exact.expanded, is_ingredient: exact.is_ingredient };
    }

    // Tenta match de multi-token: "CR DE LEITE" → normaliza espaços e tenta
    const normalized = upper.replace(/\s+/g, ' ');
    const normalized2 = this.cache.get(normalized);
    if (normalized2) {
      return { expanded: normalized2.expanded, is_ingredient: normalized2.is_ingredient };
    }

    // Tenta expandir token a token para nomes compostos
    // Ex: "MAC GRANO DURO 500G CAMIL" → pega primeiro token "MAC" → macarrão
    const tokens = upper.split(/\s+/);
    if (tokens.length > 0) {
      // Tenta 1, 2 e 3 tokens do início
      for (let len = Math.min(3, tokens.length); len >= 1; len--) {
        const prefix = tokens.slice(0, len).join(' ');
        const row = this.cache.get(prefix);
        if (row) {
          return { expanded: row.expanded, is_ingredient: row.is_ingredient };
        }
      }
    }

    return null;
  }

  /** Recarrega cache (após CRUD no admin) */
  async reloadCache() {
    await this.loadCache();
  }

  // ========== CRUD para admin ==========

  async findAll(opts: {
    search?: string;
    tipo?: 'all' | 'ingrediente' | 'nao_ingrediente';
    page?: number;
    limit?: number;
  }) {
    const { search, tipo = 'all', page = 1, limit = 50 } = opts;
    const qb = this.repo.createQueryBuilder('a').orderBy('a.abbr', 'ASC');

    if (search) {
      qb.andWhere('(a.abbr ILIKE :s OR a.expanded ILIKE :s OR a.categoria ILIKE :s)', {
        s: `%${search}%`,
      });
    }
    if (tipo === 'ingrediente') qb.andWhere('a.is_ingredient = true');
    if (tipo === 'nao_ingrediente') qb.andWhere('a.is_ingredient = false');

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: { abbr: string; expanded: string; is_ingredient: boolean; categoria?: string }) {
    const entity = this.repo.create({ ...dto, abbr: dto.abbr.toUpperCase(), source: 'user' });
    const saved = await this.repo.save(entity);
    await this.loadCache();
    return saved;
  }

  async update(id: string, dto: Partial<{ abbr: string; expanded: string; is_ingredient: boolean; categoria: string; is_active: boolean }>) {
    if (dto.abbr) dto.abbr = dto.abbr.toUpperCase();
    await this.repo.update(id, dto);
    await this.loadCache();
    return this.repo.findOneByOrFail({ id });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    await this.loadCache();
  }
}
