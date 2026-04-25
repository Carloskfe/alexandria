import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlansTable1714000000007 implements MigrationInterface {
  name = 'CreatePlansTable1714000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"          CHARACTER VARYING NOT NULL,
        "stripePriceId" CHARACTER VARYING NOT NULL,
        "interval"      CHARACTER VARYING NOT NULL,
        "amountCents"   INTEGER NOT NULL,
        "maxProfiles"   INTEGER NOT NULL DEFAULT 1,
        "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "plans"`);
  }
}
