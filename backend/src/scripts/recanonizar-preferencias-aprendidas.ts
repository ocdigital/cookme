/**
 * Re-deriva as preferências aprendidas de TODOS os usuários que têm avaliações,
 * usando a nova lógica (fonte ingredientes_chave + saldo consolidado + score).
 *
 * Limpa os dados poluídos da versão antiga (nomes sujos do OCR, itens em favorito
 * E aversão simultaneamente).
 *
 * Espelha AprendizadoService.derivarPreferencias — mantido standalone com DataSource
 * cru (não sobe o Nest) para rodar como script one-off, como os demais em src/scripts/.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register src/scripts/recanonizar-preferencias-aprendidas.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { dataSourceOptions } from '../config/database.config';
import { AUXILIARES } from '../modules/receitas/services/receita-banco.service';

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Saldo {
  positivo: number;
  negativo: number;
}

function acumular(mapa: Map<string, Saldo>, valor: string, sinal: number) {
  const s = mapa.get(valor) ?? { positivo: 0, negativo: 0 };
  if (sinal > 0) s.positivo += sinal;
  else s.negativo += -sinal;
  mapa.set(valor, s);
}

interface PrefRow {
  id: string;
  usuario_id: string;
  tipo: string;
  valor: string;
  score: number;
  contagem: number;
}

function consolidar(
  usuarioId: string,
  mapa: Map<string, Saldo>,
  tipoFavorito: string,
  tipoAversao: string,
): PrefRow[] {
  const out: PrefRow[] = [];
  for (const [valor, saldo] of mapa) {
    const liquido = saldo.positivo - saldo.negativo;
    if (liquido === 0) continue;
    const magnitude = Math.abs(liquido);
    const score = Math.min(1, 0.3 + (magnitude - 1) * 0.25);
    out.push({
      id: randomUUID(),
      usuario_id: usuarioId,
      tipo: liquido > 0 ? tipoFavorito : tipoAversao,
      valor,
      score,
      contagem: saldo.positivo + saldo.negativo,
    });
  }
  return out;
}

async function reprocessarUsuario(ds: DataSource, usuarioId: string) {
  const linhas: { avaliacao: number; ingrediente_chave: string | null; tags_dieta: string | null }[] =
    await ds.query(
      `
      SELECT e.avaliacao, ing AS ingrediente_chave, r.tags_dieta
      FROM receitas_executadas e
      JOIN receitas r ON r.id = e.receita_id
      LEFT JOIN LATERAL unnest(r.ingredientes_chave) AS ing ON true
      WHERE e.usuario_id = $1 AND e.avaliacao IS NOT NULL
      `,
      [usuarioId],
    );

  const saldoIng = new Map<string, Saldo>();
  const saldoCat = new Map<string, Saldo>();

  for (const row of linhas) {
    const nota = Number(row.avaliacao);
    const sinal = nota >= 4 ? 1 : nota <= 2 ? -1 : 0;
    if (sinal === 0) continue;

    if (row.ingrediente_chave) {
      const chave = normalizar(row.ingrediente_chave);
      if (chave && !AUXILIARES.has(chave)) acumular(saldoIng, chave, sinal);
    }
    const tags = row.tags_dieta ? row.tags_dieta.split(',').map((t) => t.trim()).filter(Boolean) : [];
    for (const tag of tags) acumular(saldoCat, tag.toLowerCase(), sinal);
  }

  const novas = [
    ...consolidar(usuarioId, saldoIng, 'ingrediente_favorito', 'ingrediente_aversao'),
    ...consolidar(usuarioId, saldoCat, 'categoria_favorita', 'categoria_aversao'),
  ];

  // Apaga as 4 dimensões derivadas (preserva RECEITA_URL_IGNORADA)
  await ds.query(
    `DELETE FROM preferencias_aprendidas
     WHERE usuario_id = $1
       AND tipo IN ('ingrediente_favorito','ingrediente_aversao','categoria_favorita','categoria_aversao')`,
    [usuarioId],
  );

  for (const n of novas) {
    await ds.query(
      `INSERT INTO preferencias_aprendidas (id, usuario_id, tipo, valor, score, contagem, criado_em, atualizado_em)
       VALUES ($1,$2,$3,$4,$5,$6, now(), now())`,
      [n.id, n.usuario_id, n.tipo, n.valor, n.score, n.contagem],
    );
  }
  return novas.length;
}

async function main() {
  const ds = new DataSource({ ...dataSourceOptions, synchronize: false });
  await ds.initialize();

  const usuarios: { usuario_id: string }[] = await ds.query(
    `SELECT DISTINCT usuario_id FROM receitas_executadas WHERE avaliacao IS NOT NULL`,
  );

  console.log(`\n🔄 Reprocessando preferências de ${usuarios.length} usuário(s)...\n`);

  let total = 0;
  for (let i = 0; i < usuarios.length; i++) {
    const n = await reprocessarUsuario(ds, usuarios[i].usuario_id);
    total += n;
    console.log(`  [${i + 1}/${usuarios.length}] ${usuarios[i].usuario_id} → ${n} preferências`);
  }

  const conflitos = await ds.query(`
    SELECT usuario_id, valor
    FROM preferencias_aprendidas
    WHERE tipo IN ('ingrediente_favorito','ingrediente_aversao')
    GROUP BY usuario_id, valor
    HAVING count(DISTINCT tipo) > 1
  `);

  console.log(`\n✨ Concluído. ${total} preferências gravadas.`);
  if (conflitos.length > 0) {
    console.error(`⚠️  ${conflitos.length} valor(es) em favorito E aversão — investigar.`);
  } else {
    console.log('✅ Nenhum ingrediente em favorito E aversão. Dados coerentes.');
  }

  await ds.destroy();
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
