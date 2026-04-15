# Monitoring and alerting — Aletheia

**Principle:** Measure **availability, errors, latency, and job health** — not epistemic “quality.” **ADR-029**.

---

## Safe signals (examples)

- HTTP 5xx rate, GraphQL error rate **by `extensions.code`** (structural).
- Database connectivity, migration version, queue depth for background workers.
- Crawl/repro job outcomes: **completed / failed / hash mismatch** counts (structural categories).
- Disk and CPU for ingestion workers.

---

## Forbidden as product metrics

- “Claim quality score,” “evidence strength index,” “conflict rate” as a judgment proxy.
- Embedding or NLP pipeline health tied to **truth** outcomes (there should be no such user-facing pipeline).

---

## Epistemic event stream

- `adminEpistemicEvents` (ADR-029) is for **audit and governance debugging**, not end-user dashboards about correctness.

---

## Alerts

- Page on sustained 5xx, migration failure, or reproducibility job failure spikes.
- Do **not** alert on “low average confidence” — that metric must not exist.

---

## Logs

- Structured logs with **request id**, **user id** (where applicable), **operation name**, and **error code**.
- Avoid logging full evidence bodies unless required by security policy; prefer hashes and IDs.
