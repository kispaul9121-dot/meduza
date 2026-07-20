# Stage 08 report — Import Pipeline and Vendor Adapters

## 1. Executive summary

- Goal: implement the single reviewed, idempotent and recoverable owner for technical vendor/Genius ingestion.
- Delivered: HPE/Dell/Supermicro adapters, raw/staged/normalized persistence, mapping/deduplication/diff preview, explicit review, dry-run, exact-permission apply, retry, reverse rollback, shared Genius manifest bridge, readiness post-validation and an Admin operator screen.
- Safety result: technical records are always disabled/draft; SKU, price, cost, inventory, categories, images, Product/Variant and publication are excluded. `NEXT_STAGE_GATE` is `GO`.

## 2. Input control

- Incoming stage-07 gate was `GO`; ADR-011, ADR-013 and ADR-014 boundaries were preserved.
- Stage 08, master orchestration, common contract, ownership map, report template and stage-07 overrides were applied.
- Branch: `codex/master-orchestrator-01-17`; incoming commit `fa718cd`.
- User-owned untracked audit/roadmap documents remained untouched and excluded.

## 3. Skills

- Reused `building-with-medusa`, `building-admin-dashboard-customizations`, Admin UI references, `react-best-practices` and `frontend-testing-debugging` from this orchestrated turn.
- Applied `supabase-postgres-best-practices`: unique idempotency identities, `timestamptz`, composite access indexes, short fixed-order writes and reverse dependency compensation.
- Prompt skills `domain-modeling`, `systematic-debugging` and `verification-before-completion` were unavailable; their outcomes were covered by typed models, pure failure tests, runtime log diagnosis, clean E2E and the full repository gate.

## 4. Data and migration

Migration `Migration20260720181456` adds:

- `server_configurator_import_batch`: source/adapter/file hash, dry-run/status/counts, warnings/errors, review/apply/rollback timestamps, schema versions, actor and Genius manifest/session links.
- `server_configurator_import_staged_record`: source identity, raw and normalized JSON, mapping/classification proposal, action/diff/evidence/confidence, review/apply states and before/after snapshots.
- `server_configurator_import_apply_attempt`: unique idempotency key, actor/status/groups, result, rollback journal, error and timestamps.

Partial/composite indexes cover active batch status/date, actor/review/date, manifest, batch/sequence, batch/review/action, stable key and batch/attempt status. Migration applied successfully against the configured PostgreSQL database.

## 5. Adapter and normalization contract

| Vendor | Source terms verified | Canonical result |
|---|---|---|
| HPE | FlexibleLOM, Smart Array, Media Bay, iLO | NIC, RAID/controller, storage topology, management concept |
| Dell | NDC, PERC, BOSS, iDRAC, riser | NIC, RAID/controller, boot storage, management concept, topology |
| Supermicro | AOC, BPN, expander, IPMI | typed component, backplane/topology, expander path, management concept |

Unknown attributes stay in raw evidence and receive informational draft PropertyDefinition proposals. Commercial fields generate a protected-boundary warning and never enter the technical mutation. New values remain data. New resource distribution/conversion/expansion behavior emits `VALIDATOR_MISSING` and blocks apply/publication.

## 6. Classification and identity

- Reusable multi-part proposals become candidate packs; required multi-part kits become assembly bundles.
- Model-specific one-part records become direct assignments. One-item packs are forbidden.
- Storage topology identity includes source, location, backplane, direct/expander mode, controller path, protocols and cables; two 16-LFF layouts with different paths remain distinct.
- Optional GPU/M.2/rails source objects become OptionGroup proposals.
- Content comparison emits create/update/unchanged/archive/block. Duplicate canonical identities block review/apply; removed source identities propose recoverable archive rather than hard delete.

## 7. Pipeline and commerce boundary

```text
extract → raw → normalize → validate → mapping → dedupe
→ preview → explicit review → transactional apply → post-validation
```

CSV/document extraction may supply structured records, but the technical owner never interprets executable code. Medusa commercial import remains separate. Mutation payloads strip SKU/price/cost/stock/inventory/category/image fields and create no Product, Variant or publication action.

## 8. Review, permission and apply

- An authenticated Admin may create/review/dry-run a batch.
- Apply and rollback additionally resolve the current Medusa user and require the exact `server-configurator-bulk-apply` metadata permission; a broad Admin without it was denied.
- Only approved rows and approved groups enter the dependency-ordered workflow.
- Creates are disabled/draft. Updates retain before-images. Archives use recoverable lifecycle/enabled state.
- One attempt key is unique; a repeated apply returns the stored result with `idempotent_replay: true`.
- Failure compensates completed writes in reverse. Operator rollback consumes the saved journal and marks rows, attempt and batch rolled back.

## 9. Genius integration

`/import-pipeline/genius-manifest` consumes Creation Manifest schema version 1, source/confidence/groups and session/manifest IDs, converts it to ordinary staged records and opens the same review UI. Genius now offers “Stage manifest for import review”; it does not own a second bulk engine or direct publication path. Its adapter dry-run reports stage 08 and the required review bridge.

## 10. Post-validation

After writes, the workflow collects affected server model IDs from reviewed payloads and calls ADR-011 `validateCompatibilityReadiness` in partial assisted-preview mode. Results are stored on the apply attempt. With component-only evidence the affected list is empty but post-validation still reports `executed: true`; publication remains separate.

## 11. Admin UI

`/app/server-configurator/import-pipeline` provides:

- HPE and Dell structured samples plus Supermicro adapter selection;
- content-hash batch list/status;
- row selection, action, confidence, warnings/blockers and apply state;
- separate expandable Raw, Normalized Proposal and Diff/Evidence panels;
- explicit approval, dry-run counts, exact permission status, apply and rollback;
- plain structured JSON data only, with an explicit no-executable-code boundary.

## 12. Runtime evidence

Authenticated API proof:

```text
dry_available=true, writes_performed=false, permission=true
applied_count=1
same idempotency key → idempotent_replay=true
rollback_status=rolled_back, restored_count=1
broad Admin without permission → NOT_ALLOWED
```

The HPE browser scenario applied two reviewed component drafts and rolled them back. The Dell API scenario applied one component and rolled it back. Cleanup removed 2 temporary users, 3 batches, 4 staged rows, 3 attempts and 5 audits; no stage test component remained.

## 13. Screenshots

- `01-vendor-source-boundary.png`: adapter/source form and explicit commerce boundary.
- `02-raw-normalized-review.png`: separate raw, normalized and diff/evidence views.
- `03-reviewed-dry-run.png`: two approved HPE rows, zero blockers and zero writes.
- `04-transactional-applied.png`: permission-gated applied draft state.
- `05-rollback-complete.png`: batch and row rollback state.

All five screenshots were generated by authenticated Playwright, visually inspected and contained no page/console errors.

## 14. Verification

| Check | Result | Evidence |
|---|---:|---|
| Import/Genius focused unit suite | 0 | 23 checks: vendor mappings, classification, identity, unknown/commercial behavior, diff, duplicate, transaction rollback, manifest bridge, permission and UI contract |
| Migration apply | 0 | serverConfigurator migration completed and links synced |
| Authenticated API lifecycle | 0 | review/dry-run/apply/retry/rollback plus permission denial |
| Authenticated Admin Playwright | 0 | 5 screenshots, zero console/page errors |
| Backend build | 0 | Medusa backend/Admin compiled; 0 errors and unchanged 83 warnings |
| `npm test` | 0 | Backend 98, storefront 12, module 1 and HTTP 1: 112 checks |
| `npm run typecheck` | 0 | Backend and storefront green |
| `npm run lint` | 0 | 0 errors; unchanged 83 backend and 22 storefront warnings |
| `npm run build` | 0 | Medusa backend/Admin and Next; 47/47 static pages |
| `npm run test:smoke` | 0 | Storefront Playwright 5/5 |
| `git diff --check` | 0 | no whitespace errors |

## 15. Risks and technical debt

- Document OCR/extraction remains an upstream concern; this stage accepts structured technical records and retains their source evidence.
- Imported pack member resolution and topology ownership require an explicit reviewed `knowledge.payload`; incomplete proposals stay blocked instead of guessing IDs.
- Fine-grained permission is stored in Medusa user metadata because the project has no broader role/permission module yet; server enforcement is exact and fail-closed.
- Existing npm config, baseline lint, Jest open-handle and local Event Bus warnings remain non-blocking and unchanged.

## 16. Definition of Done

| Criterion | Status |
|---|---|
| ImportBatch lifecycle and schema versions | Complete |
| Raw/staged/normalized separation | Complete |
| HPE/Dell/Supermicro adapters | Complete |
| Mapping, dedupe, diff and classification review | Complete |
| No one-item pack / storage path identity | Complete |
| Commercial boundary | Complete |
| Dry-run without domain writes | Complete |
| Exact-permission transactional apply | Complete |
| Idempotent retry and reverse rollback | Complete |
| Shared Genius manifest | Complete |
| ADR-011 post-validation and no publication | Complete |
| Runtime samples and cleanup | Complete |

## 17. Gate

```text
NEXT_STAGE_GATE: GO
```

```text
NEXT_STAGE_OVERRIDES:
- Reuse ADR-015 staged/imported technical entities and audit evidence; do not create a parallel vendor ingestion path.
- Preserve the commerce/publication boundary and exact bulk-apply permission.
- Treat unresolved mappings, missing owner IDs and validator gaps as blockers, never defaults.
- Keep ADR-011 as the only runtime compatibility/readiness authority after imported changes.
- Keep user-owned untracked audit/roadmap files outside stage commits.
```
