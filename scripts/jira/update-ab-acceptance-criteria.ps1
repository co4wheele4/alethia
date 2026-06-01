# Update AB epics/stories: Description + Acceptance criteria (ADF in description field).
# Requires: JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN

$ErrorActionPreference = 'Stop'

$u = [EnvironmentVariableTarget]::User
$env:JIRA_URL = [Environment]::GetEnvironmentVariable('JIRA_URL', $u)
$env:JIRA_EMAIL = [Environment]::GetEnvironmentVariable('JIRA_EMAIL', $u)
$env:JIRA_API_TOKEN = [Environment]::GetEnvironmentVariable('JIRA_API_TOKEN', $u)

$pair = "$($env:JIRA_EMAIL):$($env:JIRA_API_TOKEN)"
$headers = @{
  Authorization  = "Basic $([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair)))"
  Accept         = 'application/json'
  'Content-Type' = 'application/json'
}

function New-AdfDoc {
  param([string]$Description, [string[]]$AcceptanceCriteria)
  $content = @(
    @{ type = 'heading'; attrs = @{ level = 2 }; content = @(@{ type = 'text'; text = 'Description' }) }
    @{ type = 'paragraph'; content = @(@{ type = 'text'; text = $Description }) }
    @{ type = 'heading'; attrs = @{ level = 2 }; content = @(@{ type = 'text'; text = 'Acceptance criteria' }) }
  )
  if ($AcceptanceCriteria.Count -eq 0) {
    $content += @{ type = 'paragraph'; content = @(@{ type = 'text'; text = 'None specified.' }) }
  } else {
    $items = foreach ($ac in $AcceptanceCriteria) {
      @{
        type    = 'listItem'
        content = @(@{ type = 'paragraph'; content = @(@{ type = 'text'; text = $ac }) })
      }
    }
    $content += @{ type = 'bulletList'; content = $items }
  }
  return @{ type = 'doc'; version = 1; content = $content }
}

function Update-JiraDescription {
  param([string]$Key, [string]$Description, [string[]]$AcceptanceCriteria)
  $body = @{ fields = @{ description = (New-AdfDoc $Description $AcceptanceCriteria) } } | ConvertTo-Json -Depth 15
  Invoke-RestMethod -Uri "$($env:JIRA_URL)/rest/api/3/issue/$Key" -Headers $headers -Method Put -Body $body | Out-Null
  Start-Sleep -Milliseconds 120
}

# Summary -> @{ D = description; AC = string[] }
$spec = @{
  'Production readiness & operations' = @{
    D  = 'Ship and run Aletheia safely without changing epistemic semantics. Ref: docs/ops/go-live-checklist.md'
    AC = @(
      'All child stories are Done or explicitly deferred with documented reason'
      'Go-live checklist signed with owner, date, and release SHA'
      'Required CI gates documented and green on default branch'
      'No new confidence, ranking, or inference semantics introduced'
    )
  }
  'Confirm branch protection & CI gates' = @{
    D  = 'Verify mvp-release-gate and governance-bot on default branch.'
    AC = @(
      'Ruleset requires mvp-release-gate and governance-bot by exact job name'
      'Both workflows SUCCESS on the commit tagged for release'
      'Evidence linked in docs/compliance or ops runbook (URL + SHA)'
    )
  }
  'Production env & secrets checklist' = @{
    D  = 'JWT, DATABASE_URL, secrets manager; no secrets in images/repo.'
    AC = @(
      'Checklist completed for staging and production targets'
      'Secrets only in platform secret store; none in git or container env files committed'
      'JWT and DB connectivity verified from deployed app'
    )
  }
  'Configure structural rate limiting' = @{
    D  = 'Reverse proxy/gateway 429s per production-hardening.md.'
    AC = @(
      'Rate limits configured at gateway for GraphQL and auth routes'
      '429 responses are structural (no client scoring or ban heuristics)'
      'Config documented in ops with example threshold values'
    )
  }
  'Backup / restore drill' = @{
    D  = 'Execute backup-restore-validation.md in staging.'
    AC = @(
      'Backup taken per runbook; restore completed in staging'
      'Post-restore smoke test passes (API health + sample query)'
      'Drill results recorded with date and operator'
    )
  }
  'Bundle export/import smoke test' = @{
    D  = 'Staging round-trip per ADR-031 / ADR-037.'
    AC = @(
      'exportBundle produces valid bundle on staging'
      'importBundle restores data; ADR-027 constraints respected'
      'No silent repair of validation failures; errors are explicit'
    )
  }
  'Monitoring & alerting baseline' = @{
    D  = 'DB connectivity, migrations, job depth per monitoring-and-alerting.md.'
    AC = @(
      'Alerts exist for DB down, migration failure, and critical job backlog'
      'Alerts are structural only (no epistemic quality scores)'
      'On-call runbook links from alert annotations or docs'
    )
  }
  'Go-live checklist sign-off' = @{
    D  = 'Track go-live-checklist.md items with owner/date.'
    AC = @(
      'Every checklist item has owner and completed date or waiver'
      'Waiver rationale documented for any skipped item'
      'Sign-off stored in compliance or ops doc'
    )
  }
  'Multi-tenant & deployment isolation (ADR-035)' = @{
    D  = 'Close ADMIN/bundle global-scope gap before multi-tenant production. Ref: post-mvp-roadmap section 1.1'
    AC = @(
      'Product vs ops track decision recorded (ADR or runbook)'
      'Cross-user isolation regression tests pass in CI'
      'ADR-required items either accepted or explicitly blocked'
      'No undocumented global ADMIN bundle path in production'
    )
  }
  'Spike: Product vs ops track for ADR-035' = @{
    D  = 'Workspace-scoped bundle I/O OR deployment-only ADMIN break-glass.'
    AC = @(
      'Written recommendation compares both tracks with risks'
      'Stakeholder sign-off on chosen track'
      'Follow-up stories created for chosen path'
    )
  }
  'Runbook: break-glass ADMIN bundle ops' = @{
    D  = 'Network restrictions, audit logging for importBundle/exportBundle.'
    AC = @(
      'Runbook published under docs/ops with access controls'
      'Audit events captured for each bundle operation'
      'Break-glass procedure tested once in staging'
    )
  }
  'E2E: cross-user workspace denial regression' = @{
    D  = 'Maintain workspace-isolation-adr035 in CI.'
    AC = @(
      'workspace-isolation-adr035 e2e runs in mvp-release-gate or equivalent'
      'Cross-user read/write denial assertions pass'
      'Failure blocks merge'
    )
  }
  'ADR required: Workspace entity design' = @{
    D  = 'Workspace + WorkspaceMember + workspaceId on rows (product track).'
    AC = @(
      'ADR drafted with schema sketch and migration approach'
      'ADR reviewed; status ACCEPTED or explicit deferral'
      'No implementation merged before ADR acceptance'
    )
  }
  'ADR required: Workspace-scoped bundle import/export' = @{
    D  = 'Amend ADR-031/035; no cross-tenant silent restore.'
    AC = @(
      'ADR amendments cover bundle scope and failure modes'
      'Threat model notes cross-tenant exfiltration mitigations'
      'Implementation stories blocked until ADR accepted'
    )
  }
  'Blocked-state UX & user guidance (ADR-038)' = @{
    D  = 'Structural prerequisites only; no judgment copy.'
    AC = @(
      'All child stories Done or deferred with reason'
      'Playwright adr-038 suite green'
      'No banned marketing or judgment strings in audited surfaces'
    )
  }
  'Audit all primary flows for blocked copy' = @{
    D  = 'Claims, evidence, adjudication, review queue, search empty states.'
    AC = @(
      'Inventory of screens/routes completed with copy samples'
      'Violations fixed or filed as follow-up with owner'
      'Audit checklist attached to ticket'
    )
  }
  'Standardize prerequisite messaging component' = @{
    D  = 'Reuse blocked-state-patterns.md.'
    AC = @(
      'Shared component or pattern used on at least 3 primary flows'
      'Copy describes missing structural facts only'
      'Storybook or doc example linked in PR'
    )
  }
  'Playwright: zero-evidence claim flow' = @{
    D  = 'Stress plan S1 - extend MSW + e2e.'
    AC = @(
      'E2E covers claim with zero evidence in list and detail'
      'Blocked actions show structural prerequisite text'
      'Test runs in CI chromium project'
    )
  }
  'Playwright: conflicting claims side-by-side' = @{
    D  = 'Stress plan S2 - no winner/conflict-resolved language.'
    AC = @(
      'E2E loads two claims with opposing evidence'
      'Assert absence of winner/conflict-resolved/strongest phrasing'
      'Test runs in CI'
    )
  }
  'Onboarding copy review' = @{
    D  = 'Align onboarding-principles.md; forbidden phrases.'
    AC = @(
      'Onboarding strings reviewed against forbidden list'
      'Updates merged; PR epistemic guard passes'
      'No confidence or AI-recommends language introduced'
    )
  }
  'Remove or fix search relevance UI drift' = @{
    D  = 'SearchResultExplanation per system verification section 6.'
    AC = @(
      'Component removed OR copy limited to mechanical match explanation'
      'No relevance score, rank, or best-match UI'
      'Unit/e2e updated if component retained'
    )
  }
  'Review coordination workflows (ADR-014-017, ADR-030)' = @{
    D  = 'Human coordination without coordination becoming authority.'
    AC = @(
      'Coordination UI never changes claim status without adjudication API'
      'All child stories Done or deferred'
      'Reviewer queue e2e specs green'
    )
  }
  'Review queue ergonomics' = @{
    D  = 'Filters, deterministic sort, pagination caps.'
    AC = @(
      'Queue supports filter by structural state only'
      'Sort order is deterministic and documented'
      'Pagination enforced per ADR-034 limits'
    )
  }
  'Assignment visibility improvements' = @{
    D  = 'Who assigned, when - no priority score.'
    AC = @(
      'Assignment shows reviewer, assigner, timestamp'
      'No priority score or urgency ranking displayed'
      'Accessible labels per ADR-038'
    )
  }
  'Reviewer response UX polish' = @{
    D  = 'ADR-016 paths; coordination-only labels.'
    AC = @(
      'Responses labeled coordination-only'
      'Submitting response does not adjudicate claim'
      'E2E or unit tests cover happy path'
    )
  }
  'E2E: adjudication blocked when quorum incomplete' = @{
    D  = 'Stress plan S5/S6 on real DB where feasible.'
    AC = @(
      'Mutation rejected with explicit GraphQL error code when quorum incomplete'
      'UI shows structural prerequisite (not judgment)'
      'Test runs against Postgres in CI or documented staging proof'
    )
  }
  'ADR required: Notification webhooks with claim semantics' = @{
    D  = 'Only if webhooks carry claim/evidence payloads (ADR-037).'
    AC = @(
      'ADR defines payload schema and forbidden fields'
      'Security and tenancy implications documented'
      'No webhook shipped before ADR acceptance'
    )
  }
  'Observability & audit (ADR-029)' = @{
    D  = 'Structural events only; no truth metrics.'
    AC = @(
      'Dashboards list events/error codes without truth scores'
      'Integrity job scheduled or documented'
      'Child stories complete'
    )
  }
  'Expand epistemic event catalog in UI' = @{
    D  = 'Filters by errorCode, actor, entity type.'
    AC = @(
      'Operator can filter events by code, actor, entity type'
      'No confidence or ranking columns'
      'Pagination caps enforced'
    )
  }
  'Admin read-only integrity dashboard' = @{
    D  = 'Adjudication hash chain, export audit trail.'
    AC = @(
      'Read-only view shows hash chain status and last export metadata'
      'No write actions that adjudicate from dashboard'
      'ADMIN role gated'
    )
  }
  'Scheduled integrity report job' = @{
    D  = 'Cron/operator runbook for integrity APIs.'
    AC = @(
      'Job schedule documented with owner'
      'Sample report output attached to ticket'
      'Failures alert structurally (not quality score)'
    )
  }
  'Log redaction & PII review' = @{
    D  = 'No connection strings/tokens in logs.'
    AC = @(
      'Log sampling review completed for backend and frontend servers'
      'Redaction rules documented'
      'No secrets found in sample or findings remediated'
    )
  }
  'Evidence reproducibility (ADR-026)' = @{
    D  = 'Mechanical repro checks visible and operable.'
    AC = @(
      'Repro checks schedulable and visible in UI'
      'No auto-rewrite of evidence on failure'
      'Child stories complete'
    )
  }
  'Repro check scheduling in ops' = @{
    D  = 'Document/run runEvidenceReproCheck on schedule.'
    AC = @(
      'Cron or platform job defined with frequency'
      'Runbook documents interpretation of FAILED vs fetch errors'
      'Dry run log attached'
    )
  }
  'UI: repro status on evidence detail' = @{
    D  = 'Hash match / UNKNOWN - no quality judgment.'
    AC = @(
      'Evidence detail shows latest repro status and hash match enum'
      'Copy is structural (no untrustworthy/low-quality labels)'
      'GraphQL fragment schema-faithful'
    )
  }
  'Failure taxonomy & operator runbook' = @{
    D  = 'FAILED vs fetch errors; no auto-rewrite of evidence.'
    AC = @(
      'Taxonomy doc maps statuses to operator actions'
      'Runbook explicitly forbids auto-fix of evidence content'
      'Linked from docs/ops'
    )
  }
  'E2E: repro check does not mutate evidence' = @{
    D  = 'Regression for ADR-024 immutability.'
    AC = @(
      'Test runs repro check and asserts evidence bytes unchanged'
      'CI green on PR'
    )
  }
  'Bundle import/export maturity (ADR-031, ADR-037)' = @{
    D  = 'Reliable migration and restore at scale.'
    AC = @(
      'Large bundle drill documented'
      'Validation UX and runbooks complete'
      'Fail-closed behavior verified'
    )
  }
  'Operator runbook: bundle validation failures' = @{
    D  = 'Decode ADR-037 errors for on-call.'
    AC = @(
      'Runbook lists common ADR-037 codes with remediation steps'
      'On-call drill walkthrough recorded'
    )
  }
  'Large bundle stress test (manual)' = @{
    D  = 'Stress plan S7 - staging timing/memory.'
    AC = @(
      'Test executed in staging with size and duration recorded'
      'Outcome: success or explicit fail-closed rejection (no partial silent repair)'
      'Results attached to ticket'
    )
  }
  'Bundle validation UX (admin)' = @{
    D  = 'Pre-flight errors before import commit.'
    AC = @(
      'Admin sees validation errors before destructive import'
      'Errors map to stable codes/messages'
      'No confidence or scoring in validation UI'
    )
  }
  'CI: very large bundle fixture (optional)' = @{
    D  = 'Nightly/perf - fail closed, no silent repair.'
    AC = @(
      'Fixture added or nightly job documented'
      'Pipeline fails on validation violation'
      'Runtime and memory noted in job README'
    )
  }
  'Tighten JSON Schema nested items' = @{
    D  = 'ADR-037: reject unknown keys inside array elements.'
    AC = @(
      'Schema rejects unknown keys in nested array items'
      'Unit tests cover positive and negative cases'
      'Bundle import e2e updated if needed'
    )
  }
  'Performance & scale (no new semantics)' = @{
    D  = 'Single Postgres; measure before splitting stores. Ref: post-mvp-roadmap performance bucket.'
    AC = @(
      'Baseline metrics captured and stored'
      'Pagination and limits enforced'
      'Scale spikes documented; no multi-DB ship without ADR'
    )
  }
  'Postgres performance baseline' = @{
    D  = 'Slow query log, pool sizing, hot paths.'
    AC = @(
      'Top N slow queries identified with plans'
      'Pool settings documented with rationale'
      'No change violates ADR-027/024'
    )
  }
  'Index review for ADR-033 string filters' = @{
    D  = 'EXACT/PREFIX/SUBSTRING query plans.'
    AC = @(
      'EXPLAIN plans captured for representative filters'
      'Indexes added only via migration with review'
      'No full-text rank or ts_rank introduced'
    )
  }
  'Enforce list pagination everywhere' = @{
    D  = 'ADR-034 caps on resolvers + UI.'
    AC = @(
      'Audit lists all GraphQL list fields; caps applied where missing'
      'UI handles hasMore/next cursor per contract'
      'Depth/cost limit tests still pass'
    )
  }
  'HTML crawl throughput & limits' = @{
    D  = 'maxPages, disk/time guardrails ADR-032.'
    AC = @(
      'Limits documented for operators'
      'Stress run shows deterministic stop at maxPages'
      'No summarization of crawled content added'
    )
  }
  'Multi-thousand claim workspace UX test' = @{
    D  = 'Stress S3 - deterministic order, no ranking.'
    AC = @(
      'Manual or automated test with large fixture completed'
      'Ordering remains deterministic; no rank controls'
      'Results attached'
    )
  }
  'Spike: Evidence blob offload' = @{
    D  = 'Object storage for raw_body; Postgres hash+pointer - ADR before ship.'
    AC = @(
      'Spike doc compares S3/blob vs Postgres BYTEA with cost and integrity'
      'Proposed ADR outline includes ADR-037 and ADR-024 alignment'
      'No production ship in this story'
    )
  }
  'Spike: Scale decision memo' = @{
    D  = 'When partitioning/sharding/multi-DB needs ADR.'
    AC = @(
      'Memo defines metrics thresholds for partition vs shard vs single DB'
      'References ADR-027 and bundle constraints'
      'Reviewed by tech lead'
    )
  }
  'Data integrity hardening' = @{
    D  = 'Immutable evidence vs mutable chunks gap.'
    AC = @(
      'Chunk guard implemented or explicitly deferred with ADR'
      'Residual risks documented in compliance docs'
      'Tests cover referenced-chunk update attempt'
    )
  }
  'Spike: Chunk immutability when evidence references' = @{
    D  = 'Policy or DB constraint on updateChunk.'
    AC = @(
      'Options doc: app-only vs DB trigger vs hybrid'
      'Recommendation includes migration risk'
      'Stakeholder sign-off'
    )
  }
  'Implement chunk update guard' = @{
    D  = 'App + optional DB rule; e2e tests.'
    AC = @(
      'updateChunk rejected when evidence references chunk'
      'e2e or integration test proves rejection'
      'Error code stable and documented'
    )
  }
  'Document residual integrity risks' = @{
    D  = 'Link compliance docs to operator expectations.'
    AC = @(
      'system-verification or compliance doc updated'
      'Operators know mutable chunk residual risk or mitigation'
      'Linked from ops runbook'
    )
  }
  'Test & governance automation' = @{
    D  = 'Prevent semantic drift in CI.'
    AC = @(
      'Stress-test gaps closed or tracked with owners'
      'Guardrails green on default branch'
      'ADR index checks pass on PR'
    )
  }
  'Close stress-test plan gaps' = @{
    D  = 'epistemic-stress-test-plan.md matrix.'
    AC = @(
      'Each open gap row has owner and test link or waiver'
      'At least one new automated test merged for priority gap'
      'Matrix updated in repo'
    )
  }
  'Extend query-semantics Playwright' = @{
    D  = 'New list surfaces - no sort/rank controls.'
    AC = @(
      'query-semantics.spec.ts covers new routes'
      'Asserts no forbidden sort/rank UI'
      'CI green'
    )
  }
  'PR epistemic guard: new route coverage' = @{
    D  = 'Expand static scan if high-value.'
    AC = @(
      'Guard covers new routes or patterns documented as out-of-scope'
      'False positive rate acceptable to team'
      'Documented in tools/pr-checks README'
    )
  }
  'ADR index automation on new ADRs' = @{
    D  = 'validate-adr-index + governance Jest green.'
    AC = @(
      'CI runs validate-adr-index and adr governance jest'
      'Failure blocks merge'
      'Contributor doc mentions requirement'
    )
  }
  'Ingestion & crawl (ADR-024, ADR-032)' = @{
    D  = 'Deterministic ingestion at higher volume; one DB.'
    AC = @(
      'Idempotency tests pass'
      'Crawl remains deterministic per ADR-032'
      'No second ingestion DB introduced without ADR'
    )
  }
  'Ingestion idempotency regression tests' = @{
    D  = 'Hash-based duplicate document detection.'
    AC = @(
      'Test proves duplicate content hash returns existing document'
      'No duplicate chunks created'
      'CI green'
    )
  }
  'HTML crawl ops dashboard' = @{
    D  = 'Run status, error log - no summarization.'
    AC = @(
      'Operator can view run status and per-URL fetch status'
      'Raw logs available; no generated summaries'
      'ADMIN or owner scoped'
    )
  }
  'Crawl security review' = @{
    D  = 'Sandboxed preview; no execution of stored HTML.'
    AC = @(
      'Security review checklist completed'
      'Preview uses sandbox; stored bytes not executed in DOM'
      'Findings remediated or accepted with waiver'
    )
  }
  'Async ingestion queue (optional)' = @{
    D  = 'Workers for throughput; commits still in Postgres.'
    AC = @(
      'Queue design doc reviewed'
      'Worker commits preserve ADR-024/027 in transactions'
      'Feature flagged or staging-only until proven'
    )
  }
  'Documentation & narrative (non-code)' = @{
    D  = 'Align team and stakeholders on the model.'
    AC = @(
      'Onboarding path published'
      'Narrative docs match shipped MVP'
      'Forbidden directions one-pager linked from README or START-HERE'
    )
  }
  'Engineer onboarding path' = @{
    D  = 'START-HERE-ARCHITECTS to core context to roadmap.'
    AC = @(
      'START-HERE-ARCHITECTS links core context and post-mvp roadmap'
      'New engineer walkthrough validated by second reader'
    )
  }
  'Investor/leadership narrative refresh' = @{
    D  = 'docs/narrative/* aligned with shipped MVP.'
    AC = @(
      'Narrative docs reviewed against current schema and ADRs'
      'No confidence or AI-truth claims added'
      'PR merged'
    )
  }
  'What we never add one-pager' = @{
    D  = 'Embeddings, confidence, auto-adjudication - ADR-006/022.'
    AC = @(
      'One-pager lists forbidden capabilities with ADR refs'
      'Linked from CONTRIBUTING or START-HERE'
      'Reviewed by governance owner'
    )
  }
  'ADR backlog (governance only)' = @{
    D  = 'Do not implement without ADR. Track only.'
    AC = @(
      'Each ADR ticket has owner and target quarter or deferral'
      'No implementation PRs linked without accepted ADR'
      'Backlog reviewed monthly'
    )
  }
  'ADR: Multi-tenant Workspace model' = @{
    D  = 'Changes isolation contract ADR-035.'
    AC = @(
      'ADR drafted with schema and RBAC model'
      'Security review complete'
      'Status ACCEPTED before implementation epic starts'
    )
  }
  'ADR: Object storage for evidence bodies' = @{
    D  = 'External interface + integrity ADR-037.'
    AC = @(
      'ADR covers pointer, hash, immutability, and restore'
      'Bundle format impact assessed'
      'Status ACCEPTED or REJECTED with rationale'
    )
  }
  'ADR: Database sharding / second ingestion store' = @{
    D  = 'Breaks ADR-027 / bundle / FK model.'
    AC = @(
      'ADR lists impacts on triggers, bundle, repro checks'
      'Alternative (partition/blob) compared'
      'Decision recorded; default remain single Postgres unless accepted'
    )
  }
  'ADR: Webhooks with claim/evidence payloads' = @{
    D  = 'External interface ADR-037.'
    AC = @(
      'Payload schema forbids confidence and ranking fields'
      'Tenancy and signing requirements documented'
      'Status ACCEPTED before build'
    )
  }
  'ADR: Confidence, ranking, embeddings, semantic search' = @{
    D  = 'Forbidden without architectural reset.'
    AC = @(
      'If pursued: ADR states explicit product reset and migration off current contract'
      'If not pursued: ticket closed Wont Do with link to roadmap section 3'
    )
  }
  'ADR: Relax HTML crawl determinism' = @{
    D  = 'ADR-032 amendment.'
    AC = @(
      'Amendment lists exact rule changes and test impact'
      'Status ACCEPTED before code change'
      'Determinism regression tests updated'
    )
  }
}

# Fetch all AB issues and update by summary match
$jql = [uri]::EscapeDataString('project = AB ORDER BY key ASC')
$token = $null
$updated = 0
$missed = @()

do {
  $url = "$($env:JIRA_URL)/rest/api/3/search/jql?jql=$jql&maxResults=100&fields=summary,issuetype"
  if ($token) { $url += "&nextPageToken=$([uri]::EscapeDataString($token))" }
  $page = Invoke-RestMethod -Uri $url -Headers $headers
  foreach ($issue in $page.issues) {
    $summary = $issue.fields.summary
    if (-not $spec.ContainsKey($summary)) {
      $missed += "$($issue.key): $summary"
      continue
    }
    $entry = $spec[$summary]
    Update-JiraDescription -Key $issue.key -Description $entry.D -AcceptanceCriteria $entry.AC
    $updated++
    Write-Host "Updated $($issue.key): $summary"
  }
  $token = $page.nextPageToken
} while (-not $page.isLast -and $token)

Write-Host "`nUpdated: $updated"
if ($missed.Count -gt 0) {
  Write-Host "No AC spec for:"
  $missed | ForEach-Object { Write-Host "  $_" }
}
