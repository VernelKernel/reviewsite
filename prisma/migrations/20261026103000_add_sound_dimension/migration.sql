UPDATE "Dimension"
SET "sortOrder" = "sortOrder" + 1
WHERE "family" = 'WORK'
  AND "sortOrder" >= 4;

UPDATE "Dimension"
SET "description" = 'Score and soundtrack'
WHERE "slug" = 'music';

INSERT INTO "Dimension" ("id", "slug", "name", "description", "sortOrder", "appliesTo", "family")
VALUES (
  'execution-sound',
  'sound',
  'Sound',
  'Sound design, effects, and mix',
  4,
  ARRAY['GAME', 'MOVIE']::"WorkType"[],
  'WORK'
)
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "sortOrder" = EXCLUDED."sortOrder",
  "appliesTo" = EXCLUDED."appliesTo",
  "family" = EXCLUDED."family";
