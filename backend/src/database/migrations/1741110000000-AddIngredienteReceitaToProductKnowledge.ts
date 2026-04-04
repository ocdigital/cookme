import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIngredienteReceitaToProductKnowledge1741110000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'product_knowledge_base',
      new TableColumn({
        name: 'ingrediente_receita',
        type: 'boolean',
        isNullable: true,
        default: true,
      })
    );

    await queryRunner.addColumn(
      'product_knowledge_base',
      new TableColumn({
        name: 'validacoes_ingrediente_sim',
        type: 'integer',
        isNullable: false,
        default: 0,
      })
    );

    await queryRunner.addColumn(
      'product_knowledge_base',
      new TableColumn({
        name: 'validacoes_ingrediente_nao',
        type: 'integer',
        isNullable: false,
        default: 0,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product_knowledge_base', 'validacoes_ingrediente_nao');
    await queryRunner.dropColumn('product_knowledge_base', 'validacoes_ingrediente_sim');
    await queryRunner.dropColumn('product_knowledge_base', 'ingrediente_receita');
  }
}
