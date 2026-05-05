import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionCredits1714000000019 implements MigrationInterface {
  name = 'AddSubscriptionCredits1714000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "creditsRemaining" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "creditsRemaining"`);
  }
}
