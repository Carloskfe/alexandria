import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailConfirmed1714000000023 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Default true so existing users are not locked out
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "emailConfirmed" boolean NOT NULL DEFAULT true;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailConfirmed";`);
  }
}
