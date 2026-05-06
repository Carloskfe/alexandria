import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookCollection1714000000024 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "books"
        ADD COLUMN IF NOT EXISTS "collection" varchar NULL;
    `);

    // Seed: group all Bible books under the "Biblia" collection by matching
    // known Bible book titles and the Reina Valera author string.
    await queryRunner.query(`
      UPDATE "books"
      SET "collection" = 'Biblia'
      WHERE "author" ILIKE '%biblia%'
         OR "author" ILIKE '%reina valera%'
         OR "title"  ILIKE '%salmos%'
         OR "title"  ILIKE '%proverbios%'
         OR "title"  ILIKE '%génesis%'
         OR "title"  ILIKE '%genesis%'
         OR "title"  ILIKE '%evangelio%'
         OR "title"  ILIKE '%apocalipsis%'
         OR "title"  ILIKE '%éxodo%'
         OR "title"  ILIKE '%exodo%';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "books" DROP COLUMN IF EXISTS "collection";`);
  }
}
