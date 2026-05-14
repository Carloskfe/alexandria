import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCausaToMedioAmbiente1714000000037 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "causes"
      SET "slug" = 'medio-ambiente',
          "name" = 'Medio Ambiente',
          "description" = 'Contribuimos a proteger los ecosistemas, la biodiversidad y los recursos naturales de nuestra región.'
      WHERE "slug" = 'conservacion-ambiental'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "causes"
      SET "slug" = 'conservacion-ambiental',
          "name" = 'Conservación Ambiental',
          "description" = 'Contribuimos a proteger los ecosistemas y la biodiversidad de América Latina para las generaciones futuras.'
      WHERE "slug" = 'medio-ambiente'
    `);
  }
}
