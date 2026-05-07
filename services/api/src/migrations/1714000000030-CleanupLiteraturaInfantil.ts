import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupLiteraturaInfantil1714000000030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove La Edad de Oro (cascades: sync_maps, fragments, user_books, reading_progress)
    await queryRunner.query(`
      DELETE FROM books WHERE title = 'La Edad de Oro' AND author = 'José Martí'
    `);

    // Remove Fábulas y Verdades so it can be re-ingested with fixed heading markers
    await queryRunner.query(`
      DELETE FROM books WHERE title = 'Fábulas y Verdades' AND author = 'Rafael Pombo'
    `);

    // Move Cuentos de la Selva to main catalogue (Colección General)
    await queryRunner.query(`
      UPDATE books SET collection = NULL
      WHERE title = 'Cuentos de la Selva' AND author = 'Horacio Quiroga'
    `);

    // Delete Literatura Infantil collection
    await queryRunner.query(`
      DELETE FROM collections WHERE slug = 'literatura-infantil'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore collection on Cuentos de la Selva
    await queryRunner.query(`
      UPDATE books SET collection = 'Literatura Infantil'
      WHERE title = 'Cuentos de la Selva' AND author = 'Horacio Quiroga'
    `);
  }
}
