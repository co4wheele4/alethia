# Go-live checklist — Aletheia

**Purpose:** Consolidate environment and governance steps before running Aletheia in production. **Not** a substitute for your host’s runbooks.

**Last updated:** 2026-04-21

---

## 1. Repository and CI

- [ ] Default branch is protected by ruleset **`master-protection`** with required checks **`mvp-release-gate`** and **`governance-bot`** (see [`docs/compliance/final-mvp-release-readiness.md`](../compliance/final-mvp-release-readiness.md) §3.1).
- [ ] Shipping commit has both workflows **SUCCESS** on the commit you deploy (same doc §2.1 pattern).
- [ ] After any root dependency change: `npm install` at repo root and commit **`package-lock.json`** so `npm ci` stays valid in CI.

---

## 2. Database and migrations

- [ ] **Postgres** version compatible with CI (MVP gate uses Postgres 15).
- [ ] Run **`npx prisma migrate deploy`** (or your platform’s migration job) **before** rolling new app versions.
- [ ] `DATABASE_URL` and other secrets come from a **secrets manager**, not the image or repo.

---

## 3. Application configuration

- [ ] Required env vars set per [`aletheia-backend`](../context/aletheia-core-context.md) / deployment docs (JWT, DB, etc.).
- [ ] Rate limiting: configure at reverse proxy or gateway **structurally** (429s); see [`production-hardening.md`](production-hardening.md).

---

## 4. Operational validation (first run)

- [ ] **Backup / restore drill** — [`backup-restore-validation.md`](backup-restore-validation.md).
- [ ] **Bundle export/import** smoke test in a staging environment (ADR-031 / ADR-037 paths).
- [ ] **Monitoring** — [`monitoring-and-alerting.md`](monitoring-and-alerting.md); alerts are structural, not “quality scores.”

---

## 5. Security hygiene (ongoing)

- [ ] Review **Dependabot / npm audit** findings on a schedule; triage high-risk items without weakening epistemic guardrails.
- [ ] Re-check ruleset **required status checks** if workflow or job **names** change (GitHub matches by exact context name).

---

## 6. What you cannot complete from this repo alone

- Live **cloud accounts**, **DNS**, **TLS**, and **identity provider** integration.
- **Organizational** approval of ruleset bypass and admin roles.
- **Production load** and **disaster recovery** drills beyond what is scripted here.

---

## Related

- [`production-hardening.md`](production-hardening.md) — GraphQL limits, search, jobs.
- [`runbook.md`](runbook.md) — operator-facing procedures if present.
