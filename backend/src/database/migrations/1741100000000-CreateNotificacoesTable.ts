import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateNotificacoesTable1741100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notificacoes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'severidade',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'titulo',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'mensagem',
            type: 'text',
          },
          {
            name: 'dados',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'acao_label',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'acao_rota',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'acao_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'usuario_admin_id',
            type: 'uuid',
          },
          {
            name: 'lido',
            type: 'boolean',
            default: false,
          },
          {
            name: 'lido_em',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'criado_em',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'notificacoes',
      new TableForeignKey({
        columnNames: ['usuario_admin_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usuarios',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'notificacoes',
      new TableIndex({
        name: 'IDX_notificacoes_usuario_admin_id',
        columnNames: ['usuario_admin_id'],
      }),
    );

    await queryRunner.createIndex(
      'notificacoes',
      new TableIndex({
        name: 'IDX_notificacoes_lido',
        columnNames: ['lido'],
      }),
    );

    await queryRunner.createIndex(
      'notificacoes',
      new TableIndex({
        name: 'IDX_notificacoes_tipo',
        columnNames: ['tipo'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notificacoes');
  }
}
