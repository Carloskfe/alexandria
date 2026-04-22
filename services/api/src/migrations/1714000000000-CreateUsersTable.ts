import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1714000000000 implements MigrationInterface {
  name = 'CreateUsersTable1714000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google', 'facebook', 'apple')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"           UUID NOT NULL DEFAULT uuid_generate_v4(),
        "email"        CHARACTER VARYING UNIQUE,
        "passwordHash" CHARACTER VARYING,
        "provider"     "public"."users_provider_enum" NOT NULL DEFAULT 'local',
        "providerId"   CHARACTER VARYING,
        "name"         CHARACTER VARYING,
        "avatarUrl"    CHARACTER VARYING,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "lastLoginAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
  }
}
