import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCausesAndPreferences1714000000036 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "causes" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "slug"        VARCHAR(50) NOT NULL,
        "name"        VARCHAR(100) NOT NULL,
        "description" TEXT        NOT NULL,
        "statFact"    TEXT        NOT NULL,
        "icon"        VARCHAR(10) NOT NULL,
        "active"      BOOLEAN     NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_causes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_causes_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_cause_preferences" (
        "id"                  UUID        NOT NULL DEFAULT gen_random_uuid(),
        "userId"              UUID        NOT NULL,
        "cause1Id"            UUID,
        "cause2Id"            UUID,
        "randomDistribution"  BOOLEAN     NOT NULL DEFAULT false,
        "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_cause_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_cause_preferences_user" UNIQUE ("userId"),
        CONSTRAINT "FK_ucp_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ucp_cause1" FOREIGN KEY ("cause1Id") REFERENCES "causes"("id"),
        CONSTRAINT "FK_ucp_cause2" FOREIGN KEY ("cause2Id") REFERENCES "causes"("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "causes" ("slug", "name", "description", "statFact", "icon") VALUES
      (
        'bienestar-animal',
        'Bienestar Animal',
        'Apoyamos organizaciones que rescatan, cuidan y encuentran hogares para animales en situación de abandono en América Latina.',
        'Más de 70 millones de perros y gatos viven en condición de abandono en América Latina.',
        '🐾'
      ),
      (
        'ninez-y-juventud',
        'Niñez y Juventud',
        'Impulsamos el acceso a la educación y la lectura para niños y jóvenes que más lo necesitan.',
        '1 de cada 3 niños en América Latina no tiene acceso a libros fuera del aula escolar.',
        '📚'
      ),
      (
        'conservacion-ambiental',
        'Conservación Ambiental',
        'Contribuimos a proteger los ecosistemas y la biodiversidad de América Latina para las generaciones futuras.',
        'América Latina alberga el 40% de la biodiversidad del planeta, pero pierde más de 2,6 millones de hectáreas de bosque al año.',
        '🌿'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_cause_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "causes"`);
  }
}
