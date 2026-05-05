import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookPriceCents1714000000017 implements MigrationInterface {
  name = 'AddBookPriceCents1714000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "priceCents" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "books" DROP COLUMN IF EXISTS "priceCents"`);
  }
}
