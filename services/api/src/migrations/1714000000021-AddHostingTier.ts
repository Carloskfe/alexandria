import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHostingTier1714000000021 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE hosting_tier_enum AS ENUM ('basic', 'starter', 'pro');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "hostingTier" hosting_tier_enum NOT NULL DEFAULT 'basic';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "hostingTier";`);
    await queryRunner.query(`DROP TYPE IF EXISTS hosting_tier_enum;`);
  }
}
