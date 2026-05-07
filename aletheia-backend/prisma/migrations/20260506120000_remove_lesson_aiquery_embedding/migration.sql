-- Remove legacy scaffolding tables that have no application surface.
-- ai_query_results must be dropped before ai_queries (foreign key dependency).
DROP TABLE IF EXISTS "ai_query_results";
DROP TABLE IF EXISTS "ai_queries";
DROP TABLE IF EXISTS "embeddings";
DROP TABLE IF EXISTS "lessons";
