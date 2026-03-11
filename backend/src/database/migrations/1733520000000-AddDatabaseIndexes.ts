import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabaseIndexes1733520000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices em produtos
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_produtos_nome" ON "produtos" ("nome")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_produtos_codigo_barras" ON "produtos" ("codigo_barras")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_produtos_categoria_id" ON "produtos" ("categoria_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_produtos_marca_id" ON "produtos" ("marca_id")`,
    );

    // Índices em receitas
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_receitas_nome" ON "receitas" ("nome")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_receitas_dificuldade" ON "receitas" ("dificuldade")`,
    );

    // Índices em usuários
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_usuarios_email" ON "usuarios" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_usuarios_role" ON "usuarios" ("role")`,
    );

    // Índices em compras
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_compras_usuario_id" ON "compras" ("usuario_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_compras_data_compra" ON "compras" ("data_compra")`,
    );

    // Índices em inventário
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventario_usuario_id" ON "inventario" ("usuario_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventario_produto_id" ON "inventario" ("produto_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_produtos_nome"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_produtos_codigo_barras"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_produtos_categoria_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_produtos_marca_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_receitas_nome"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_receitas_dificuldade"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usuarios_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usuarios_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_compras_usuario_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_compras_data_compra"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventario_usuario_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventario_produto_id"`);
  }
}
