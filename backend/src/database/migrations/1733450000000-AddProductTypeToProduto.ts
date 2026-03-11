import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProductTypeToProduto1733450000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar o enum type
    await queryRunner.query(`
      CREATE TYPE "product_type_enum" AS ENUM ('ALIMENTO', 'NAO_ALIMENTO');
    `);

    // Adicionar a coluna tipo
    await queryRunner.addColumn(
      'produtos',
      new TableColumn({
        name: 'tipo',
        type: 'enum',
        enum: ['ALIMENTO', 'NAO_ALIMENTO'],
        default: "'ALIMENTO'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover a coluna
    await queryRunner.dropColumn('produtos', 'tipo');

    // Remover o enum type
    await queryRunner.query(`
      DROP TYPE "product_type_enum";
    `);
  }
}
