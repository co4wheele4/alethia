-- Partial unique index on anchored mentions (non-null offsets).
-- Legacy rows with NULL start/end remain unconstrained (Postgres UNIQUE treats each NULL as distinct).

-- Repoint join tables away from duplicate mention ids before deleting duplicate rows.
-- 1) Drop redundant links when the canonical mention is already linked for the same evidence.
DELETE FROM "entity_relationship_evidence_mentions" AS erm
USING (
  SELECT em."id" AS "old_id", c."canonical_id" AS "new_id"
  FROM "entity_mentions" AS em
  INNER JOIN (
    SELECT "entity_id", "chunk_id", "start_offset", "end_offset", MIN("id") AS "canonical_id"
    FROM "entity_mentions"
    WHERE "start_offset" IS NOT NULL AND "end_offset" IS NOT NULL
    GROUP BY "entity_id", "chunk_id", "start_offset", "end_offset"
  ) AS c
    ON em."entity_id" = c."entity_id"
   AND em."chunk_id" = c."chunk_id"
   AND em."start_offset" = c."start_offset"
   AND em."end_offset" = c."end_offset"
  WHERE em."id" <> c."canonical_id"
) AS dup
WHERE erm."mention_id" = dup."old_id"
  AND EXISTS (
    SELECT 1
    FROM "entity_relationship_evidence_mentions" AS keep
    WHERE keep."evidence_id" = erm."evidence_id"
      AND keep."mention_id" = dup."new_id"
  );

UPDATE "entity_relationship_evidence_mentions" AS erm
SET "mention_id" = dup."new_id"
FROM (
  SELECT em."id" AS "old_id", c."canonical_id" AS "new_id"
  FROM "entity_mentions" AS em
  INNER JOIN (
    SELECT "entity_id", "chunk_id", "start_offset", "end_offset", MIN("id") AS "canonical_id"
    FROM "entity_mentions"
    WHERE "start_offset" IS NOT NULL AND "end_offset" IS NOT NULL
    GROUP BY "entity_id", "chunk_id", "start_offset", "end_offset"
  ) AS c
    ON em."entity_id" = c."entity_id"
   AND em."chunk_id" = c."chunk_id"
   AND em."start_offset" = c."start_offset"
   AND em."end_offset" = c."end_offset"
  WHERE em."id" <> c."canonical_id"
) AS dup
WHERE erm."mention_id" = dup."old_id";

DELETE FROM "entity_relationship_evidence_mentions" AS a
USING "entity_relationship_evidence_mentions" AS b
WHERE a."evidence_id" = b."evidence_id"
  AND a."mention_id" = b."mention_id"
  AND a."ctid" > b."ctid";

-- Claim evidence <-> mention links
DELETE FROM "claim_evidence_mentions" AS cem
USING (
  SELECT em."id" AS "old_id", c."canonical_id" AS "new_id"
  FROM "entity_mentions" AS em
  INNER JOIN (
    SELECT "entity_id", "chunk_id", "start_offset", "end_offset", MIN("id") AS "canonical_id"
    FROM "entity_mentions"
    WHERE "start_offset" IS NOT NULL AND "end_offset" IS NOT NULL
    GROUP BY "entity_id", "chunk_id", "start_offset", "end_offset"
  ) AS c
    ON em."entity_id" = c."entity_id"
   AND em."chunk_id" = c."chunk_id"
   AND em."start_offset" = c."start_offset"
   AND em."end_offset" = c."end_offset"
  WHERE em."id" <> c."canonical_id"
) AS dup
WHERE cem."mention_id" = dup."old_id"
  AND EXISTS (
    SELECT 1
    FROM "claim_evidence_mentions" AS keep
    WHERE keep."evidence_id" = cem."evidence_id"
      AND keep."mention_id" = dup."new_id"
  );

UPDATE "claim_evidence_mentions" AS cem
SET "mention_id" = dup."new_id"
FROM (
  SELECT em."id" AS "old_id", c."canonical_id" AS "new_id"
  FROM "entity_mentions" AS em
  INNER JOIN (
    SELECT "entity_id", "chunk_id", "start_offset", "end_offset", MIN("id") AS "canonical_id"
    FROM "entity_mentions"
    WHERE "start_offset" IS NOT NULL AND "end_offset" IS NOT NULL
    GROUP BY "entity_id", "chunk_id", "start_offset", "end_offset"
  ) AS c
    ON em."entity_id" = c."entity_id"
   AND em."chunk_id" = c."chunk_id"
   AND em."start_offset" = c."start_offset"
   AND em."end_offset" = c."end_offset"
  WHERE em."id" <> c."canonical_id"
) AS dup
WHERE cem."mention_id" = dup."old_id";

DELETE FROM "claim_evidence_mentions" AS a
USING "claim_evidence_mentions" AS b
WHERE a."evidence_id" = b."evidence_id"
  AND a."mention_id" = b."mention_id"
  AND a."ctid" > b."ctid";

-- Remove duplicate mention rows (keep MIN(id) per span group).
DELETE FROM "entity_mentions" AS em
USING (
  SELECT "entity_id", "chunk_id", "start_offset", "end_offset", MIN("id") AS "canonical_id"
  FROM "entity_mentions"
  WHERE "start_offset" IS NOT NULL AND "end_offset" IS NOT NULL
  GROUP BY "entity_id", "chunk_id", "start_offset", "end_offset"
) AS c
WHERE em."entity_id" = c."entity_id"
  AND em."chunk_id" = c."chunk_id"
  AND em."start_offset" = c."start_offset"
  AND em."end_offset" = c."end_offset"
  AND em."id" <> c."canonical_id";

CREATE UNIQUE INDEX "entity_mentions_entity_chunk_span_partial_uniq"
ON "entity_mentions" ("entity_id", "chunk_id", "start_offset", "end_offset")
WHERE ("start_offset" IS NOT NULL AND "end_offset" IS NOT NULL);
