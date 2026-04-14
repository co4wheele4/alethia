-- ADR-032: HTML crawl ingestion (mechanical boundaries) + HTML_PAGE evidence + raw_body bytes.

DO $$ BEGIN
  ALTER TYPE "EvidenceSourceKind" ADD VALUE 'HTML_PAGE';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "raw_body" BYTEA;

DO $$ BEGIN
  CREATE TYPE "HtmlCrawlFollowMode" AS ENUM ('STRICT_ONLY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HtmlCrawlRunStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HtmlCrawlFetchStatus" AS ENUM ('SUCCESS', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "html_crawl_ingestion_runs" (
    "id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "seed_url" TEXT NOT NULL,
    "crawl_depth" INTEGER NOT NULL,
    "max_pages" INTEGER NOT NULL,
    "allowed_domains" TEXT[] NOT NULL,
    "include_query_params" BOOLEAN NOT NULL,
    "follow_mode" "HtmlCrawlFollowMode" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "status" "HtmlCrawlRunStatus" NOT NULL,
    "error_log" TEXT,

    CONSTRAINT "html_crawl_ingestion_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "html_crawl_ingestion_runs_created_by_user_id_idx" ON "html_crawl_ingestion_runs"("created_by_user_id");
CREATE INDEX IF NOT EXISTS "html_crawl_ingestion_runs_started_at_idx" ON "html_crawl_ingestion_runs"("started_at");

DO $$ BEGIN
  ALTER TABLE "html_crawl_ingestion_runs"
    ADD CONSTRAINT "html_crawl_ingestion_runs_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "html_crawl_ingestion_run_evidence" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "evidence_id" TEXT,
    "url" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "fetch_status" "HtmlCrawlFetchStatus" NOT NULL,
    "error_message" TEXT,

    CONSTRAINT "html_crawl_ingestion_run_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "html_crawl_ingestion_run_evidence_run_id_idx" ON "html_crawl_ingestion_run_evidence"("run_id");
CREATE INDEX IF NOT EXISTS "html_crawl_ingestion_run_evidence_evidence_id_idx" ON "html_crawl_ingestion_run_evidence"("evidence_id");

DO $$ BEGIN
  ALTER TABLE "html_crawl_ingestion_run_evidence"
    ADD CONSTRAINT "html_crawl_ingestion_run_evidence_run_id_fkey"
    FOREIGN KEY ("run_id") REFERENCES "html_crawl_ingestion_runs"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "html_crawl_ingestion_run_evidence"
    ADD CONSTRAINT "html_crawl_ingestion_run_evidence_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
