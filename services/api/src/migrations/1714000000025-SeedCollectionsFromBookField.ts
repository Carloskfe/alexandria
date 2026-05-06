import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reads the Book.collection varchar field (added in migration 024) and
 * populates the `collections` and `book_collections` tables so the existing
 * CollectionsService / frontend can surface them.
 *
 * Idempotent: uses INSERT ... ON CONFLICT DO NOTHING throughout.
 */
export class SeedCollectionsFromBookField1714000000025 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create one row in `collections` for every distinct non-null
    //    Book.collection value that is not already there.
    await queryRunner.query(`
      INSERT INTO "collections" ("id", "name", "slug", "description", "coverUrl", "createdAt")
      SELECT
        gen_random_uuid(),
        "collection",
        lower(regexp_replace("collection", '[^a-zA-Z0-9]+', '-', 'g')),
        NULL,
        NULL,
        NOW()
      FROM (
        SELECT DISTINCT "collection"
        FROM "books"
        WHERE "collection" IS NOT NULL
      ) AS distinct_collections
      ON CONFLICT ("slug") DO NOTHING;
    `);

    // 2. Link each book to its collection via book_collections.
    await queryRunner.query(`
      INSERT INTO "book_collections" ("id", "bookId", "collectionId", "position")
      SELECT
        gen_random_uuid(),
        b.id,
        c.id,
        ROW_NUMBER() OVER (PARTITION BY b."collection" ORDER BY b."createdAt") - 1
      FROM "books" b
      JOIN "collections" c
        ON lower(regexp_replace(b."collection", '[^a-zA-Z0-9]+', '-', 'g')) = c."slug"
      WHERE b."collection" IS NOT NULL
      ON CONFLICT ("bookId", "collectionId") DO NOTHING;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Remove only the collections that were derived from Book.collection
    // (those whose slug matches a value derived from Book.collection values).
    await queryRunner.query(`
      DELETE FROM "book_collections"
      WHERE "collectionId" IN (
        SELECT c.id FROM "collections" c
        WHERE c."slug" IN (
          SELECT DISTINCT lower(regexp_replace("collection", '[^a-zA-Z0-9]+', '-', 'g'))
          FROM "books"
          WHERE "collection" IS NOT NULL
        )
      );
    `);

    await queryRunner.query(`
      DELETE FROM "collections"
      WHERE "slug" IN (
        SELECT DISTINCT lower(regexp_replace("collection", '[^a-zA-Z0-9]+', '-', 'g'))
        FROM "books"
        WHERE "collection" IS NOT NULL
      );
    `);
  }
}
