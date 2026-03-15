import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecreateNotificacoes1741100000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop table if exists
    await queryRunner.dropTable('notificacoes', true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
