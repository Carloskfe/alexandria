import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingIndexes1714000000032 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // books — most-queried columns have no indexes beyond the PK
    // Composite covers: findAll (isPublished=true), free library (+ isFree=true)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_books_published_free
        ON books ("isPublished", "isFree")
    `);

    // Collection filter: WHERE collection IS NULL OR collection = '' (standalone books)
    // and WHERE collection = 'X' (collection detail page)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_books_collection
        ON books (collection)
    `);

    // Category filter on Discover page
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_books_category
        ON books (category)
    `);

    // FK with no index — used when author views their own uploads
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_books_uploaded_by
        ON books ("uploadedById")
    `);

    // subscriptions.planId FK — no index; used in admin queries and plan lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_plan
        ON subscriptions ("planId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_published_free`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_collection`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_category`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_uploaded_by`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_plan`);
  }
}
