# Stage 03 report — Data Dictionary, Packs and Capabilities

## 1. Executive summary

Stage 03 replaced hard-coded domain growth boundaries with a canonical, versioned data model inside the existing `serverConfigurator` Medusa module. It adds one Property Registry, technology concepts/relations, hierarchy and scoped pack assignments, direct component assignments, capability/storage contracts, coverage reporting and future Wizard storage contracts.

The migration is additive and preserves `specs_json`; the initially generated destructive pack-table plan was rejected and corrected before use. Result: `GO`.

## 2. Input control

- Read `reports/stage-02-report.md`; input gate is `GO`.
- Preserved ADR-009 routes and `/servers/{slug}` product identity; no storefront route changed.
- Preserved stage-01 verification commands and visible warnings.
- Baseline commit: `d56aaa6`; branch: `codex/master-orchestrator-01-17`.
- Existing module contained nine legacy tables, three migrations, enum-based component types and mixed `specs_json`.
- User-owned untracked audit/roadmap documents remain untouched and excluded.

## 3. Skills

- Loaded `building-with-medusa`, `custom-modules.md`, `data-models.md` and `api-routes.md`; extended the registered camel-case module, regenerated its snapshot/migration, kept mutations in existing workflows and exposed only a protected read endpoint.
- Loaded `supabase-postgres-best-practices` plus data type, constraint, FK index and primary-key guidance. Every concrete FK column has an index; legacy references use safe `NOT VALID` rollout.
- `domain-modeling` and `verification-before-completion` are unavailable. Their required outcomes were covered by ADR-010, explicit invariants, model/migration generation, 15 unit tests, SQL plan execution, diff review and the full repository matrix.

## 4. Changed files

### Backend models and contracts

- Extended `Component`, `ComponentPack` and `ServerModel` additively.
- Added 25 DML models in `models/domain-registry.ts`.
- Added pure typed contracts/invariants and Coverage calculator in `domain-contracts.ts`.
- Registered all models and `getDomainCoverage()` in the module service.
- Updated component create/update workflows to adapt legacy writes, validate registry membership and enforce accelerator subtype.
- Expanded Admin request validation for new component types and canonical fields.
- Updated CPU pack seed to generation-based 1st/2nd Gen candidate pools; removed future creation of the combined HPE-specific CPU pack.

### API

- `GET /admin/server-configurator/domain-coverage`: authenticated read-only coverage contract for future Admin/Publishing Assistant consumers.

### Migrations

- `Migration20260720154041.ts`, additive registry-mode `Migration20260720155527.ts` and regenerated `.snapshot-server-configurator.json`.

### Tests and docs

- Domain invariant, migration safety and coverage endpoint tests.
- `docs/architecture/domain-model.md` (ADR-010, ER diagram, mappings and decision tables).

### Storefront and Admin UI

- No UI or storefront implementation.

## 5. Architecture and contracts

- `PropertyDefinition` is the sole canonical property/attribute registry; `AttributeDefinitionContract` is an alias, not a second table.
- Registries: component types, properties/values, concept types/concepts/aliases and typed relation definitions/relations.
- Hierarchy: TechnologyPlatform → VendorGenerationTemplate → ServerFamily → ServerModel → ChassisVariant/ServerStorageOption.
- `PackAssignment` generalizes `ServerModelPackAssignment` through `scope_type=server_model`; membership remains a candidate source only.
- Direct rare parts use `ServerModelComponentAssignment` with roles, selection modes, quantities, overrides and provenance.
- Capability Profile has 11 required versioned sections. Storage topology is distinct from cages, backplanes, storage options and packs.
- Configurator option groups express cardinality and a real none state; no fake component/SKU is created.
- Wizard session, dependency graph, manifest and unresolved property-link models are contracts only; no stage-06/07 UX or apply behavior was implemented.

## 6. Data safety

- Migration `Migration20260720154041` contains zero `DROP TABLE` and zero `DROP COLUMN` statements in `up()`.
- Legacy `specs_json` is retained and idempotently copied with `coalesce` into normalized/raw JSON plus adapter provenance; existing rows become `partially_normalized` rather than falsely verified.
- Existing `component_pack` and `component_pack_item` are altered/preserved, not recreated.
- Snapshot has 34 unique tables; all nine legacy tables remain.
- 20 concrete FK constraints and 64 indexes are rendered. Existing-reference FKs start `NOT VALID`: new writes are enforced while unknown old orphans cannot abort rollout.
- `down()` removes new tables/columns and restores legacy component/pack type checks; `specs_json` and pack rows remain.
- No price, stock, document or hardware fact is invented.

## 7. Verification

| Command | Result | Evidence |
|---|---:|---|
| `npx medusa db:generate serverConfigurator` | 0 | Created the two additive migrations as the model evolved; final repeat returned “No changes detected”. |
| backend/root `typecheck` | 0 | Backend and storefront 2/2; model/API/workflow types compile. |
| backend/root `lint` | 0 | 0 errors; unchanged 82 backend warnings remain visible. |
| backend `test:unit` | 0 | 4 suites, 17 tests. |
| `npm test` | 0 | Backend/storefront unit plus module and HTTP integration all passed (31 assertions in root matrix). |
| backend/root `build` | 0 | Medusa backend/Admin and Next production builds passed; 47/47 Next pages generated. |
| `npm run test:smoke` | 0 | Existing browser route/cart/mobile suite 5/5 passed. |
| migration SQL-plan unit | 0 | `up()` rendered >100 statements and `down()` >20 without a DB driver; additive/backfill/index assertions passed. |
| snapshot inventory | 0 | 34 tables, legacy tables preserved, no duplicates. |
| `git diff --check` | 0 | No whitespace errors. |

## 8. Runtime/manual scenarios

- Legacy component payload becomes normalized/raw copies with `legacy_specs_json_v1` provenance and remains readable through `specs_json`.
- Accelerator `gpu` payload passes; unknown `video` subtype is rejected.
- Platform pack inheritance resolves provenance; an explicit model exclusion removes the inherited candidate without copying all assignments.
- SFF SAS drive pack is suggested only with form factor, protocol, adapter, controller, bays and qualification; NVMe/missing-adapter/missing-controller cases are rejected with per-check reasons.
- Coverage endpoint unit scenario returns blocking unmapped property findings.
- Storefront direct/refresh/history/cart/mobile/404 behavior remained green after backend changes.

## 9. Security and permissions

- Coverage route is under Medusa’s protected `/admin/*` boundary and is read-only.
- Validator/fact keys are identifiers only; no Admin/import JSON is executed as code.
- Component mutations validate a registered enabled type. Physical types require bootstrap validator contracts; license/service may remain informational.
- No storefront-to-database access, client-trusted compatibility or price behavior was added.

## 10. Unfinished and unverified

- No disposable PostgreSQL runtime is installed (`docker`, `psql`, `pg_isready` unavailable). The migration was not applied to the potentially user-owned database referenced by `.env`; live migrate → inspect → rollback → migrate remains unverified.
- SQL was validated through Medusa generation, repeat snapshot convergence, TypeScript build and executable plan/static safety tests, not a live PostgreSQL parser/server.
- Existing FK constraints are intentionally `NOT VALID`; a later data-cleanup operation must audit legacy orphans before `VALIDATE CONSTRAINT`.
- Runtime compatibility evaluation and inherited-conflict resolution belong to stage 04.
- Admin CRUD/builders and UI remain stages 05–07; import mapping/apply remains stage 08.

## 11. Risks and technical debt

- `specs_json` is retained for backward compatibility, so readers must migrate gradually to canonical fields; removing it now would lose compatibility.
- Existing brand/family/generation pack scope arrays remain readable. New inheritance must use `PackAssignment`; later stages must not treat both as independent compatibility proof.
- Old databases may contain the previously seeded combined HPE CPU pack. The seed no longer creates it, and canonical assignments must prefer separate Xeon generation packs; no user data was silently deleted.
- Existing lint/Jest open-handle/npm option warnings are unchanged and non-blocking.

## 12. Stage-specific evidence

### Entity/relationship diagram

ADR-010 in `docs/architecture/domain-model.md` contains the complete Mermaid ER diagram and ownership rules.

### Migration/backfill matrix and legacy mapping

ADR-010 records additive changes, exact legacy-to-canonical mappings, idempotency and rollback. Migration safety tests assert no legacy pack recreation and no `specs_json` deletion.

### Invariant tests

17 backend unit tests cover legacy preservation, unmapped publication blocking, registered type modes/accelerators, hierarchy exclusion, storage form/protocol/adapter/controller/bay gates, strict capability/cage/none contracts, coverage findings, API response and migration up/down safety.

### Required examples

Direct assignment:

```json
{"server_model_id":"model_r640","component_id":"gpu_kit","assignment_role":"enablement_kit","selection_mode":"advanced_only","min_quantity":0,"max_quantity":1}
```

Scoped pack assignment and inheritance:

```json
{"scope_type":"technology_platform","scope_id":"intel_xeon_2g","component_pack_id":"xeon_2g","inheritance_behavior":"inherit"}
```

```json
{"scope_type":"server_model","scope_id":"model_r640","component_pack_id":"xeon_2g","inheritance_behavior":"exclude"}
```

Unresolved property:

```json
{"key":"future.fabric","affects_compatibility":true,"fact_path":null,"validator_key":null,"effective_status":"unmapped_compatibility_property","publication_blocking":true}
```

## 13. Definition of Done

| Criterion | Status | Evidence |
|---|---|---|
| Parameters have explicit status | Complete | Property usage/lifecycle and component normalization states. |
| Pack is not compatibility | Complete | ADR, scoped candidate contract and tests. |
| Server has explicit/inherited pack assignment | Complete | `PackAssignment`, provenance and exclusion resolver. |
| GPU/FPGA/DPU/AI and boot storage supported | Complete | Registry/type schema and accelerator validation. |
| Topology/cages/backplanes/options separated | Complete | Four distinct versioned models and storage invariants. |
| Direct unique parts supported | Complete | Full `ServerModelComponentAssignment`. |
| Legacy data preserved | Complete | Additive migration, adapter and safety tests. |
| One Property/Technology Registry | Complete | Canonical models, aliases and typed relations. |
| Coverage detects unmapped/duplicates/conflicts | Complete | Service, protected endpoint and tests. |
| Wizard contracts only | Complete | Five storage contracts; no UX/apply behavior. |

## 14. Gate

```text
NEXT_STAGE_GATE: GO
```

Independent review initially found missing controller evaluation and two Coverage categories. They were corrected and the complete verification matrix was rerun successfully.

## 15. Next-stage overrides

```text
NEXT_STAGE_OVERRIDES:
- Treat PropertyDefinition as the only canonical property registry; do not create a parallel AttributeDefinition table.
- PackAssignment is candidate provenance, never compatibility proof; stage 04 alone resolves runtime compatibility.
- Consume normalized/raw/requirements/provides/consumes/applicability fields while preserving legacy specs_json reads.
- Resolve inheritance broad-to-narrow and preserve explicit exclusions and provenance.
- Use TechnologyConcept aliases and typed relations rather than pairwise server-to-component compatibility links.
- Preserve ADR-009 routes and the stage-01 verification contract; keep user-owned untracked docs outside commits.
```

## 16. Handoff summary

Stage 04 has stable schemas, bootstrap registries, coverage findings, topology facts and tested pure contracts on which to implement the single Compatibility Engine. It must not duplicate registries, infer compatibility from pack membership or execute imported/Admin data as code.
