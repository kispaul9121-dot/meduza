# ADR-015: Reviewed technical import and transactional apply

- Status: accepted
- Date: 2026-07-20
- Owners: Server Configurator / Import Pipeline / Admin
- Depends on: ADR-005 import boundaries, ADR-011 compatibility engine, ADR-014 Genius manifest boundary

## Context

Vendor documentation and Genius planning can propose components, packs, topology, concepts and mappings. Source terminology is not canonical, extracted attributes may be incomplete and the same file may be submitted more than once. Technical ingestion must therefore retain evidence, surface classifications and differences, prevent duplicate or commercial writes, and recover from partial failure.

## Decision

The Server Configurator owns one technical import pipeline:

```text
extract → raw → normalize → validate → map → deduplicate
→ preview → explicit review → dry-run → compensated apply
→ ADR-011 readiness post-validation
```

`ImportBatch`, `ImportStagedRecord` and `ImportApplyAttempt` are separate persisted layers. Raw payload, normalized proposal, mapping evidence, diff, reviewer state and apply state are never collapsed. File content hashes and apply idempotency keys are unique. Database indexes cover batch/status, actor/review, manifest, staged review/action/stable identity and attempt status access paths.

HPE, Dell and Supermicro adapters translate vendor terms into canonical data. Unknown attributes remain in raw evidence and create informational draft-mapping proposals. A new value is data; a new compatibility behavior is blocked until a closed-registry validator exists. Storage identity includes location, backplane, direct/expander mode, controller path, protocol distribution and cables, so equal bay counts do not collapse distinct topologies. A one-item proposal is never a pack.

Review is explicit and row-scoped. Dry-run performs no domain write. Apply requires both an approved batch and `server-configurator-bulk-apply`; broad Admin authentication is insufficient. Approved records are applied in a fixed dependency order as disabled/draft technical entities. Every mutation records before/after evidence, an idempotent attempt and an Admin audit event. Failure compensates completed writes in reverse order. Explicit rollback uses the same saved recovery journal.

SKU, prices, costs, inventory, categories, images, Product and Variant publication are excluded. Those remain Medusa commercial/import and ADR-013 publication responsibilities. The pipeline strips commercial fields even when present in source data and returns no publication action.

The ADR-014 Creation Manifest is accepted through a bridge endpoint and becomes an ordinary reviewed import batch. Genius does not receive a second apply engine. After technical writes, affected server models are re-run through ADR-011 readiness; the result is attached to the apply attempt.

## Consequences

- Import retries are deterministic and do not duplicate domain entities.
- Reviewers can compare raw, normalized and diff evidence before any technical write.
- Vendor terminology grows through data mappings while behavior remains guarded by validators.
- Failed batches and later operator rollback are recoverable without hard-deleting pre-existing entities.
- Technical ingestion cannot accidentally alter commerce or publish a storefront configuration.
