import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserBookPurchaseType1714000000018 implements MigrationInterface {
  name = 'AddUserBookPurchaseType1714000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_books"
      ADD COLUMN IF NOT EXISTS "purchaseType" varchar NOT NULL DEFAULT 'free'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_books" DROP COLUMN IF EXISTS "purchaseType"`);
  }
}
