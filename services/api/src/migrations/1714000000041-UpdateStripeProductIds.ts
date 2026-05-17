import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sets real Stripe price IDs on plans and token_packages.
 * Run AFTER setting env vars in .env.production:
 *   STRIPE_PRICE_ID_INDIVIDUAL_MONTHLY, STRIPE_PRICE_ID_INDIVIDUAL_ANNUAL
 *   STRIPE_PRICE_ID_DUO_MONTHLY, STRIPE_PRICE_ID_DUO_ANNUAL
 *   STRIPE_PRICE_ID_FAMILY_MONTHLY, STRIPE_PRICE_ID_FAMILY_ANNUAL
 *   STRIPE_PRICE_ID_TOKEN_1, STRIPE_PRICE_ID_TOKEN_3
 *   STRIPE_PRICE_ID_TOKEN_5, STRIPE_PRICE_ID_TOKEN_10
 */
export class UpdateStripeProductIds1714000000041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const e = process.env;

    const planUpdates: Array<[string, string, string]> = [
      ['Individual', 'month', e.STRIPE_PRICE_ID_INDIVIDUAL_MONTHLY ?? ''],
      ['Individual', 'year',  e.STRIPE_PRICE_ID_INDIVIDUAL_ANNUAL  ?? ''],
      ['Duo',        'month', e.STRIPE_PRICE_ID_DUO_MONTHLY        ?? ''],
      ['Duo',        'year',  e.STRIPE_PRICE_ID_DUO_ANNUAL         ?? ''],
      ['Family',     'month', e.STRIPE_PRICE_ID_FAMILY_MONTHLY     ?? ''],
      ['Family',     'year',  e.STRIPE_PRICE_ID_FAMILY_ANNUAL      ?? ''],
    ];

    for (const [name, interval, priceId] of planUpdates) {
      if (!priceId) continue;
      await queryRunner.query(
        `UPDATE "plans" SET "stripePriceId" = $1 WHERE "name" = $2 AND "interval" = $3`,
        [priceId, name, interval],
      );
    }

    const packageUpdates: Array<[number, string]> = [
      [1,  e.STRIPE_PRICE_ID_TOKEN_1  ?? ''],
      [3,  e.STRIPE_PRICE_ID_TOKEN_3  ?? ''],
      [5,  e.STRIPE_PRICE_ID_TOKEN_5  ?? ''],
      [10, e.STRIPE_PRICE_ID_TOKEN_10 ?? ''],
    ];

    for (const [tokenCount, priceId] of packageUpdates) {
      if (!priceId) continue;
      await queryRunner.query(
        `UPDATE "token_packages" SET "stripePriceId" = $1 WHERE "tokenCount" = $2`,
        [priceId, tokenCount],
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Price IDs are environment-specific — no safe rollback
  }
}
