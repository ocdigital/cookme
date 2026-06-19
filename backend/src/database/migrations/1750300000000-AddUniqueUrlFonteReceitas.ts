import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueUrlFonteReceitas1750300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Remove duplicatas mantendo o registro mais recente de cada url_fonte
    await queryRunner.query(`
      DELETE FROM receitas
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY url_fonte ORDER BY criado_em DESC) AS rn
          FROM receitas
          WHERE url_fonte IS NOT NULL
        ) ranked
        WHERE rn > 1
      )
    `);

    // Constraint única em url_fonte (apenas registros não nulos)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_receitas_url_fonte_unique
      ON receitas(url_fonte)
      WHERE url_fonte IS NOT NULL
    `);

    // Índice para queries de cleanup
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_receitas_validation_score_null
      ON receitas(id)
      WHERE validation_score IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_receitas_status_moderacao
      ON receitas(status_moderacao)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_receitas_url_fonte_unique`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_receitas_validation_score_null`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_receitas_status_moderacao`);
  }
}
