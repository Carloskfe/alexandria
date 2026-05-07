import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sets cover URLs for the three Literatura Infantil books and their collection.
 * Run after: python3 services/image-gen/scripts/generate_themed_covers.py
 */
export class LiteraturaInfantilCoverUrls1714000000029 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "books" SET "coverUrl" = '/covers/fabulas-pombo.png'
      WHERE "title" = 'Fábulas y Verdades' AND "author" = 'Rafael Pombo';
    `);

    await queryRunner.query(`
      UPDATE "books" SET "coverUrl" = '/covers/la-edad-de-oro.png'
      WHERE "title" = 'La Edad de Oro' AND "author" = 'José Martí';
    `);

    await queryRunner.query(`
      UPDATE "books" SET "coverUrl" = '/covers/cuentos-selva.png'
      WHERE "title" = 'Cuentos de la Selva' AND "author" = 'Horacio Quiroga';
    `);

    await queryRunner.query(`
      UPDATE "collections" SET "coverUrl" = '/covers/literatura-infantil.png'
      WHERE "slug" = 'literatura-infantil';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "books" SET "coverUrl" = NULL WHERE "title" = 'Fábulas y Verdades';`);
    await queryRunner.query(`UPDATE "books" SET "coverUrl" = NULL WHERE "title" = 'La Edad de Oro';`);
    await queryRunner.query(`UPDATE "books" SET "coverUrl" = NULL WHERE "title" = 'Cuentos de la Selva';`);
    await queryRunner.query(`UPDATE "collections" SET "coverUrl" = NULL WHERE "slug" = 'literatura-infantil';`);
  }
}
