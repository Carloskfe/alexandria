import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPlans1714000000010 implements MigrationInterface {
  name = 'SeedPlans1714000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const individualMonthly = process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ?? 'price_changeme';
    const individualAnnual = process.env.STRIPE_PRICE_INDIVIDUAL_ANNUAL ?? 'price_changeme';
    const dualMonthly = process.env.STRIPE_PRICE_DUAL_MONTHLY ?? 'price_changeme';
    const dualAnnual = process.env.STRIPE_PRICE_DUAL_ANNUAL ?? 'price_changeme';

    await queryRunner.query(`
      INSERT INTO "plans" ("name", "stripePriceId", "interval", "amountCents", "maxProfiles")
      VALUES
        ('Individual Monthly', '${individualMonthly}', 'month', 999,  1),
        ('Individual Annual',  '${individualAnnual}',  'year',  8900, 1),
        ('Dual Reader Monthly','${dualMonthly}',        'month', 1499, 2),
        ('Dual Reader Annual', '${dualAnnual}',         'year',  13500,2)
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "plans"`);
  }
}
