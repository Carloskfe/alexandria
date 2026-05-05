import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanCreditsPerCycle1714000000020 implements MigrationInterface {
  name = 'AddPlanCreditsPerCycle1714000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
      ADD COLUMN IF NOT EXISTS "creditsPerCycle" integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      UPDATE "plans" SET "creditsPerCycle" = 2
      WHERE "name" ILIKE 'Dual Reader%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "creditsPerCycle"`);
  }
}
