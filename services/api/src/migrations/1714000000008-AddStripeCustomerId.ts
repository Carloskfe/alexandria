import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeCustomerId1714000000008 implements MigrationInterface {
  name = 'AddStripeCustomerId1714000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCustomerId" CHARACTER VARYING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "stripeCustomerId"
    `);
  }
}
