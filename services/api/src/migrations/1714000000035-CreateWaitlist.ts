import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWaitlist1714000000035 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "waitlist_entries" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "email"      VARCHAR     NOT NULL,
        "name"       VARCHAR,
        "isAuthor"   BOOLEAN     NOT NULL DEFAULT false,
        "message"    TEXT,
        "invitedAt"  TIMESTAMPTZ,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_waitlist_entries" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_waitlist_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_waitlist_created" ON "waitlist_entries" ("createdAt" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "waitlist_entries"`);
  }
}
