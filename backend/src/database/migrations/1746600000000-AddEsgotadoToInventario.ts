import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEsgotadoToInventario1746600000000 implements MigrationInterface {
  name = 'AddEsgotadoToInventario1746600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inventario"
      ADD COLUMN IF NOT EXISTS "esgotado" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "inventario"
      ADD COLUMN IF NOT EXISTS "esgotado_em" timestamp
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventario_esgotado"
      ON "inventario" ("esgotado")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventario_esgotado"`);
    await queryRunner.query(`ALTER TABLE "inventario" DROP COLUMN IF EXISTS "esgotado_em"`);
    await queryRunner.query(`ALTER TABLE "inventario" DROP COLUMN IF EXISTS "esgotado"`);
  }
}
