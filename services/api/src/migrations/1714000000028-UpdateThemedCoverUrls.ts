import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Points specific books and the Biblia Reina-Valera collection to locally
 * generated cover images served from /covers/ (Next.js public folder).
 *
 * Run generate_themed_covers.py first:
 *   python3 services/image-gen/scripts/generate_themed_covers.py
 */
export class UpdateThemedCoverUrls1714000000028 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Biblia Reina-Valera collection cover
    await queryRunner.query(`
      UPDATE "collections"
      SET "coverUrl" = '/covers/biblia-reina-valera.png'
      WHERE "slug" = 'biblia-reina-valera';
    `);

    // All Bible books share the same themed cover
    await queryRunner.query(`
      UPDATE "books"
      SET "coverUrl" = '/covers/biblia-reina-valera.png'
      WHERE "collection" = 'Biblia Reina-Valera';
    `);

    // Don Quijote volumes
    await queryRunner.query(`
      UPDATE "books"
      SET "coverUrl" = '/covers/quijote-vol-1.png'
      WHERE "title" ILIKE '%quijote%' AND "title" ILIKE '%vol. i%';
    `);
    await queryRunner.query(`
      UPDATE "books"
      SET "coverUrl" = '/covers/quijote-vol-2.png'
      WHERE "title" ILIKE '%quijote%' AND "title" ILIKE '%vol. ii%';
    `);

    // Don Quijote collection cover (Vol. I cover)
    await queryRunner.query(`
      UPDATE "collections"
      SET "coverUrl" = '/covers/quijote-vol-1.png'
      WHERE "slug" = 'don-quijote';
    `);

    // Don Juan Tenorio
    await queryRunner.query(`
      UPDATE "books"
      SET "coverUrl" = '/covers/don-juan-tenorio.png'
      WHERE "title" = 'Don Juan Tenorio';
    `);

    // La Divina Comedia
    await queryRunner.query(`
      UPDATE "books"
      SET "coverUrl" = '/covers/la-divina-comedia.png'
      WHERE "title" = 'La Divina Comedia';
    `);

    // El Líder que No Tenía Cargo
    await queryRunner.query(`
      UPDATE "books"
      SET "coverUrl" = '/covers/el-lider-cargo.png'
      WHERE "title" = 'El Líder que No Tenía Cargo';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Restore OpenLibrary URLs
    await queryRunner.query(`UPDATE "collections" SET "coverUrl" = 'https://covers.openlibrary.org/b/isbn/9780829748987-L.jpg' WHERE "slug" = 'biblia-reina-valera';`);
    await queryRunner.query(`UPDATE "books" SET "coverUrl" = 'https://covers.openlibrary.org/b/isbn/9780829748987-L.jpg' WHERE "collection" = 'Biblia Reina-Valera';`);
    await queryRunner.query(`UPDATE "collections" SET "coverUrl" = 'https://covers.openlibrary.org/b/id/14428305-L.jpg' WHERE "slug" = 'don-quijote';`);
    await queryRunner.query(`UPDATE "books" SET "coverUrl" = NULL WHERE "title" ILIKE '%quijote%';`);
    await queryRunner.query(`UPDATE "books" SET "coverUrl" = NULL WHERE "title" IN ('Don Juan Tenorio','La Divina Comedia','El Líder que No Tenía Cargo');`);
  }
}
