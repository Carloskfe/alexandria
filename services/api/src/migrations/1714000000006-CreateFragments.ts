import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFragments1714000000006 implements MigrationInterface {
  name = 'CreateFragments1714000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "fragments" (
        "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"           UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "bookId"           UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
        "startPhraseIndex" INTEGER NOT NULL,
        "endPhraseIndex"   INTEGER NOT NULL,
        "text"             TEXT NOT NULL,
        "note"             TEXT,
        "createdAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_fragments_user_book" ON "fragments" ("userId", "bookId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_fragments_user_book"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fragments"`);
  }
}
