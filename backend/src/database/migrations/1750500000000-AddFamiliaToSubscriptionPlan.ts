import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFamiliaToSubscriptionPlan1750500000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TYPE subscription_plan_enum ADD VALUE IF NOT EXISTS 'familia'`);
  }

  async down(_qr: QueryRunner): Promise<void> {
    // PostgreSQL não suporta remoção de valor de enum — necessário recriar o tipo
  }
}
