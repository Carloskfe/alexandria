import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCreditsToTokens1714000000038 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" RENAME COLUMN "creditsPerCycle" TO "tokensPerCycle"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "creditsRemaining" TO "tokenBalance"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subscriptions" RENAME COLUMN "tokenBalance" TO "creditsRemaining"`);
    await queryRunner.query(`ALTER TABLE "plans" RENAME COLUMN "tokensPerCycle" TO "creditsPerCycle"`);
  }
}
