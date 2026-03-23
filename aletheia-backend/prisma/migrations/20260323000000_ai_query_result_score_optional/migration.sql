-- ADR-022: Make AiQueryResult.score optional (internal storage only; not exposed via GraphQL)
ALTER TABLE "ai_query_results" ALTER COLUMN "score" DROP NOT NULL;
ALTER TABLE "ai_query_results" ALTER COLUMN "score" SET DEFAULT 0;
DROP INDEX IF EXISTS "ai_query_results_score_idx";
