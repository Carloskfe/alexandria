import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserType1714000000001 implements MigrationInterface {
  name = 'AddUserType1714000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_usertype_enum" AS ENUM('personal', 'author', 'editorial')
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "userType" "public"."users_usertype_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "userType"`);
    await queryRunner.query(`DROP TYPE "public"."users_usertype_enum"`);
  }
}
