import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUploadCodes1714000000034 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "upload_codes" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "code"        VARCHAR     NOT NULL,
        "notes"       VARCHAR,
        "createdById" UUID        NOT NULL,
        "usedBy"      UUID,
        "usedAt"      TIMESTAMPTZ,
        "expiresAt"   TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_upload_codes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_upload_codes_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_upload_codes_code" ON "upload_codes" ("code")`);
    await queryRunner.query(`CREATE INDEX "idx_upload_codes_used_by" ON "upload_codes" ("usedBy")`);
    await queryRunner.query(`CREATE INDEX "idx_upload_codes_created_by" ON "upload_codes" ("createdById")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "upload_codes"`);
  }
}
