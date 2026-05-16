import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTokenLedgerAndCourtesy1714000000040 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Token ledger ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "token_type_enum" AS ENUM ('paid', 'promotional', 'courtesy')
    `);
    await queryRunner.query(`
      CREATE TYPE "token_status_enum" AS ENUM ('active', 'redeemed', 'expired')
    `);
    await queryRunner.query(`
      CREATE TABLE "token_ledger" (
        "id"              UUID                  NOT NULL DEFAULT gen_random_uuid(),
        "userId"          UUID                  NOT NULL,
        "subscriptionId"  UUID,
        "type"            "token_type_enum"     NOT NULL DEFAULT 'paid',
        "status"          "token_status_enum"   NOT NULL DEFAULT 'active',
        "issuedAt"        TIMESTAMPTZ           NOT NULL DEFAULT now(),
        "expiresAt"       TIMESTAMPTZ           NOT NULL,
        "activatedAt"     TIMESTAMPTZ,
        "redeemedAt"      TIMESTAMPTZ,
        "bookId"          UUID,
        "reason"          VARCHAR(255),
        "createdAt"       TIMESTAMPTZ           NOT NULL DEFAULT now(),
        CONSTRAINT "PK_token_ledger" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tl_user"         FOREIGN KEY ("userId")         REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tl_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_token_ledger_user_status" ON "token_ledger" ("userId", "status", "expiresAt")`);

    // ── Courtesy token quotas ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "courtesy_role_enum" AS ENUM ('author', 'publisher', 'narrator')
    `);
    await queryRunner.query(`
      CREATE TABLE "courtesy_token_quotas" (
        "id"          UUID                  NOT NULL DEFAULT gen_random_uuid(),
        "bookId"      UUID                  NOT NULL,
        "creatorId"   UUID                  NOT NULL,
        "role"        "courtesy_role_enum"  NOT NULL,
        "maxQuota"    INT                   NOT NULL DEFAULT 0,
        "issuedCount" INT                   NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMPTZ           NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ           NOT NULL DEFAULT now(),
        CONSTRAINT "PK_courtesy_quotas" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_courtesy_quota_book_creator" UNIQUE ("bookId", "creatorId"),
        CONSTRAINT "FK_cq_book"    FOREIGN KEY ("bookId")    REFERENCES "books"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cq_creator" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── Add linked users for Duo/Family shared pools ───────────────────────────
    await queryRunner.query(`
      ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "linkedUserIds" UUID[] NOT NULL DEFAULT '{}'
    `);

    // ── Track next monthly token issuance for annual plans ────────────────────
    await queryRunner.query(`
      ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "nextTokenIssuanceAt" TIMESTAMPTZ
    `);

    // ── Add narratorId to books ───────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "narratorId" UUID
    `);
    await queryRunner.query(`
      ALTER TABLE "books" ADD CONSTRAINT "FK_books_narrator"
        FOREIGN KEY ("narratorId") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // ── purchaseType: add 'token' and 'courtesy' variants ─────────────────────
    await queryRunner.query(`ALTER TABLE "user_books" DROP CONSTRAINT IF EXISTS "CHK_user_books_purchase_type"`);
    await queryRunner.query(`
      ALTER TABLE "user_books"
        ALTER COLUMN "purchaseType" TYPE VARCHAR(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "books" DROP CONSTRAINT IF EXISTS "FK_books_narrator"`);
    await queryRunner.query(`ALTER TABLE "books" DROP COLUMN IF EXISTS "narratorId"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "nextTokenIssuanceAt"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "linkedUserIds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courtesy_token_quotas"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "courtesy_role_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "token_ledger"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "token_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "token_type_enum"`);
  }
}
