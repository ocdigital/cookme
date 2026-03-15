import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddModerationFieldsToReceitas1741089600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'receitas',
      new TableColumn({
        name: 'denuncias',
        type: 'int',
        default: 0,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'receitas',
      new TableColumn({
        name: 'status_moderacao',
        type: 'enum',
        enum: ['ok', 'em_revisao', 'arquivado'],
        default: "'ok'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('receitas', 'status_moderacao');
    await queryRunner.dropColumn('receitas', 'denuncias');
  }
}
