import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSyncSource1714000000033 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sync_maps"
        ADD COLUMN IF NOT EXISTS "syncSource" varchar NOT NULL DEFAULT 'auto'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sync_maps"
        DROP COLUMN IF EXISTS "syncSource"
    `);
  }
}
