# Stage 04 report — Universal Compatibility Engine

## 1. Executive summary

- Goal: replace model/vendor-specific compatibility branches with one generic, explainable Compatibility Engine.
- Delivered: deterministic candidate/property/relation/resource/rule resolution, ten validator families, zone/bay storage placement, generic options DTO, four side-effect-free readiness modes and server endpoint validation.
- Result: stage-specific test matrix and the repository verification contract are green. Gate is `GO`.

## 2. Input control

- Read `reports/stage-03-report.md`; incoming gate was `GO`.
- Read the stage-04 prompt plus common contract, ownership map and report template.
- Applied all incoming overrides: `PropertyDefinition` remains canonical; pack assignment remains candidate provenance; normalized fields override preserved `specs_json`; inheritance is broad-to-narrow with provenance; typed relations are used; routes from ADR-009 remain canonical.
- Baseline: branch `codex/master-orchestrator-01-17`; stage 03 commit `3ae30e6`; user-owned untracked audit/roadmap files remained untouched and excluded.

## 3. Skills

- Loaded `building-with-medusa` and its workflow/API/query references. Applied Medusa module ownership, validated request boundaries, direct service use for read-only computation and parallel query loading without per-option queries.
- Loaded `supabase-postgres-best-practices` index guidance. No schema/index change was needed; scope filters use stage-03 indexed owner/scope/model columns.
- Requested prompt skills `domain-modeling`, `systematic-debugging` and `verification-before-completion` were unavailable in this environment. Their required outcomes were covered directly by ADR-011, isolated pure resolvers, explicit failure codes and the complete verification matrix.

## 4. Changed files

### Backend

- `apps/backend/src/modules/server-configurator/engine/*`: types, facts, candidate/property/relation/resource/rule resolvers, validators, engine and readiness service.
- `apps/backend/src/modules/server-configurator/service.ts`: single domain-data loader plus validation/options/readiness entrypoints.
- Store options, validate, price and save routes/middleware/validators now consume the engine and validated payloads.
- Admin compatibility-readiness route, validator, middleware and source-of-truth inventory.

### Storefront

- `apps/storefront/src/lib/server-configurator/data.ts`: reason-coded engine option DTO fields only; no compatibility calculations were added client-side.

### Tests

- Compatibility engine, rules, readiness and API suites: 40 new assertions; backend unit total is 57.

### Docs

- ADR-011 `docs/architecture/compatibility-engine.md` and decision-log entry.

### Migrations

- None. Stage 04 consumes stage-03 canonical models and does not alter stored data.

## 5. Architecture and contracts

- Closed validator registry: CPU, memory, storage, RAID/HBA, expansion, network, accelerator/GPU, boot storage, power and cooling. Unknown keys block; no Admin/import code execution exists.
- Candidate sources: pack, direct, topology, assembly bundle, auto-added and built-in. Intersections produce one option with all provenance sources.
- Direct roles are preserved; auto-added technical assignments enter validation/snapshot state; enablement/replacement resource overrides are evaluated generically.
- Properties resolve global → platform → generation → family → model → chassis/storage option. Equal-priority contradictions are blockers with the full inheritance chain.
- Only `engine_mapped` relation types become evidence; requires/consumes resolve provider quantity and return source-backed traces. Unmapped evidence blocks publication.
- Storage places every drive instance into a concrete zone/bay, including mixed protocols, per-protocol limits and approved form-factor adapters.
- Rules use 12 whitelisted operators, Boolean composition, seven scopes and whitelisted actions. Unknown operators/actions block rather than disappearing.
- Generic options return availability/disabled, reason codes/message, maximum quantity, effective specs, bundles, conflicts, qualification and triggered rules. Drive suggestions use four explicit states.
- Backward compatibility: legacy models without canonical assignments use traced `built_in/legacy-applicability`; canonical assignment sources disable the bridge.

## 6. Data safety

- No migration, backfill, deletion or mutation was added.
- Validation and readiness are pure functions; readiness POST is computational/read-only.
- Deterministic stable sorting, merged duplicate quantities and idempotent manifest identity checks make repeated calls stable.
- Recovery is code rollback only; stored records are unchanged.
- Existing `specs_json`, price, stock and configuration data are preserved. No hardware facts are invented.

## 7. Verification

| Command | Result | Evidence |
|---|---:|---|
| `npm run typecheck` | 0 | Backend and storefront compile. |
| `npm run lint` | 0 | 0 errors; existing 82 backend and 22 storefront warnings remain visible. |
| `npm test` | 0 | Backend 57 unit, storefront 12 unit, module 1 and HTTP 1: 71 checks. |
| `npm run build` | 0 | Medusa backend/Admin and Next production builds passed; 47/47 Next pages generated. |
| `npm run test:smoke` | 0 | Playwright 5/5: metadata, redirects, navigation/history, cart cookie, mobile/404. |
| targeted engine suite | 0 | 11 tests, Jest runtime 0.344 s; full command 2.351 s. |
| 500-option performance assertion | 0 | Explainable option DTO generation completed below the enforced 2,000 ms ceiling. |
| dynamic execution scan | 0 | No `eval`, `new Function`, VM, child process or exec use in engine/API paths. |
| `git diff --check` | 0 | No whitespace errors. |

## 8. Runtime/manual scenarios

- Two SAS and two NVMe drives occupy different two-bay zones with four placement records.
- SFF drive in an LFF zone is placed only when an approved adapter is declared and returns `STORAGE_PLACED_WITH_ADAPTER`.
- A CPU from both pack and direct assignment appears once with both sources.
- Same-scope property conflict returns `PROPERTY_PRIORITY_CONFLICT`; a narrower model override wins with provenance.
- Mapped requires/provides relation resolves quantities and provider relation ID; unmapped relation blocks.
- GPU without fan/riser and boot storage without its RAID1 pair return distinct reason codes.
- Enablement kit adds resources and records replacement of a built-in component.
- Partial draft returns unresolved; production cannot consider it compatible.

## 9. Security and permissions

- Store payloads for validate/price/save are Zod-validated before handlers; missing model identity and invalid quantities are rejected.
- Admin readiness lives under Medusa's authenticated `/admin/*` boundary and performs no writes.
- Server/cart remains authoritative for compatibility and price. The client receives explanations but cannot assert validity.
- Validator keys, facts, rules and relations are interpreted by fixed registries only. Arbitrary user JavaScript is not executed.

## 10. Unfinished and unverified

- No disposable/live PostgreSQL instance is available, so the new scoped query batch was compiled and unit-tested but not profiled against production-scale database statistics.
- The legacy applicability bridge remains until canonical pack/direct assignments exist for every current model.
- Stage 05 owns Admin knowledge-base UI; stages 06–08 own Wizard UI, persisted manifests and import apply. This stage exposes their read-only contracts only.

## 11. Risks and technical debt

- Registry/reference datasets and compatibility relations are bounded at 10,000 rows per request. Model-scoped assignments, values, profiles, topologies, option groups, storage options, chassis and configurations are filtered; a later scale pass may add cache/invalidation and pagination after real cardinalities are measured.
- Legacy strings remain readable for compatibility. Production behavior only uses declared fields/mappings; completing canonical data removes the fallback.
- Existing lint, npm config, build fetch fallback and Jest open-handle warnings predate this stage and remain non-blocking/visible.

## 12. Stage-specific evidence

### Rule-resolution trace

Each entry records phase, validator, pass/fail/unresolved/applied result, reason code, component/source reference and details. Relation traces include required/provider IDs and quantities; storage traces include zone/bay/protocol/form factor/adapter; rule traces include type and action keys.

### Determinism and idempotency

- Identical normalized inputs return deep-equal results.
- Candidate sources are stable-sorted and deduplicated.
- Duplicate selected IDs merge deterministically with a warning.
- Bulk manifest identities/dependencies/cycles and `idempotent` are tested.

### Operators, scopes and actions

- Operators: equals/not-equals, four numeric comparisons, includes/not-includes, in/not-in, exists/not-exists plus and/or/not.
- Scopes: global, brand, generation, family, server model, chassis variant and component.
- Actions: block, warning, require, auto-add, limit, effective value, add/multiply price and unknown-action blocker.

### Performance and query evidence

- Model lookup is followed by parallel storage/chassis lookup and a parallel bounded/scoped registry batch; no query occurs per validator, selected component or returned option.
- Candidate resolution is performed once and reused across option previews, preventing quadratic candidate re-resolution.
- 500-option performance assertion is below two seconds; the full 11-test engine suite runs in 0.344 seconds of Jest time.

### Readiness contracts

- `guided_check`: first blocker plus repair recommendations.
- `assisted_preview`: all findings, proposed mappings and predicted effects; no write.
- `bulk_dry_run`: duplicate identity, dependency existence/cycle, schema/readiness impact and idempotency.
- `production_validation`: unmapped properties/relations, validator gaps, conflicts and partial graphs block readiness.

## 13. Definition of Done

| Criterion | Status | Evidence |
|---|---|---|
| Ordinary SKU needs no code | Complete | Data-driven candidates/specs/relations/rules and closed type validator mapping. |
| No vendor policy in core | Complete | Vendor labels are data; no brand-specific conditional policy. |
| Multiple storage zones | Complete | Per-instance placement and mixed-zone tests. |
| GPU/M.2 are first-class | Complete | Accelerator/boot validators, resource and RAID1 tests. |
| Every block is explainable | Complete | Machine reason, message, validator and trace. |
| All candidate sources participate | Complete | Resolver and provenance DTO. |
| No duplicate pack/direct option | Complete | Dedup test. |
| Zone/bay/adapter/protocol capacity | Complete | Storage placement tests and trace. |
| None/cardinality/quantity groups | Complete | Group resolver and tests. |
| Inheritance provenance/conflicts | Complete | Broad-to-narrow resolver and conflict tests. |
| Typed mapped relations | Complete | Provider/quantity trace test; unmapped blocker. |
| Generation pack is not proof | Complete | Candidate phase remains separate from validators. |
| Unmapped compatibility data blocks | Complete | Property/relation/validator tests and readiness. |

## 14. Gate

```text
NEXT_STAGE_GATE: GO
```

## 15. Next-stage overrides

```text
NEXT_STAGE_OVERRIDES:
- Reuse the stage-04 engine/readiness APIs in Admin; do not implement a second compatibility evaluator in UI.
- Treat deterministic findings and repair recommendations as separate UI sections and never auto-apply a repair.
- Preserve source_type/source_types, reason codes and trace when building knowledge-base and option editors.
- New component types select only registered validator keys; never accept executable Admin/import formulas.
- Keep stage-03 PropertyDefinition and typed relations canonical; do not add parallel property/compatibility registries.
- Keep user-owned untracked audit/roadmap files outside stage commits.
```

## 16. Handoff summary

Stage 05 can build Admin knowledge-base surfaces on the canonical stage-03 entities and the stage-04 readiness/options APIs. Compatibility, effective values, availability and repair impact must remain server-owned; Admin edits data/contracts and displays engine evidence.
