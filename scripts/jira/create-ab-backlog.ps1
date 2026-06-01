# One-off: create Aletheia post-MVP epics + stories in Jira project AB.
# Requires: JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN (User env vars)

$ErrorActionPreference = 'Stop'

$u = [EnvironmentVariableTarget]::User
$env:JIRA_URL = [Environment]::GetEnvironmentVariable('JIRA_URL', $u)
$env:JIRA_EMAIL = [Environment]::GetEnvironmentVariable('JIRA_EMAIL', $u)
$env:JIRA_API_TOKEN = [Environment]::GetEnvironmentVariable('JIRA_API_TOKEN', $u)

if (-not $env:JIRA_URL -or -not $env:JIRA_EMAIL -or -not $env:JIRA_API_TOKEN) {
  throw 'Set JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN in Windows User environment variables.'
}

$pair = "$($env:JIRA_EMAIL):$($env:JIRA_API_TOKEN)"
$headers = @{
  Authorization = "Basic $([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair)))"
  Accept        = 'application/json'
  'Content-Type' = 'application/json'
}

function New-AdfDescription([string]$Text) {
  return @{
    type    = 'doc'
    version = 1
    content = @(
      @{
        type    = 'paragraph'
        content = @(@{ type = 'text'; text = $Text })
      }
    )
  }
}

function New-JiraIssue {
  param(
    [string]$Summary,
    [string]$IssueType,
    [string]$Description,
    [string[]]$Labels = @(),
    [string]$ParentKey = $null
  )
  $fields = @{
    project     = @{ key = 'AB' }
    summary     = $Summary
    issuetype   = @{ name = $IssueType }
    description = (New-AdfDescription $Description)
  }
  if ($Labels.Count -gt 0) { $fields.labels = $Labels }
  if ($ParentKey) { $fields.parent = @{ key = $ParentKey } }

  $body = @{ fields = $fields } | ConvertTo-Json -Depth 12
  $r = Invoke-RestMethod -Uri "$($env:JIRA_URL)/rest/api/3/issue" -Headers $headers -Method Post -Body $body
  Start-Sleep -Milliseconds 150
  return $r.key
}

# Remove API test issues if present
foreach ($testKey in @('AB-1', 'AB-2')) {
  try {
    Invoke-RestMethod -Uri "$($env:JIRA_URL)/rest/api/3/issue/$testKey" -Headers $headers -Method Delete
    Write-Host "Deleted test issue $testKey"
  } catch { }
}

$backlog = @(
  @{
    EpicSummary = 'Production readiness & operations'
    EpicDesc    = 'Ship and run Aletheia safely without changing epistemic semantics. Ref: docs/ops/go-live-checklist.md'
    Stories     = @(
      @{ S = 'Confirm branch protection & CI gates'; D = 'Verify mvp-release-gate and governance-bot on default branch.'; L = @('ops', 'adr-safe') }
      @{ S = 'Production env & secrets checklist'; D = 'JWT, DATABASE_URL, secrets manager; no secrets in images/repo.'; L = @('ops', 'adr-safe') }
      @{ S = 'Configure structural rate limiting'; D = 'Reverse proxy/gateway 429s per production-hardening.md.'; L = @('ops', 'adr-safe') }
      @{ S = 'Backup / restore drill'; D = 'Execute backup-restore-validation.md in staging.'; L = @('ops', 'adr-safe') }
      @{ S = 'Bundle export/import smoke test'; D = 'Staging round-trip per ADR-031 / ADR-037.'; L = @('ops', 'adr-safe') }
      @{ S = 'Monitoring & alerting baseline'; D = 'DB connectivity, migrations, job depth per monitoring-and-alerting.md.'; L = @('ops', 'adr-safe') }
      @{ S = 'Go-live checklist sign-off'; D = 'Track go-live-checklist.md items with owner/date.'; L = @('ops', 'adr-safe') }
    )
  }
  @{
    EpicSummary = 'Multi-tenant & deployment isolation (ADR-035)'
    EpicDesc    = 'Close ADMIN/bundle global-scope gap before multi-tenant production. Ref: post-mvp-roadmap §1.1'
    Stories     = @(
      @{ S = 'Spike: Product vs ops track for ADR-035'; D = 'Workspace-scoped bundle I/O OR deployment-only ADMIN break-glass.'; L = @('adr-safe') }
      @{ S = 'Runbook: break-glass ADMIN bundle ops'; D = 'Network restrictions, audit logging for importBundle/exportBundle.'; L = @('ops', 'adr-safe') }
      @{ S = 'E2E: cross-user workspace denial regression'; D = 'Maintain workspace-isolation-adr035 in CI.'; L = @('e2e', 'adr-safe') }
      @{ S = 'ADR required: Workspace entity design'; D = 'Workspace + WorkspaceMember + workspaceId on rows (product track).'; L = @('adr-required') }
      @{ S = 'ADR required: Workspace-scoped bundle import/export'; D = 'Amend ADR-031/035; no cross-tenant silent restore.'; L = @('adr-required') }
    )
  }
  @{
    EpicSummary = 'Blocked-state UX & user guidance (ADR-038)'
    EpicDesc    = 'Structural prerequisites only; no judgment copy.'
    Stories     = @(
      @{ S = 'Audit all primary flows for blocked copy'; D = 'Claims, evidence, adjudication, review queue, search empty states.'; L = @('adr-safe') }
      @{ S = 'Standardize prerequisite messaging component'; D = 'Reuse blocked-state-patterns.md.'; L = @('adr-safe') }
      @{ S = 'Playwright: zero-evidence claim flow'; D = 'Stress plan S1  - extend MSW + e2e.'; L = @('e2e', 'adr-safe') }
      @{ S = 'Playwright: conflicting claims side-by-side'; D = 'Stress plan S2  - no winner/conflict-resolved language.'; L = @('e2e', 'adr-safe') }
      @{ S = 'Onboarding copy review'; D = 'Align onboarding-principles.md; forbidden phrases.'; L = @('adr-safe') }
      @{ S = 'Remove or fix search relevance UI drift'; D = 'SearchResultExplanation per system verification section 6.'; L = @('adr-safe') }
    )
  }
  @{
    EpicSummary = 'Review coordination workflows (ADR-014-017, ADR-030)'
    EpicDesc    = 'Human coordination without coordination becoming authority.'
    Stories     = @(
      @{ S = 'Review queue ergonomics'; D = 'Filters, deterministic sort, pagination caps.'; L = @('adr-safe') }
      @{ S = 'Assignment visibility improvements'; D = 'Who assigned, when  - no priority score.'; L = @('adr-safe') }
      @{ S = 'Reviewer response UX polish'; D = 'ADR-016 paths; coordination-only labels.'; L = @('adr-safe') }
      @{ S = 'E2E: adjudication blocked when quorum incomplete'; D = 'Stress plan S5/S6 on real DB where feasible.'; L = @('e2e', 'adr-safe') }
      @{ S = 'ADR required: Notification webhooks with claim semantics'; D = 'Only if webhooks carry claim/evidence payloads (ADR-037).'; L = @('adr-required') }
    )
  }
  @{
    EpicSummary = 'Observability & audit (ADR-029)'
    EpicDesc    = 'Structural events only; no truth metrics.'
    Stories     = @(
      @{ S = 'Expand epistemic event catalog in UI'; D = 'Filters by errorCode, actor, entity type.'; L = @('adr-safe') }
      @{ S = 'Admin read-only integrity dashboard'; D = 'Adjudication hash chain, export audit trail.'; L = @('adr-safe') }
      @{ S = 'Scheduled integrity report job'; D = 'Cron/operator runbook for integrity APIs.'; L = @('ops', 'adr-safe') }
      @{ S = 'Log redaction & PII review'; D = 'No connection strings/tokens in logs.'; L = @('ops', 'adr-safe') }
    )
  }
  @{
    EpicSummary = 'Evidence reproducibility (ADR-026)'
    EpicDesc    = 'Mechanical repro checks visible and operable.'
    Stories     = @(
      @{ S = 'Repro check scheduling in ops'; D = 'Document/run runEvidenceReproCheck on schedule.'; L = @('ops', 'adr-safe') }
      @{ S = 'UI: repro status on evidence detail'; D = 'Hash match / UNKNOWN  - no quality judgment.'; L = @('adr-safe') }
      @{ S = 'Failure taxonomy & operator runbook'; D = 'FAILED vs fetch errors; no auto-rewrite of evidence.'; L = @('ops', 'adr-safe') }
      @{ S = 'E2E: repro check does not mutate evidence'; D = 'Regression for ADR-024 immutability.'; L = @('e2e', 'adr-safe') }
    )
  }
  @{
    EpicSummary = 'Bundle import/export maturity (ADR-031, ADR-037)'
    EpicDesc    = 'Reliable migration and restore at scale.'
    Stories     = @(
      @{ S = 'Operator runbook: bundle validation failures'; D = 'Decode ADR-037 errors for on-call.'; L = @('ops', 'adr-safe') }
      @{ S = 'Large bundle stress test (manual)'; D = 'Stress plan S7  - staging timing/memory.'; L = @('adr-safe') }
      @{ S = 'Bundle validation UX (admin)'; D = 'Pre-flight errors before import commit.'; L = @('adr-safe') }
      @{ S = 'CI: very large bundle fixture (optional)'; D = 'Nightly/perf  - fail closed, no silent repair.'; L = @('e2e', 'adr-safe') }
      @{ S = 'Tighten JSON Schema nested items'; D = 'ADR-037: reject unknown keys inside array elements.'; L = @('adr-safe') }
    )
  }
  @{
    EpicSummary = 'Performance & scale (no new semantics)'
    EpicDesc    = 'Single Postgres; measure before splitting stores. Ref: post-mvp-roadmap performance bucket.'
    Stories     = @(
      @{ S = 'Postgres performance baseline'; D = 'Slow query log, pool sizing, hot paths.'; L = @('adr-safe') }
      @{ S = 'Index review for ADR-033 string filters'; D = 'EXACT/PREFIX/SUBSTRING query plans.'; L = @('adr-safe') }
      @{ S = 'Enforce list pagination everywhere'; D = 'ADR-034 caps on resolvers + UI.'; L = @('adr-safe') }
      @{ S = 'HTML crawl throughput & limits'; D = 'maxPages, disk/time guardrails ADR-032.'; L = @('adr-safe') }
      @{ S = 'Multi-thousand claim workspace UX test'; D = 'Stress S3  - deterministic order, no ranking.'; L = @('adr-safe') }
      @{ S = 'Spike: Evidence blob offload'; D = 'Object storage for raw_body; Postgres hash+pointer  - ADR before ship.'; L = @('adr-required') }
      @{ S = 'Spike: Scale decision memo'; D = 'When partitioning/sharding/multi-DB needs ADR.'; L = @('adr-safe') }
    )
  }
  @{
    EpicSummary = 'Data integrity hardening'
    EpicDesc    = 'Immutable evidence vs mutable chunks gap.'
    Stories     = @(
      @{ S = 'Spike: Chunk immutability when evidence references'; D = 'Policy or DB constraint on updateChunk.'; L = @('adr-safe') }
      @{ S = 'Implement chunk update guard'; D = 'App + optional DB rule; e2e tests.'; L = @('adr-safe') }
      @{ S = 'Document residual integrity risks'; D = 'Link compliance docs to operator expectations.'; L = @('adr-safe') }
    )
  }
  @{
    EpicSummary = 'Test & governance automation'
    EpicDesc    = 'Prevent semantic drift in CI.'
    Stories     = @(
      @{ S = 'Close stress-test plan gaps'; D = 'epistemic-stress-test-plan.md matrix.'; L = @('e2e', 'adr-safe') }
      @{ S = 'Extend query-semantics Playwright'; D = 'New list surfaces  - no sort/rank controls.'; L = @('e2e', 'adr-safe') }
      @{ S = 'PR epistemic guard: new route coverage'; D = 'Expand static scan if high-value.'; L = @('adr-safe') }
      @{ S = 'ADR index automation on new ADRs'; D = 'validate-adr-index + governance Jest green.'; L = @('adr-safe') }
    )
  }
  @{
    EpicSummary = 'Ingestion & crawl (ADR-024, ADR-032)'
    EpicDesc    = 'Deterministic ingestion at higher volume; one DB.'
    Stories     = @(
      @{ S = 'Ingestion idempotency regression tests'; D = 'Hash-based duplicate document detection.'; L = @('e2e', 'adr-safe') }
      @{ S = 'HTML crawl ops dashboard'; D = 'Run status, error log  - no summarization.'; L = @('adr-safe') }
      @{ S = 'Crawl security review'; D = 'Sandboxed preview; no execution of stored HTML.'; L = @('adr-safe') }
      @{ S = 'Async ingestion queue (optional)'; D = 'Workers for throughput; commits still in Postgres.'; L = @('adr-safe') }
    )
  }
  @{
    EpicSummary = 'Documentation & narrative (non-code)'
    EpicDesc    = 'Align team and stakeholders on the model.'
    Stories     = @(
      @{ S = 'Engineer onboarding path'; D = 'START-HERE-ARCHITECTS to core context to roadmap.'; L = @('adr-safe') }
      @{ S = 'Investor/leadership narrative refresh'; D = 'docs/narrative/* aligned with shipped MVP.'; L = @('adr-safe') }
      @{ S = 'What we never add one-pager'; D = 'Embeddings, confidence, auto-adjudication  - ADR-006/022.'; L = @('adr-safe') }
    )
  }
  @{
    EpicSummary = 'ADR backlog (governance only)'
    EpicDesc    = 'Do not implement without ADR. Track only.'
    Stories     = @(
      @{ S = 'ADR: Multi-tenant Workspace model'; D = 'Changes isolation contract ADR-035.'; L = @('adr-required') }
      @{ S = 'ADR: Object storage for evidence bodies'; D = 'External interface + integrity ADR-037.'; L = @('adr-required') }
      @{ S = 'ADR: Database sharding / second ingestion store'; D = 'Breaks ADR-027 / bundle / FK model.'; L = @('adr-required') }
      @{ S = 'ADR: Webhooks with claim/evidence payloads'; D = 'External interface ADR-037.'; L = @('adr-required') }
      @{ S = 'ADR: Confidence, ranking, embeddings, semantic search'; D = 'Forbidden without architectural reset.'; L = @('adr-required') }
      @{ S = 'ADR: Relax HTML crawl determinism'; D = 'ADR-032 amendment.'; L = @('adr-required') }
    )
  }
)

$created = @{ Epics = @(); Stories = @() }

foreach ($ep in $backlog) {
  $epicKey = New-JiraIssue -Summary $ep.EpicSummary -IssueType 'Epic' -Description $ep.EpicDesc
  $created.Epics += $epicKey
  Write-Host "Epic: $epicKey  - $($ep.EpicSummary)"

  foreach ($st in $ep.Stories) {
    $storyKey = New-JiraIssue -Summary $st.S -IssueType 'Story' -Description $st.D -Labels $st.L -ParentKey $epicKey
    $created.Stories += $storyKey
    Write-Host "  Story: $storyKey  - $($st.S)"
  }
}

Write-Host "`nDone. Epics: $($created.Epics.Count), Stories: $($created.Stories.Count)"
Write-Host "Backlog: $($env:JIRA_URL)/jira/software/projects/AB/boards/36/backlog"
$created | ConvertTo-Json -Depth 3 | Out-File -FilePath "$PSScriptRoot\ab-backlog-created.json" -Encoding utf8
