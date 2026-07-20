# Stage 11 report — Ready Configurations

## 1. Executive summary

- Goal: add separately publishable, reusable server configurations with immutable technical snapshots and deterministic stale/revalidation behavior.
- Delivered: ReadyConfiguration aggregate and version table, production-validation workflows, database immutability guard, admin lifecycle/compare UI, public list/detail/clone APIs, dynamic solution pages, server-PDP integration, cart/RFQ actions and tests.
- Result: user `Configuration` remains separate and mutable; published presets reuse ADR-011/ADR-017 and expose no invented commerce. `NEXT_STAGE_GATE` is `GO`.

## 2. Input control

- Read `reports/stage-10-report.md`; incoming gate was `GO`.
- Applied all overrides: reused generic identities/property renderers and storage/group contracts, preserved honest commerce and did not put pricing into technical Component records.
- Preserved the five user-owned untracked audit/roadmap documents outside the stage diff and commit.

## 3. Skills

- Applied `building-with-medusa`, `building-admin-dashboard-customizations`, `building-storefronts`, `storefront-best-practices` and `react-best-practices`.
- The requested `domain-modeling` and `verification-before-completion` skills were unavailable; their outcomes are covered by ADR-018, immutable database constraints, focused tests, builds and runtime verification.

## 4. Changed surfaces

### Domain and persistence

- `ReadyConfiguration`: descriptive data, model/use case, price mode, publication/feature/order state, current/published version pointers, media/SEO/source/review and stale state.
- `ReadyConfigurationVersion`: immutable snapshot, engine/graph/property/pack/dependency hashes, trace/errors/warnings, origin and archive/publication timestamps.
- Additive generated migration plus indexes, unique version number and PostgreSQL trigger preventing mutation of immutable snapshot identity/content/hashes.

### Backend

- Workflow-owned create, clone, revalidate/publish, lifecycle, stale refresh and reorder mutations.
- Publish always re-runs ADR-011 production validation and blocks incompatible/unresolved results.
- `fixed`/`from` publication requires currency, base commerce link, total and component links; `request_quote` keeps null commerce honest.
- Store list/detail/clone routes recompute staleness from canonical component/property/relation/pack dependencies.

### Admin and storefront

- Admin table loads on mount and supports simulator/user-configuration creation, duplicate, validate, revalidate, publish/unpublish, archive, reorder, storefront preview and two-version comparison.
- Dynamic `/solutions` and `/solutions/[slug]` pages show use case, composition, effective specs, price/RFQ state and version evidence.
- A published snapshot can hydrate current selections, explicit-none values and topology in `/servers/[slug]?ready=…`.
- Server PDP ready section consumes backend records instead of a hardcoded placeholder.

## 5. Snapshot and stale policy

ADR-018 freezes model/topology identity, component values and schema versions, effective/inherited properties, concept IDs, relation/pack provenance, engine version and validation trace. It stores display pricing only as historical evidence. Live cart/order price and availability remain Medusa-owned.

Dependency fingerprints cover property mappings, relations/concepts, packs/items/assignments and component specs, links, price and stock. Changes return explicit reason codes (`PROPERTY_SCHEMA_CHANGED`, `RELATION_GRAPH_CHANGED`, `PACK_ASSIGNMENT_CHANGED`, `COMPONENT_OR_MODEL_CHANGED`). Removed components and changed prices therefore stale the old version instead of silently altering its snapshot.

## 6. API contract

Admin:

- `GET|POST /admin/server-configurator/ready-configurations`
- `GET|POST|DELETE /admin/server-configurator/ready-configurations/:id`
- `POST /admin/server-configurator/ready-configurations/:id/{validate|revalidate|publish|duplicate|unpublish|refresh-staleness}`
- `POST /admin/server-configurator/ready-configurations/reorder`

Store:

- `GET /store/ready-configurations`
- `GET /store/ready-configurations/:slug`
- `GET /store/ready-configurations/:slug/configurator`

Store defaults exclude stale records. Detail preserves an explicit unavailable state, and clone rejects stale/unpublished versions.

## 7. Data safety

- Migrations are additive and were generated and applied in order.
- Snapshot versions are append-only at application level and protected by a database trigger.
- Verification records were soft-deleted after the real database scenario; no catalog/domain records were changed.
- Rollback drops only the two new tables, indexes and trigger/function.

## 8. Verification

| Check | Result | Conclusion |
|---|---:|---|
| focused ReadyConfiguration unit tests | 9/9 | deterministic snapshot, clone payload, price policy and all stale classes pass |
| `npm test` | 140/140 | backend 126, storefront 12, module 1 and HTTP 1 pass |
| `npm run typecheck` | exit 0 | backend and storefront pass |
| `npm run lint` | exit 0 | zero errors; baseline warnings only after new warning fixes |
| `npm run build` | exit 0 | Medusa backend/Admin and Next production routes compile |
| migration generation + two `db:migrate` runs | exit 0 | tables, indexes and immutable trigger applied |
| real `medusa exec` workflow verification | exit 0 | draft/version create, invalid publish blocker, duplicate and cleanup pass |
| focused Playwright ready flow | 1/1 | list → PDP → clone into configurator passes |
| `npm run test:smoke` | 11/11 | all prior browser contracts plus the ready flow pass |
| live HTTP checks | 4/4 | public list, admin auth boundary, solution page and server ready section pass |
| `git diff --check` | exit 0 | no whitespace errors |

Real workflow result: Dell R640 draft stored as invalid, invalid publication blocked, duplicate snapshot hash preserved and verification rows cleaned up. Public real-data count is honestly zero because no production-valid presets have been authored yet.

Evidence: `reports/stage-11-artifacts/ready-clone.png`.

## 9. Security and permissions

- Admin routes retain Medusa admin authentication; unauthenticated live request returned 401.
- Store routes expose only `status=published`; clone additionally requires current compatible non-stale state.
- Client cannot submit a compatibility verdict. Server loads canonical records and re-runs ADR-011.
- Snapshot source/review fields are not projected by the Store presentation.

## 10. Unfinished and unverified

- No blocker remains for stage 11.
- The real database has no authored production-valid ReadyConfiguration, so actual-backend storefront verification correctly exercised the empty state; a full published example is covered by the deterministic smoke fixture.
- Stage 12 still owns live commercial recomputation and order/cart provenance. Stage 13 still owns persisted RFQ workflow.

## 11. Risks and technical debt

- Public stale evaluation loads the compatibility dependency graph per ready record. A materialized fingerprint/subscriber path may be added when preset counts grow, without changing the contract.
- `engine_version` is currently the explicit ADR-011 contract version; deployments must bump it for behavior-breaking validation changes.
- Soft-deleted versions remain audit evidence; retention policy is not yet defined.

## 12. Definition of Done

| Criterion | Status | Evidence |
|---|---|---|
| Separate ReadyConfiguration domain | Complete | two models, workflows and ADR-018 |
| Immutable canonical versions | Complete | hashes, append flow, DB trigger and tests |
| Production validation before publish | Complete | workflow blocker and real DB verification |
| Stale/revalidate for all dependencies | Complete | property/relation/pack/component/price/removal tests |
| Admin lifecycle and compare | Complete | route and version drawer UI |
| Store cards/PDP/actions/edit | Complete | dynamic routes and browser smoke |
| User Configuration separation | Complete | source clone only; no schema reuse/overwrite |
| Stage 12/13 ownership handoff | Complete | ADR-018 and overrides |

## 13. Gate

```text
NEXT_STAGE_GATE: GO
```

## 14. Next-stage overrides

```text
NEXT_STAGE_OVERRIDES:
- Stage 12 must consume ReadyConfiguration identity, published version and snapshot hash as provenance; it must not mutate ReadyConfigurationVersion.
- Recompute live price and availability from Medusa at cart/order time; never trust frozen snapshot unit/total price as checkout authority.
- Reject stale, unpublished or incompatible ready versions before cart mutation and preserve ADR-011 validation trace/reason codes.
- Keep user Configuration, ReadyConfiguration, cart/order and RFQ schemas separate; stage 13 owns persisted RFQ.
- Preserve ADR-017 technical-vs-commerce identity and keep user-owned audit/roadmap files outside stage commits.
```

## 15. Handoff summary

Stage 12 starts with immutable, separately published ready presets and a safe clone DTO. It should add only Medusa-owned live commercial calculation and cart/order provenance around the published version contract.
