/**
 * Script de revalidação completa do banco de receitas.
 *
 * O que faz:
 * 1. Busca todas as receitas (ok + em_revisao + arquivado)
 * 2. Roda validação determinística com PROTAGONISTAS atualizado
 * 3. Extrai/atualiza ingredientes_chave de cada receita
 * 4. Atualiza status_moderacao:
 *    - Falhou determinística → arquivado
 *    - Passou → mantém 'ok' ou 'em_revisao' (não rebaixa receitas já aprovadas)
 * 5. Imprime relatório final
 *
 * Uso:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-revalidar-receitas.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PROTAGONISTAS } from '../../modules/receitas/services/protagonistas';

// ── Normalização (mesma lógica do backend) ───────────────────────────────────
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ── Extrai ingrediente canônico de uma linha de ingrediente ──────────────────
function extrairChave(linha: string): string {
  const n = norm(linha);
  return n
    // remove quantidades do início: "2 xícaras de", "1/2 kg de", "500g de"
    .replace(/^\d+[.,]?\d*\s*(\/\d+)?\s*(kg|g|ml|l|xicara|colher|copo|unidade|unid|un|pitada|fio|lata|pote|pacote|dente|folha|ramo|fatia|pedaco|punhado|cx|cs|cp)s?\s*(de\s+)?/i, '')
    // remove frações no início: "1/2 de"
    .replace(/^\d+\/\d+\s*(de\s+)?/, '')
    // remove números soltos no início
    .replace(/^\d+\s+/, '')
    // remove adjetivos de preparo no final
    .replace(/\s+(picado|picada|ralado|ralada|cozido|cozida|frito|frita|assado|assada|descascado|descascada|peneirado|peneirada|amassado|amassada|desfiado|desfiada|moido|moida|cortado|cortada|lavado|lavada|escorrido|escorrida|temperado|temperada|em pe[çc]as?|em cubos?|em tiras?|em rodelas?|batido|batida|dissolvido|dissolvida|sem semente|sem pele|sem osso)s?$/i, '')
    .trim();
}

// ── Validação determinística (espelho de recipe-validation.service.ts) ───────
function validarDeterministico(nome: string, ingredientesChave: string[]): { ok: boolean; motivo?: string } {
  if (ingredientesChave.length < 2) {
    return { ok: false, motivo: 'Menos de 2 ingredientes' };
  }

  const nomeNorm = norm(nome);
  const chaveText = ingredientesChave.join(' ');

  for (const [palavra, sinonimos] of Object.entries(PROTAGONISTAS)) {
    if (nomeNorm.includes(norm(palavra))) {
      const temProtagonista = sinonimos.some(s => chaveText.includes(norm(s)));
      if (!temProtagonista) {
        return { ok: false, motivo: `"${nome}" sem protagonista "${palavra}" (aceitos: ${sinonimos.slice(0, 3).join(', ')})` };
      }
      break;
    }
  }

  return { ok: true };
}

// ── Parse ingredientes_chave do banco (vem como CSV ou array) ────────────────
function parseChave(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    // formato simple-array TypeORM: "item1,item2,item3"
    return raw.split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
  }
  return [];
}

// ── Parse modo_preparo (pode ser JSON array ou texto) ────────────────────────
function parseModo(raw: any): string {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.join(' ');
    } catch {}
    return raw;
  }
  if (Array.isArray(raw)) return raw.join(' ');
  return '';
}

// ── Extrai chaves novas do modo_preparo + chaves existentes ──────────────────
function enriquecerChaves(chaveAtual: string[], modoPreparo: string, nomeReceita: string): string[] {
  const chaves = new Set(chaveAtual.map(norm));

  // Tenta extrair protagonista do nome da receita a partir do dict
  const nomeNorm = norm(nomeReceita);
  for (const [palavra, sinonimos] of Object.entries(PROTAGONISTAS)) {
    if (nomeNorm.includes(norm(palavra))) {
      // adiciona todos os sinônimos que aparecem no modo_preparo
      const modoNorm = norm(modoPreparo);
      for (const s of sinonimos) {
        if (modoNorm.includes(norm(s))) {
          chaves.add(norm(s));
        }
      }
      // garante pelo menos o primeiro sinônimo (protagonista obrigatório)
      if (![...chaves].some(c => sinonimos.some(s => norm(s) === c || c.includes(norm(s))))) {
        chaves.add(norm(sinonimos[0]));
      }
      break;
    }
  }

  return [...chaves].filter(c => c.length > 2);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'cookme',
    password: process.env.DB_PASSWORD || 'cookme123',
    database: process.env.DB_DATABASE || 'cookme_db',
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  const qr = ds.createQueryRunner();

  const receitas = await qr.query(`
    SELECT id, nome, ingredientes_chave, modo_preparo, status_moderacao, validation_score
    FROM receitas
    ORDER BY criado_em ASC
  `);

  console.log(`\n🔍 Revalidando ${receitas.length} receitas...\n`);

  let arquivadas = 0;
  let corrigidas = 0;
  let mantidas = 0;
  let chaveEnriquecidas = 0;
  const falhas: string[] = [];

  for (const r of receitas) {
    const chaveAtual = parseChave(r.ingredientes_chave);
    const modoPreparo = parseModo(r.modo_preparo);
    const statusAtual = r.status_moderacao;

    // Enriquece chaves com protagonista do dict
    const chaveEnriquecida = enriquecerChaves(chaveAtual, modoPreparo, r.nome);
    const chavesMudaram = chaveEnriquecida.length !== chaveAtual.length ||
      chaveEnriquecida.some(c => !chaveAtual.map(norm).includes(c));

    // Valida com chaves enriquecidas
    const val = validarDeterministico(r.nome, chaveEnriquecida);

    let novoStatus = statusAtual;
    if (!val.ok) {
      novoStatus = 'arquivado';
      falhas.push(`  ✗ [${statusAtual}→arquivado] "${r.nome}": ${val.motivo}`);
      if (statusAtual !== 'arquivado') arquivadas++;
    } else {
      if (statusAtual === 'arquivado') {
        // Receita estava arquivada mas agora passou — promove para em_revisao
        novoStatus = 'em_revisao';
        corrigidas++;
        console.log(`  ✓ [arquivado→em_revisao] "${r.nome}"`);
      } else {
        mantidas++;
      }
    }

    // Atualiza banco se mudou algo
    const mudouStatus = novoStatus !== statusAtual;
    if (mudouStatus || chavesMudaram) {
      const chaveArray = `{${chaveEnriquecida.map(c => `"${c.replace(/"/g, '\\"')}"`).join(',')}}`;
      await qr.query(
        `UPDATE receitas SET status_moderacao = $1, ingredientes_chave = $2 WHERE id = $3`,
        [novoStatus, chaveArray, r.id],
      );
      if (chavesMudaram) chaveEnriquecidas++;
    }
  }

  await qr.release();
  await ds.destroy();

  console.log('\n── Receitas com protagonista ausente ──────────────────────────');
  falhas.slice(0, 30).forEach(f => console.log(f));
  if (falhas.length > 30) console.log(`  ... e mais ${falhas.length - 30} receitas`);

  console.log('\n── Resumo ─────────────────────────────────────────────────────');
  console.log(`  Total processadas:        ${receitas.length}`);
  console.log(`  Arquivadas (reprovadas):  ${arquivadas}`);
  console.log(`  Recuperadas (promovidas): ${corrigidas}`);
  console.log(`  Chaves enriquecidas:      ${chaveEnriquecidas}`);
  console.log(`  Mantidas sem mudança:     ${mantidas}`);
  console.log('───────────────────────────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
