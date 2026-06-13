import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertIngredientesChaveToArray1746700000000 implements MigrationInterface {
  name = 'ConvertIngredientesChaveToArray1746700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Lê todos os valores atuais (CSV string) e converte para text[]
    const rows = await queryRunner.query(
      `SELECT id, ingredientes_chave FROM receitas WHERE ingredientes_chave IS NOT NULL`,
    );

    // Adiciona coluna temporária como text[]
    await queryRunner.query(
      `ALTER TABLE receitas ADD COLUMN ingredientes_chave_new text[]`,
    );

    // Popula convertendo CSV → array
    for (const row of rows) {
      const arr = (row.ingredientes_chave as string)
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      await queryRunner.query(
        `UPDATE receitas SET ingredientes_chave_new = $1 WHERE id = $2`,
        [arr, row.id],
      );
    }

    // Troca as colunas
    await queryRunner.query(`ALTER TABLE receitas DROP COLUMN ingredientes_chave`);
    await queryRunner.query(`ALTER TABLE receitas RENAME COLUMN ingredientes_chave_new TO ingredientes_chave`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Converte de volta para CSV string
    const rows = await queryRunner.query(
      `SELECT id, ingredientes_chave FROM receitas WHERE ingredientes_chave IS NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE receitas ADD COLUMN ingredientes_chave_old text`,
    );

    for (const row of rows) {
      const csv = Array.isArray(row.ingredientes_chave)
        ? (row.ingredientes_chave as string[]).join(',')
        : '';
      await queryRunner.query(
        `UPDATE receitas SET ingredientes_chave_old = $1 WHERE id = $2`,
        [csv, row.id],
      );
    }

    await queryRunner.query(`ALTER TABLE receitas DROP COLUMN ingredientes_chave`);
    await queryRunner.query(`ALTER TABLE receitas RENAME COLUMN ingredientes_chave_old TO ingredientes_chave`);
  }
}
