import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Final collection data cleanup:
 *
 * 1. Normalize empty strings → NULL in books.collection so the
 *    standalone filter catches them even before the code fix lands.
 * 2. Assign correct collection names to books that still have NULL/''.
 * 3. Drop the stale "Biblia" collection (slug: biblia) — superseded by
 *    "Biblia Reina-Valera" (slug: biblia-reina-valera).
 * 4. Remove the Blasco Ibáñez novel from book_collections.
 * 5. Fix the Bible cover URL to a reliable Reina-Valera 1960 image.
 * 6. Seed any missing book_collections links for the two active collections.
 */
export class FixCollectionDataFinal1714000000027 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {

    // ── 1. Normalize: replace '' with NULL ─────────────────────────────────
    await queryRunner.query(`
      UPDATE "books" SET "collection" = NULL WHERE "collection" = '';
    `);

    // ── 2a. Assign Biblia Reina-Valera to all canonical Bible books ─────────
    // Uses exact title matching with no author filter to avoid encoding issues.
    await queryRunner.query(`
      UPDATE "books"
      SET "collection" = 'Biblia Reina-Valera'
      WHERE "title" IN (
        'Génesis','Éxodo','Levítico','Números','Deuteronomio',
        'Josué','Jueces','Rut','1 Samuel','2 Samuel',
        '1 Reyes','2 Reyes','1 Crónicas','2 Crónicas',
        'Esdras','Nehemías','Ester','Job',
        'Salmos','Proverbios','Eclesiastés','Cantares',
        'Isaías','Jeremías','Lamentaciones','Ezequiel','Daniel',
        'Oseas','Joel','Amós','Abdías','Jonás','Miqueas',
        'Nahúm','Habacuc','Sofonías','Hageo','Zacarías','Malaquías',
        'Mateo','Marcos','Lucas','Juan','Hechos','Romanos',
        '1 Corintios','2 Corintios','Gálatas','Efesios','Filipenses',
        'Colosenses','1 Tesalonicenses','2 Tesalonicenses',
        '1 Timoteo','2 Timoteo','Tito','Filemón',
        'Hebreos','Santiago','1 Pedro','2 Pedro',
        '1 Juan','2 Juan','3 Juan','Judas','Apocalipsis'
      )
      AND "author" NOT ILIKE '%blasco%'
      AND "author" NOT ILIKE '%ibáñez%';
    `);

    // ── 2b. Explicitly clear Blasco Ibáñez from Biblia* collections ─────────
    await queryRunner.query(`
      UPDATE "books"
      SET "collection" = NULL
      WHERE "title" = 'Los Cuatro Jinetes del Apocalipsis';
    `);

    // ── 2c. Assign Don Quijote de la Mancha to Cervantes volumes ────────────
    await queryRunner.query(`
      UPDATE "books"
      SET "collection" = 'Don Quijote de la Mancha'
      WHERE "title" ILIKE '%quijote%';
    `);

    // ── 3. Drop the stale "Biblia" collection (slug: biblia) ─────────────────
    await queryRunner.query(`
      DELETE FROM "book_collections"
      WHERE "collectionId" IN (SELECT id FROM "collections" WHERE "slug" = 'biblia');
    `);
    await queryRunner.query(`
      DELETE FROM "collections" WHERE "slug" = 'biblia';
    `);

    // ── 4. Remove Blasco Ibáñez from any Bible book_collections entry ────────
    await queryRunner.query(`
      DELETE FROM "book_collections"
      WHERE "bookId" IN (
        SELECT id FROM "books" WHERE "title" = 'Los Cuatro Jinetes del Apocalipsis'
      );
    `);

    // ── 5. Update Bible cover URL to a reliable Reina-Valera 1960 cover ──────
    await queryRunner.query(`
      UPDATE "collections"
      SET "coverUrl" = 'https://covers.openlibrary.org/b/isbn/9780829748987-L.jpg'
      WHERE "slug" = 'biblia-reina-valera';
    `);
    await queryRunner.query(`
      UPDATE "books"
      SET "coverUrl" = 'https://covers.openlibrary.org/b/isbn/9780829748987-L.jpg'
      WHERE "collection" = 'Biblia Reina-Valera';
    `);

    // ── 6. Seed missing book_collections for Biblia Reina-Valera ─────────────
    await queryRunner.query(`
      INSERT INTO "book_collections" ("id", "bookId", "collectionId", "position")
      SELECT gen_random_uuid(), b.id, c.id, 0
      FROM "books" b
      CROSS JOIN (SELECT id FROM "collections" WHERE "slug" = 'biblia-reina-valera') c
      WHERE b."collection" = 'Biblia Reina-Valera'
      ON CONFLICT ("bookId", "collectionId") DO NOTHING;
    `);

    // ── 7. Seed missing book_collections for Don Quijote ─────────────────────
    await queryRunner.query(`
      INSERT INTO "book_collections" ("id", "bookId", "collectionId", "position")
      SELECT
        gen_random_uuid(),
        b.id,
        c.id,
        CASE
          WHEN b.title ILIKE '%vol. i%' OR b.title ILIKE '%vol i%' THEN 0
          WHEN b.title ILIKE '%vol. ii%' OR b.title ILIKE '%vol ii%' THEN 1
          ELSE 99
        END
      FROM "books" b
      CROSS JOIN (SELECT id FROM "collections" WHERE "slug" = 'don-quijote') c
      WHERE b."collection" = 'Don Quijote de la Mancha'
      ON CONFLICT ("bookId", "collectionId") DO NOTHING;
    `);

    // ── 8. Re-apply canonical Bible book positions ────────────────────────────
    await queryRunner.query(`
      UPDATE "book_collections" bc
      SET "position" = canon."pos"
      FROM (
        SELECT b.id AS book_id,
          CASE b.title
            WHEN 'Génesis'          THEN 0  WHEN 'Éxodo'            THEN 1
            WHEN 'Levítico'         THEN 2  WHEN 'Números'          THEN 3
            WHEN 'Deuteronomio'     THEN 4  WHEN 'Josué'            THEN 5
            WHEN 'Jueces'           THEN 6  WHEN 'Rut'              THEN 7
            WHEN '1 Samuel'         THEN 8  WHEN '2 Samuel'         THEN 9
            WHEN '1 Reyes'          THEN 10 WHEN '2 Reyes'          THEN 11
            WHEN '1 Crónicas'       THEN 12 WHEN '2 Crónicas'       THEN 13
            WHEN 'Esdras'           THEN 14 WHEN 'Nehemías'         THEN 15
            WHEN 'Ester'            THEN 16 WHEN 'Job'              THEN 17
            WHEN 'Salmos'           THEN 18 WHEN 'Proverbios'       THEN 19
            WHEN 'Eclesiastés'      THEN 20 WHEN 'Cantares'         THEN 21
            WHEN 'Isaías'           THEN 22 WHEN 'Jeremías'         THEN 23
            WHEN 'Lamentaciones'    THEN 24 WHEN 'Ezequiel'         THEN 25
            WHEN 'Daniel'           THEN 26 WHEN 'Oseas'            THEN 27
            WHEN 'Joel'             THEN 28 WHEN 'Amós'             THEN 29
            WHEN 'Abdías'           THEN 30 WHEN 'Jonás'            THEN 31
            WHEN 'Miqueas'          THEN 32 WHEN 'Nahúm'            THEN 33
            WHEN 'Habacuc'          THEN 34 WHEN 'Sofonías'         THEN 35
            WHEN 'Hageo'            THEN 36 WHEN 'Zacarías'         THEN 37
            WHEN 'Malaquías'        THEN 38
            WHEN 'Mateo'            THEN 39 WHEN 'Marcos'           THEN 40
            WHEN 'Lucas'            THEN 41 WHEN 'Juan'             THEN 42
            WHEN 'Hechos'           THEN 43 WHEN 'Romanos'          THEN 44
            WHEN '1 Corintios'      THEN 45 WHEN '2 Corintios'      THEN 46
            WHEN 'Gálatas'          THEN 47 WHEN 'Efesios'          THEN 48
            WHEN 'Filipenses'       THEN 49 WHEN 'Colosenses'       THEN 50
            WHEN '1 Tesalonicenses' THEN 51 WHEN '2 Tesalonicenses' THEN 52
            WHEN '1 Timoteo'        THEN 53 WHEN '2 Timoteo'        THEN 54
            WHEN 'Tito'             THEN 55 WHEN 'Filemón'          THEN 56
            WHEN 'Hebreos'          THEN 57 WHEN 'Santiago'         THEN 58
            WHEN '1 Pedro'          THEN 59 WHEN '2 Pedro'          THEN 60
            WHEN '1 Juan'           THEN 61 WHEN '2 Juan'           THEN 62
            WHEN '3 Juan'           THEN 63 WHEN 'Judas'            THEN 64
            WHEN 'Apocalipsis'      THEN 65
            ELSE 99
          END AS pos
        FROM "books" b WHERE b."collection" = 'Biblia Reina-Valera'
      ) canon
      JOIN "collections" col ON col."slug" = 'biblia-reina-valera'
      WHERE bc."bookId" = canon.book_id AND bc."collectionId" = col.id;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Restoring dropped data is not safe; this migration is one-way.
  }
}
