import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCuentosSelvaLanguage1714000000031 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete the English Gutenberg version so ingestion re-fetches the Spanish Wikisource text
    await queryRunner.query(`
      DELETE FROM books WHERE title = 'Cuentos de la Selva' AND author = 'Horacio Quiroga'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: re-ingestion restores the book
  }
}
