import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestructurePlansAndTokenPackages1714000000039 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Update existing plans ──────────────────────────────────────────────────
    // Individual: $9.99 → $8.99, 1 token/cycle (unchanged)
    await queryRunner.query(`
      UPDATE "plans" SET
        "name" = 'Individual',
        "amountCents" = 899,
        "tokensPerCycle" = 1
      WHERE "name" = 'Individual' AND "interval" = 'month'
    `);
    await queryRunner.query(`
      UPDATE "plans" SET
        "name" = 'Individual',
        "amountCents" = 8399,
        "tokensPerCycle" = 1
      WHERE "name" = 'Individual' AND "interval" = 'year'
    `);

    // Reader → rename to Duo, update pricing: $14.99 → $13.99/mo, $129.99/yr, 2 tokens
    await queryRunner.query(`
      UPDATE "plans" SET
        "name" = 'Duo',
        "amountCents" = 1399,
        "tokensPerCycle" = 2,
        "maxProfiles" = 2
      WHERE "name" IN ('Reader', 'Duo') AND "interval" = 'month'
    `);
    await queryRunner.query(`
      UPDATE "plans" SET
        "name" = 'Duo',
        "amountCents" = 12999,
        "tokensPerCycle" = 2,
        "maxProfiles" = 2
      WHERE "name" IN ('Reader', 'Duo') AND "interval" = 'year'
    `);

    // ── Add Family plans ───────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "plans" ("name", "stripePriceId", "interval", "amountCents", "tokensPerCycle", "maxProfiles")
      VALUES
        ('Family', 'price_family_monthly_placeholder', 'month', 1899, 4, 5),
        ('Family', 'price_family_annual_placeholder',  'year',  17999, 4, 5)
      ON CONFLICT DO NOTHING
    `);

    // ── Token packages table ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "token_packages" (
        "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
        "name"            VARCHAR(50) NOT NULL,
        "tokenCount"      INT         NOT NULL,
        "amountCents"     INT         NOT NULL,
        "stripePriceId"   VARCHAR(100) NOT NULL DEFAULT '',
        "active"          BOOLEAN     NOT NULL DEFAULT true,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_token_packages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "token_packages" ("name", "tokenCount", "amountCents", "stripePriceId") VALUES
        ('1 Token',   1,  999,  'price_token_1_placeholder'),
        ('3 Tokens',  3,  2499, 'price_token_3_placeholder'),
        ('5 Tokens',  5,  3999, 'price_token_5_placeholder'),
        ('10 Tokens', 10, 7499, 'price_token_10_placeholder')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "token_packages"`);
    await queryRunner.query(`DELETE FROM "plans" WHERE "name" = 'Family'`);
    await queryRunner.query(`
      UPDATE "plans" SET "name" = 'Reader', "amountCents" = 1499, "tokensPerCycle" = 2, "maxProfiles" = 1
      WHERE "name" = 'Duo' AND "interval" = 'month'
    `);
  }
}
