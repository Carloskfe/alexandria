import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookAnalytics1714000000022 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "books"
        ADD COLUMN IF NOT EXISTS "textFileSizeBytes" int NULL,
        ADD COLUMN IF NOT EXISTS "audioFileSizeBytes" int NULL,
        ADD COLUMN IF NOT EXISTS "shareCount" int NOT NULL DEFAULT 0;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "books"
        DROP COLUMN IF EXISTS "textFileSizeBytes",
        DROP COLUMN IF EXISTS "audioFileSizeBytes",
        DROP COLUMN IF EXISTS "shareCount";
    `);
  }
}
