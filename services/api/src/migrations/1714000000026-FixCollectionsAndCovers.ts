import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fixes collection assignments and canonical book ordering.
 *
 * Problems solved:
 * 1. "Los Cuatro Jinetes del Apocalipsis" (Blasco Ibáñez) was wrongly tagged
 *    Biblia by a broad %apocalipsis% pattern in migration 024.
 * 2. 12 NT books and Isaiah had collection = NULL (not caught by 024 patterns).
 * 3. Don Quijote Vol. I & II had no collection.
 * 4. Bible books had no canonical order in book_collections.
 * 5. "El Líder que No Tenía Cargo" was missing a cover URL.
 */
export class FixCollectionsAndCovers1714000000026 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Remove incorrect Biblia assignment ──────────────────────────────
    await queryRunner.query(`
      UPDATE "books"
      SET "collection" = NULL
      WHERE "author" NOT ILIKE '%anónimo%'
        AND "author" NOT ILIKE '%anonimo%'
        AND "collection" = 'Biblia';
    `);

    // ── 2. Assign Biblia to ALL canonical Bible book titles by exact name ──
    // Only books authored by 'Anónimo' to avoid false positives.
    await queryRunner.query(`
      UPDATE "books"
      SET "collection" = 'Biblia'
      WHERE ("author" ILIKE 'anónimo' OR "author" ILIKE 'anonimo')
        AND "title" IN (
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
        );
    `);

    // ── 3. Assign El Quijote collection ────────────────────────────────────
    await queryRunner.query(`
      UPDATE "books"
      SET "collection" = 'El Quijote'
      WHERE "author" ILIKE '%cervantes%'
        AND "title" ILIKE '%quijote%';
    `);

    // ── 4. Add cover for the one book missing it ───────────────────────────
    await queryRunner.query(`
      UPDATE "books"
      SET "coverUrl" = 'https://covers.openlibrary.org/b/isbn/9786070703836-L.jpg'
      WHERE "title" = 'El Líder que No Tenía Cargo'
        AND "coverUrl" IS NULL;
    `);

    // ── 5. Create El Quijote collection record ─────────────────────────────
    await queryRunner.query(`
      INSERT INTO "collections" ("id", "name", "slug", "description", "coverUrl", "createdAt")
      VALUES (
        gen_random_uuid(),
        'El Quijote',
        'el-quijote',
        'La obra maestra de Miguel de Cervantes Saavedra en dos volúmenes.',
        NULL,
        NOW()
      )
      ON CONFLICT ("slug") DO NOTHING;
    `);

    // ── 6. Seed book_collections for El Quijote (ordered by volume) ────────
    await queryRunner.query(`
      INSERT INTO "book_collections" ("id", "bookId", "collectionId", "position")
      SELECT
        gen_random_uuid(),
        b.id,
        c.id,
        CASE
          WHEN b.title ILIKE '%vol. i%'  OR b.title ILIKE '%vol i%'
            OR b.title ILIKE '%parte i%' OR b.title ILIKE '%primera%' THEN 0
          WHEN b.title ILIKE '%vol. ii%' OR b.title ILIKE '%vol ii%'
            OR b.title ILIKE '%parte ii%' OR b.title ILIKE '%segunda%' THEN 1
          ELSE 99
        END
      FROM "books" b
      CROSS JOIN (SELECT id FROM "collections" WHERE "slug" = 'el-quijote') c
      WHERE b."collection" = 'El Quijote'
      ON CONFLICT ("bookId", "collectionId") DO NOTHING;
    `);

    // ── 7. Seed book_collections for newly-added Biblia books ─────────────
    await queryRunner.query(`
      INSERT INTO "book_collections" ("id", "bookId", "collectionId", "position")
      SELECT gen_random_uuid(), b.id, c.id, 0
      FROM "books" b
      CROSS JOIN (SELECT id FROM "collections" WHERE "slug" = 'biblia') c
      WHERE b."collection" = 'Biblia'
      ON CONFLICT ("bookId", "collectionId") DO NOTHING;
    `);

    // ── 8. Set canonical Bible book positions ──────────────────────────────
    // Positions match the Protestant canon order (0-indexed).
    await queryRunner.query(`
      UPDATE "book_collections" bc
      SET "position" = canon."pos"
      FROM (
        SELECT b.id AS book_id,
          CASE b.title
            WHEN 'Génesis'           THEN 0
            WHEN 'Éxodo'             THEN 1
            WHEN 'Levítico'          THEN 2
            WHEN 'Números'           THEN 3
            WHEN 'Deuteronomio'      THEN 4
            WHEN 'Josué'             THEN 5
            WHEN 'Jueces'            THEN 6
            WHEN 'Rut'               THEN 7
            WHEN '1 Samuel'          THEN 8
            WHEN '2 Samuel'          THEN 9
            WHEN '1 Reyes'           THEN 10
            WHEN '2 Reyes'           THEN 11
            WHEN '1 Crónicas'        THEN 12
            WHEN '2 Crónicas'        THEN 13
            WHEN 'Esdras'            THEN 14
            WHEN 'Nehemías'          THEN 15
            WHEN 'Ester'             THEN 16
            WHEN 'Job'               THEN 17
            WHEN 'Salmos'            THEN 18
            WHEN 'Proverbios'        THEN 19
            WHEN 'Eclesiastés'       THEN 20
            WHEN 'Cantares'          THEN 21
            WHEN 'Isaías'            THEN 22
            WHEN 'Jeremías'          THEN 23
            WHEN 'Lamentaciones'     THEN 24
            WHEN 'Ezequiel'          THEN 25
            WHEN 'Daniel'            THEN 26
            WHEN 'Oseas'             THEN 27
            WHEN 'Joel'              THEN 28
            WHEN 'Amós'              THEN 29
            WHEN 'Abdías'            THEN 30
            WHEN 'Jonás'             THEN 31
            WHEN 'Miqueas'           THEN 32
            WHEN 'Nahúm'             THEN 33
            WHEN 'Habacuc'           THEN 34
            WHEN 'Sofonías'          THEN 35
            WHEN 'Hageo'             THEN 36
            WHEN 'Zacarías'          THEN 37
            WHEN 'Malaquías'         THEN 38
            WHEN 'Mateo'             THEN 39
            WHEN 'Marcos'            THEN 40
            WHEN 'Lucas'             THEN 41
            WHEN 'Juan'              THEN 42
            WHEN 'Hechos'            THEN 43
            WHEN 'Romanos'           THEN 44
            WHEN '1 Corintios'       THEN 45
            WHEN '2 Corintios'       THEN 46
            WHEN 'Gálatas'           THEN 47
            WHEN 'Efesios'           THEN 48
            WHEN 'Filipenses'        THEN 49
            WHEN 'Colosenses'        THEN 50
            WHEN '1 Tesalonicenses'  THEN 51
            WHEN '2 Tesalonicenses'  THEN 52
            WHEN '1 Timoteo'         THEN 53
            WHEN '2 Timoteo'         THEN 54
            WHEN 'Tito'              THEN 55
            WHEN 'Filemón'           THEN 56
            WHEN 'Hebreos'           THEN 57
            WHEN 'Santiago'          THEN 58
            WHEN '1 Pedro'           THEN 59
            WHEN '2 Pedro'           THEN 60
            WHEN '1 Juan'            THEN 61
            WHEN '2 Juan'            THEN 62
            WHEN '3 Juan'            THEN 63
            WHEN 'Judas'             THEN 64
            WHEN 'Apocalipsis'       THEN 65
            ELSE 99
          END AS pos
        FROM "books" b
        WHERE b."collection" = 'Biblia'
      ) canon
      JOIN "collections" col ON col."slug" = 'biblia'
      WHERE bc."bookId" = canon.book_id
        AND bc."collectionId" = col.id;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Revert El Quijote collection
    await queryRunner.query(`DELETE FROM "book_collections" WHERE "collectionId" IN (SELECT id FROM "collections" WHERE "slug" = 'el-quijote');`);
    await queryRunner.query(`DELETE FROM "collections" WHERE "slug" = 'el-quijote';`);
    await queryRunner.query(`UPDATE "books" SET "collection" = NULL WHERE "collection" = 'El Quijote';`);
    // Note: Biblia fixes and cover are not reverted to avoid data loss.
  }
}
