/**
 * Seed de ingredientes base com inteligência culinária.
 * Uso: npx ts-node -r tsconfig-paths/register src/scripts/seed-ingredientes-base.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { dataSourceOptions } from '../config/database.config';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface IngredienteBase {
  nome: string;
  nome_display: string;
  unidade_padrao: string;
  validade_media_dias: number;
  categoria_culinaria: string;
  sempre_a_gosto?: boolean;
  opcional_por_natureza?: boolean;
  bloqueia_receita_se_ausente?: boolean;
  regional?: string;
  tags?: string[];
}

const INGREDIENTES: IngredienteBase[] = [

  // ── PROTEÍNAS ANIMAIS ──────────────────────────────────────────────────────
  { nome: 'Frango',         nome_display: 'Frango',         unidade_padrao: 'kg',  validade_media_dias: 3,   categoria_culinaria: 'proteina_animal', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'carne'] },
  { nome: 'Carne Moída',    nome_display: 'Carne Moída',    unidade_padrao: 'kg',  validade_media_dias: 2,   categoria_culinaria: 'proteina_animal', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'carne'] },
  { nome: 'Carne Bovina',   nome_display: 'Carne Bovina',   unidade_padrao: 'kg',  validade_media_dias: 3,   categoria_culinaria: 'proteina_animal', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'carne'] },
  { nome: 'Peixe',          nome_display: 'Peixe',          unidade_padrao: 'kg',  validade_media_dias: 2,   categoria_culinaria: 'proteina_animal', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'frutos_mar'] },
  { nome: 'Camarão',        nome_display: 'Camarão',        unidade_padrao: 'kg',  validade_media_dias: 2,   categoria_culinaria: 'proteina_animal', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'frutos_mar'] },
  { nome: 'Ovo',            nome_display: 'Ovo',            unidade_padrao: 'un',  validade_media_dias: 30,  categoria_culinaria: 'proteina_animal', bloqueia_receita_se_ausente: true,  tags: ['proteina'] },
  { nome: 'Bacon',          nome_display: 'Bacon',          unidade_padrao: 'g',   validade_media_dias: 10,  categoria_culinaria: 'proteina_animal', bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['proteina', 'embutido'] },
  { nome: 'Linguiça',       nome_display: 'Linguiça',       unidade_padrao: 'g',   validade_media_dias: 7,   categoria_culinaria: 'proteina_animal', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'embutido'] },

  // ── LEGUMINOSAS ────────────────────────────────────────────────────────────
  { nome: 'Feijão Preto',   nome_display: 'Feijão Preto',   unidade_padrao: 'kg',  validade_media_dias: 365, categoria_culinaria: 'leguminosa', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'leguminosa'] },
  { nome: 'Feijão Carioca', nome_display: 'Feijão Carioca', unidade_padrao: 'kg',  validade_media_dias: 365, categoria_culinaria: 'leguminosa', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'leguminosa'] },
  { nome: 'Lentilha',       nome_display: 'Lentilha',       unidade_padrao: 'kg',  validade_media_dias: 365, categoria_culinaria: 'leguminosa', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'leguminosa'] },
  { nome: 'Grão-de-bico',   nome_display: 'Grão-de-bico',   unidade_padrao: 'kg',  validade_media_dias: 365, categoria_culinaria: 'leguminosa', bloqueia_receita_se_ausente: true,  tags: ['proteina', 'leguminosa'] },

  // ── CARBOIDRATOS BASE ──────────────────────────────────────────────────────
  { nome: 'Arroz',           nome_display: 'Arroz',           unidade_padrao: 'kg',  validade_media_dias: 365,  categoria_culinaria: 'farinhaceo', bloqueia_receita_se_ausente: true,  tags: ['carboidrato'] },
  { nome: 'Macarrão',        nome_display: 'Macarrão',        unidade_padrao: 'kg',  validade_media_dias: 730,  categoria_culinaria: 'farinhaceo', bloqueia_receita_se_ausente: true,  tags: ['carboidrato'] },
  { nome: 'Farinha de Trigo',nome_display: 'Farinha de Trigo',unidade_padrao: 'kg',  validade_media_dias: 365,  categoria_culinaria: 'farinhaceo', bloqueia_receita_se_ausente: true,  tags: ['carboidrato', 'farinha'] },
  { nome: 'Farinha de Mandioca', nome_display: 'Farinha de Mandioca', unidade_padrao: 'kg', validade_media_dias: 180, categoria_culinaria: 'farinhaceo', bloqueia_receita_se_ausente: true, tags: ['carboidrato', 'farinha'] },
  { nome: 'Fubá',            nome_display: 'Fubá',            unidade_padrao: 'kg',  validade_media_dias: 180,  categoria_culinaria: 'farinhaceo', bloqueia_receita_se_ausente: true,  tags: ['carboidrato', 'farinha'] },
  { nome: 'Aveia',           nome_display: 'Aveia',           unidade_padrao: 'kg',  validade_media_dias: 180,  categoria_culinaria: 'farinhaceo', bloqueia_receita_se_ausente: true,  tags: ['carboidrato'] },
  { nome: 'Pão',             nome_display: 'Pão',             unidade_padrao: 'un',  validade_media_dias: 5,    categoria_culinaria: 'farinhaceo', bloqueia_receita_se_ausente: true,  tags: ['carboidrato'] },

  // ── VEGETAIS E TUBÉRCULOS ─────────────────────────────────────────────────
  { nome: 'Batata',          nome_display: 'Batata',          unidade_padrao: 'kg',  validade_media_dias: 30,  categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: true,  tags: ['vegetal', 'carboidrato'] },
  { nome: 'Batata Doce',     nome_display: 'Batata Doce',     unidade_padrao: 'kg',  validade_media_dias: 20,  categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: true,  tags: ['vegetal', 'carboidrato'] },
  { nome: 'Mandioca',        nome_display: 'Mandioca',        unidade_padrao: 'kg',  validade_media_dias: 7,   categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: true,  tags: ['vegetal', 'carboidrato'] },
  { nome: 'Tomate',          nome_display: 'Tomate',          unidade_padrao: 'un',  validade_media_dias: 7,   categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: false, tags: ['vegetal'] },
  { nome: 'Cenoura',         nome_display: 'Cenoura',         unidade_padrao: 'un',  validade_media_dias: 14,  categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: true,  tags: ['vegetal'] },
  { nome: 'Abobrinha',       nome_display: 'Abobrinha',       unidade_padrao: 'un',  validade_media_dias: 7,   categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: true,  tags: ['vegetal'] },
  { nome: 'Brócolis',        nome_display: 'Brócolis',        unidade_padrao: 'un',  validade_media_dias: 5,   categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: true,  tags: ['vegetal'] },
  { nome: 'Espinafre',       nome_display: 'Espinafre',       unidade_padrao: 'g',   validade_media_dias: 5,   categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: true,  tags: ['vegetal'] },
  { nome: 'Couve',           nome_display: 'Couve',           unidade_padrao: 'g',   validade_media_dias: 5,   categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: true,  tags: ['vegetal'] },
  { nome: 'Pimentão',        nome_display: 'Pimentão',        unidade_padrao: 'un',  validade_media_dias: 7,   categoria_culinaria: 'vegetal', bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['vegetal', 'aromatico'] },

  // ── AROMÁTICOS BASE (a santíssima trindade + companheiros) ─────────────────
  { nome: 'Alho',            nome_display: 'Alho',            unidade_padrao: 'dente', validade_media_dias: 60, categoria_culinaria: 'aromatico_base', bloqueia_receita_se_ausente: false, tags: ['tempero', 'aromatico'] },
  { nome: 'Cebola',          nome_display: 'Cebola',          unidade_padrao: 'un',    validade_media_dias: 30, categoria_culinaria: 'aromatico_base', bloqueia_receita_se_ausente: false, tags: ['tempero', 'aromatico'] },
  { nome: 'Alho-poró',       nome_display: 'Alho-poró',       unidade_padrao: 'un',    validade_media_dias: 7,  categoria_culinaria: 'aromatico_base', bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'aromatico'] },

  // ── TEMPEROS SECOS E ESPECIARIAS ───────────────────────────────────────────
  { nome: 'Sal',               nome_display: 'Sal',               unidade_padrao: 'g',   validade_media_dias: 3650, categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, tags: ['tempero'] },
  { nome: 'Pimenta-do-reino',  nome_display: 'Pimenta-do-reino',  unidade_padrao: 'g',   validade_media_dias: 730,  categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, tags: ['tempero', 'picante'] },
  { nome: 'Pimenta Vermelha',  nome_display: 'Pimenta Vermelha',  unidade_padrao: 'g',   validade_media_dias: 730,  categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'picante'] },
  { nome: 'Cominho',           nome_display: 'Cominho',           unidade_padrao: 'g',   validade_media_dias: 730,  categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'especiaria'] },
  { nome: 'Colorau',           nome_display: 'Colorau',           unidade_padrao: 'g',   validade_media_dias: 365,  categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'cor'] },
  { nome: 'Páprica',           nome_display: 'Páprica',           unidade_padrao: 'g',   validade_media_dias: 730,  categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'especiaria'] },
  { nome: 'Orégano',           nome_display: 'Orégano',           unidade_padrao: 'g',   validade_media_dias: 730,  categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'erva'] },
  { nome: 'Louro',             nome_display: 'Louro',             unidade_padrao: 'folha', validade_media_dias: 365, categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'erva'] },
  { nome: 'Canela',            nome_display: 'Canela',            unidade_padrao: 'g',   validade_media_dias: 730,  categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'especiaria', 'doce'] },
  { nome: 'Noz-moscada',       nome_display: 'Noz-moscada',       unidade_padrao: 'g',   validade_media_dias: 730,  categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'especiaria'] },
  { nome: 'Cúrcuma',           nome_display: 'Cúrcuma',           unidade_padrao: 'g',   validade_media_dias: 730,  categoria_culinaria: 'especiaria', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'especiaria'] },

  // ── ERVAS FRESCAS DE FINALIZAÇÃO ──────────────────────────────────────────
  { nome: 'Cheiro-verde',    nome_display: 'Cheiro-verde',    unidade_padrao: 'ramo', validade_media_dias: 5,  categoria_culinaria: 'erva_fresca', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'erva', 'finalizador'] },
  { nome: 'Salsinha',        nome_display: 'Salsinha',        unidade_padrao: 'ramo', validade_media_dias: 5,  categoria_culinaria: 'erva_fresca', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'erva', 'finalizador'] },
  { nome: 'Cebolinha',       nome_display: 'Cebolinha',       unidade_padrao: 'ramo', validade_media_dias: 5,  categoria_culinaria: 'erva_fresca', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'erva', 'finalizador'] },
  { nome: 'Coentro',         nome_display: 'Coentro',         unidade_padrao: 'ramo', validade_media_dias: 5,  categoria_culinaria: 'erva_fresca', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, regional: 'nordeste', tags: ['tempero', 'erva', 'finalizador'] },
  { nome: 'Manjericão',      nome_display: 'Manjericão',      unidade_padrao: 'folha', validade_media_dias: 5, categoria_culinaria: 'erva_fresca', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'erva', 'finalizador'] },
  { nome: 'Alecrim',         nome_display: 'Alecrim',         unidade_padrao: 'ramo', validade_media_dias: 7,  categoria_culinaria: 'erva_fresca', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'erva'] },
  { nome: 'Tomilho',         nome_display: 'Tomilho',         unidade_padrao: 'ramo', validade_media_dias: 7,  categoria_culinaria: 'erva_fresca', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'erva'] },
  { nome: 'Hortelã',         nome_display: 'Hortelã',         unidade_padrao: 'folha', validade_media_dias: 5, categoria_culinaria: 'erva_fresca', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['tempero', 'erva'] },

  // ── GORDURAS CULINÁRIAS ────────────────────────────────────────────────────
  { nome: 'Azeite',          nome_display: 'Azeite',          unidade_padrao: 'ml',  validade_media_dias: 730,  categoria_culinaria: 'gordura', bloqueia_receita_se_ausente: false, tags: ['gordura'] },
  { nome: 'Óleo de Soja',    nome_display: 'Óleo de Soja',    unidade_padrao: 'ml',  validade_media_dias: 365,  categoria_culinaria: 'gordura', bloqueia_receita_se_ausente: false, tags: ['gordura'] },
  { nome: 'Manteiga',        nome_display: 'Manteiga',        unidade_padrao: 'g',   validade_media_dias: 30,   categoria_culinaria: 'gordura', bloqueia_receita_se_ausente: false, tags: ['gordura', 'laticinios'] },
  { nome: 'Azeite de Dendê', nome_display: 'Azeite de Dendê', unidade_padrao: 'ml',  validade_media_dias: 365,  categoria_culinaria: 'gordura', bloqueia_receita_se_ausente: true,  regional: 'bahia', tags: ['gordura', 'regional'] },

  // ── LATICÍNIOS ─────────────────────────────────────────────────────────────
  { nome: 'Leite',           nome_display: 'Leite',           unidade_padrao: 'l',   validade_media_dias: 5,    categoria_culinaria: 'laticinios', bloqueia_receita_se_ausente: true,  tags: ['laticinios'] },
  { nome: 'Creme de Leite',  nome_display: 'Creme de Leite',  unidade_padrao: 'ml',  validade_media_dias: 5,    categoria_culinaria: 'laticinios', bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['laticinios'] },
  { nome: 'Queijo Minas',    nome_display: 'Queijo Minas',    unidade_padrao: 'g',   validade_media_dias: 7,    categoria_culinaria: 'laticinios', bloqueia_receita_se_ausente: true,  tags: ['laticinios', 'proteina'] },
  { nome: 'Queijo Parmesão', nome_display: 'Queijo Parmesão', unidade_padrao: 'g',   validade_media_dias: 30,   categoria_culinaria: 'laticinios', bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['laticinios', 'finalizador'] },
  { nome: 'Iogurte',         nome_display: 'Iogurte',         unidade_padrao: 'g',   validade_media_dias: 14,   categoria_culinaria: 'laticinios', bloqueia_receita_se_ausente: true,  tags: ['laticinios'] },
  { nome: 'Leite de Coco',   nome_display: 'Leite de Coco',   unidade_padrao: 'ml',  validade_media_dias: 365,  categoria_culinaria: 'laticinios', bloqueia_receita_se_ausente: true,  tags: ['laticinios', 'regional'] },

  // ── MOLHOS E CONDIMENTOS LÍQUIDOS ─────────────────────────────────────────
  { nome: 'Extrato de Tomate', nome_display: 'Extrato de Tomate', unidade_padrao: 'g', validade_media_dias: 365, categoria_culinaria: 'molho_condimento', bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['molho', 'condimento'] },
  { nome: 'Molho de Soja',   nome_display: 'Molho de Soja',   unidade_padrao: 'ml',  validade_media_dias: 730,  categoria_culinaria: 'molho_condimento', sempre_a_gosto: true, bloqueia_receita_se_ausente: false, tags: ['molho', 'condimento', 'umami'] },
  { nome: 'Vinagre',         nome_display: 'Vinagre',         unidade_padrao: 'ml',  validade_media_dias: 1825, categoria_culinaria: 'molho_condimento', sempre_a_gosto: true, bloqueia_receita_se_ausente: false, tags: ['condimento', 'acido'] },
  { nome: 'Caldo de Frango', nome_display: 'Caldo de Frango', unidade_padrao: 'ml',  validade_media_dias: 365,  categoria_culinaria: 'molho_condimento', bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['caldo', 'condimento'] },

  // ── AÇÚCARES E ADOÇANTES ──────────────────────────────────────────────────
  { nome: 'Açúcar',          nome_display: 'Açúcar',          unidade_padrao: 'g',   validade_media_dias: 1825, categoria_culinaria: 'adocante', bloqueia_receita_se_ausente: false, tags: ['doce', 'adocante'] },
  { nome: 'Açúcar Mascavo',  nome_display: 'Açúcar Mascavo',  unidade_padrao: 'g',   validade_media_dias: 365,  categoria_culinaria: 'adocante', bloqueia_receita_se_ausente: false, tags: ['doce', 'adocante'] },
  { nome: 'Mel',             nome_display: 'Mel',             unidade_padrao: 'ml',  validade_media_dias: 1825, categoria_culinaria: 'adocante', bloqueia_receita_se_ausente: false, tags: ['doce', 'adocante'] },

  // ── FRUTAS ─────────────────────────────────────────────────────────────────
  { nome: 'Limão',           nome_display: 'Limão',           unidade_padrao: 'un',  validade_media_dias: 14,  categoria_culinaria: 'fruta', sempre_a_gosto: true,  bloqueia_receita_se_ausente: false, opcional_por_natureza: true, tags: ['fruta', 'acido', 'finalizador'] },
  { nome: 'Laranja',         nome_display: 'Laranja',         unidade_padrao: 'un',  validade_media_dias: 14,  categoria_culinaria: 'fruta', bloqueia_receita_se_ausente: true,  tags: ['fruta'] },
  { nome: 'Banana',          nome_display: 'Banana',          unidade_padrao: 'un',  validade_media_dias: 5,   categoria_culinaria: 'fruta', bloqueia_receita_se_ausente: true,  tags: ['fruta'] },
  { nome: 'Maçã',            nome_display: 'Maçã',            unidade_padrao: 'un',  validade_media_dias: 14,  categoria_culinaria: 'fruta', bloqueia_receita_se_ausente: true,  tags: ['fruta'] },
];

async function main() {
  const ds = new DataSource({ ...dataSourceOptions, synchronize: false });
  await ds.initialize();

  console.log('\n🥕 Seed de ingredientes base com inteligência culinária\n');

  const stats = { inseridos: 0, atualizados: 0, erros: 0 };

  for (const ing of INGREDIENTES) {
    try {
      const existe = await ds.query(`SELECT id FROM produtos WHERE nome = $1`, [ing.nome]);

      if (existe.length > 0) {
        await ds.query(`
          UPDATE produtos SET
            nome_display = $1,
            categoria_culinaria = $2,
            sempre_a_gosto = $3,
            opcional_por_natureza = $4,
            bloqueia_receita_se_ausente = $5,
            regional = $6,
            ingrediente_receita = true,
            verificado = true
          WHERE nome = $7
        `, [
          ing.nome_display,
          ing.categoria_culinaria,
          ing.sempre_a_gosto ?? false,
          ing.opcional_por_natureza ?? false,
          ing.bloqueia_receita_se_ausente ?? true,
          ing.regional ?? null,
          ing.nome,
        ]);
        stats.atualizados++;
        const flags: string[] = [];
        if (ing.sempre_a_gosto) flags.push('a_gosto');
        if (ing.opcional_por_natureza) flags.push('opcional');
        if (ing.regional) flags.push(ing.regional);
        console.log(`  🔄 ${ing.nome_display} [${ing.categoria_culinaria}]${flags.length ? ' (' + flags.join(', ') + ')' : ''}`);
      } else {
        await ds.query(`
          INSERT INTO produtos (
            nome, nome_display, tipo, unidade_padrao, validade_media_dias, tags,
            ingrediente_receita, verificado, origem, confianca_classificacao,
            categoria_culinaria, sempre_a_gosto, opcional_por_natureza,
            bloqueia_receita_se_ausente, regional
          ) VALUES ($1,$2,'ALIMENTO',$3,$4,$5,true,true,'manual',100,$6,$7,$8,$9,$10)
        `, [
          ing.nome,
          ing.nome_display,
          ing.unidade_padrao,
          ing.validade_media_dias,
          ing.tags?.join(',') ?? null,
          ing.categoria_culinaria,
          ing.sempre_a_gosto ?? false,
          ing.opcional_por_natureza ?? false,
          ing.bloqueia_receita_se_ausente ?? true,
          ing.regional ?? null,
        ]);
        stats.inseridos++;
        const flags: string[] = [];
        if (ing.sempre_a_gosto) flags.push('a_gosto');
        if (ing.opcional_por_natureza) flags.push('opcional');
        if (ing.regional) flags.push(ing.regional);
        console.log(`  ✅ ${ing.nome_display} [${ing.categoria_culinaria}]${flags.length ? ' (' + flags.join(', ') + ')' : ''}`);
      }
    } catch (e: any) {
      console.error(`  ❌ ${ing.nome}: ${e.message}`);
      stats.erros++;
    }
  }

  const total = await ds.query(`SELECT COUNT(*) FROM produtos WHERE ingrediente_receita = true`);
  const aGosto = await ds.query(`SELECT COUNT(*) FROM produtos WHERE sempre_a_gosto = true`);
  const opcionais = await ds.query(`SELECT COUNT(*) FROM produtos WHERE opcional_por_natureza = true`);

  console.log(`\n✨ Concluído!`);
  console.log(`   Inseridos: ${stats.inseridos} | Atualizados: ${stats.atualizados} | Erros: ${stats.erros}`);
  console.log(`   Total ingredientes: ${total[0].count}`);
  console.log(`   Sempre "a gosto": ${aGosto[0].count}`);
  console.log(`   Opcionais por natureza: ${opcionais[0].count}\n`);

  await ds.destroy();
}

main().catch((err) => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
