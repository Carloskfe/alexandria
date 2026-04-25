import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptions1714000000009 implements MigrationInterface {
  name = 'CreateSubscriptions1714000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id"                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"                 UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "stripeCustomerId"       CHARACTER VARYING NOT NULL,
        "stripeSubscriptionId"   CHARACTER VARYING,
        "planId"                 UUID REFERENCES "plans"("id"),
        "status"                 CHARACTER VARYING NOT NULL DEFAULT 'none',
        "currentPeriodEnd"       TIMESTAMP WITH TIME ZONE,
        "trialEnd"               TIMESTAMP WITH TIME ZONE,
        "stripeEventId"          CHARACTER VARYING,
        "createdAt"              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "uq_subscriptions_user" UNIQUE ("userId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_subscriptions_stripe_subscription_id"
        ON "subscriptions" ("stripeSubscriptionId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_subscriptions_stripe_subscription_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
  }
}
