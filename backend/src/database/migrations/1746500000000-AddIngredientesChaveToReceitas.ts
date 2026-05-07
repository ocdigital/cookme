import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIngredientesChaveToReceitas1746500000000 implements MigrationInterface {
  name = 'AddIngredientesChaveToReceitas1746500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "receitas"
      ADD COLUMN IF NOT EXISTS "ingredientes_chave" text
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_receitas_ingredientes_chave"
      ON "receitas" ("ingredientes_chave")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_receitas_ingredientes_chave"`);
    await queryRunner.query(`ALTER TABLE "receitas" DROP COLUMN IF EXISTS "ingredientes_chave"`);
  }
}
