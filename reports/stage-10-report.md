# Stage 10 report — Storefront Components, Compare and Favorites

## 1. Executive summary

- Goal: deliver generic server/component product surfaces, backend-resolved storage selection, compare and favorites without vendor-specific storefront logic.
- Delivered: component catalog/PDP, one HPE/Dell server template, registry property renderers, engine-derived groups/storage choices, bounded URL compare, bounded local favorites, honest commerce/publication states, accessibility/responsive work and tests.
- Result: the storefront no longer infers HPE/DL360 behavior or exposes technical Component price/stock as commerce. `NEXT_STAGE_GATE` is `GO`.

## 2. Input control

- Read `reports/stage-09-report.md`; incoming gate was `GO`.
- Applied every incoming override: ADR-016 APIs are reused, compare/favorites fetch selected slugs only, commerce values stay Medusa-owned, ADR-011 stays the compatibility authority and user-owned audit/roadmap files remain excluded.
- Baseline was branch `codex/master-orchestrator-01-17` at stage-09 commit `af46830` with five user-owned untracked documents.

## 3. Skills

- Applied `building-storefronts`, including the custom Store API and Medusa commerce boundaries.
- Applied `react-best-practices` for server initial data, bounded client queries, abort signals and URL-owned state.
- Applied `frontend-testing-debugging` for API/runtime/browser/console checks and screenshot inspection.
- Prompt skills `composition-patterns` and `verification-before-completion` were unavailable. Their outcomes were covered by shared property/UI primitives, independent source review, full gates and runtime evidence.

## 4. Changed files

### Backend

- Component catalog loader/query and public list/detail routes.
- Catalog `slugs` control and public presentation-property projection.
- Server detail now reuses published catalog/commerce projection.
- Configurator service now returns generic groups and explicit storage choices.

### Storefront

- Canonical `/components`, category and component detail pages.
- Generic property/capability renderers and honest technical-vs-commerce states.
- Generic server PDP sections: overview, configurator, ready configurations, specifications, compatibility, documents and FAQ.
- URL compare (max four, differences-only/share/refresh) and device-local favorites with bounded fetching.
- Removed the obsolete `/components/* -> /servers` redirect and corrected canonical component navigation.

### Tests and docs

- Component/query/presentation unit tests; HPE+Dell, component, compare/favorites and mobile smoke scenarios.
- ADR-017, route inventory update, decision-log entry, screenshots and this report.
- No migration or Admin change was needed.

## 5. Architecture and contracts

ADR-017 owns the storefront boundary. `Component` is technical; a linked Medusa variant is commerce. Public component attributes come from active displayable/filterable/comparable PropertyDefinitions, with PropertyValue/assignment first and a controlled normalized-spec bridge for legacy rows.

`GET /store/server-configurator/components` returns items, pagination, canonical categories, backend facets and a versioned filter schema. Detail returns technical/product identities separately. Configurator options add `groups` and `storage_choices`; requirements/conflicts/reason codes are backend facts and unknown values remain `not_specified`.

Compare calls ADR-016 with `slugs` (max 48 at API boundary, max four in UI). Favorites calls the same bounded contract. The legacy model/options endpoints remain backward-compatible; `listConfiguratorOptions` delegates to the richer context.

## 6. Data safety

- No schema or data mutation, backfill or migration.
- New APIs are read-only. Local compare/favorite changes are recoverable browser localStorage operations.
- Component commerce projection explicitly ignores legacy technical price/stock.
- Recovery is code rollback; database loss risk is none.

## 7. Verification

| Command/check | Result | Conclusion |
|---|---:|---|
| focused component/catalog unit tests | 19/19 | aliases, categories, registry filters, commerce separation, groups, topology and selected slugs pass |
| `npm test` | 131/131 | backend 117, storefront 12, module 1 and HTTP 1 pass |
| `npm run typecheck` | exit 0 | both workspaces pass |
| `npm run lint` | exit 0 | 0 errors; baseline warnings only |
| `npm run build` | exit 0 | Medusa/Admin and Next production builds pass |
| `npm run test:smoke` | 10/10 | legacy routes plus all stage-10 browser scenarios pass |
| live Store API matrix | exit 0 | components, selected slugs, model detail, groups/storage and topology re-resolution pass |
| `git diff --check` | exit 0 | no whitespace errors |
| vendor/fake text scan | no matches | no DL360/10SFF/HPE conditions or synthetic warranty/stock/delivery strings in affected UI |

## 8. Runtime/manual scenarios

- Real database catalog returned five published servers across Dell and HPE with six fixed reads.
- Real CPU category returned 52 components; the first five were technical-only and exposed no price/currency.
- All canonical categories returned honest counts: CPU 52, memory 9, drives 9, RAID/HBA 9, network 19, PSU 12, risers 2, accessories 18; accelerators and boot storage honestly returned zero.
- Dell options returned 13 generic groups and 10 storage choices. Selecting a backplane candidate caused ADR-011 to re-resolve 9 drive suggestions and disable incompatible candidates with reason codes.
- Actual-backend Chrome rendered the Dell PDP, component catalog and mobile compare with zero console/page errors before screenshots.
- Evidence: `reports/stage-10-artifacts/components-desktop.png`, `dell-pdp-desktop.png`, `compare-mobile.png`.

## 9. Security and permissions

- Store routes use the publishable-key boundary and expose enabled technical components or published linked servers only.
- Unknown categories/filters, invalid ranges and unbounded pages fail validation; component limit is 48.
- The client sends only component IDs/quantities/explicit-none. ADR-011 recomputes compatibility and does not trust client claims.
- No Admin/import secrets, raw source payloads or unpublished server records are returned.

## 10. Unfinished and unverified

- No blocker remains for stage 10.
- Current real data has no published accelerator or boot-storage components and no Component-to-Medusa-variant links, so their UI uses verified empty/technical-only states rather than a live sellable example.
- Favorites account merge is deliberately not implemented; its local boundary is documented for the account owner.
- Ready-configuration persistence and cart/RFQ commercial calculation are intentionally deferred to stages 11 and 12.

## 11. Risks and technical debt

- Component detail URLs currently expose immutable technical IDs rather than friendly slugs.
- Component facets use six fixed in-memory reads; a search/materialized index may be warranted at very large scale, without changing the contract.
- Actual local backend CORS permits `localhost:8000`, not `127.0.0.1:8000`; runtime evidence therefore used the configured localhost origin.
- Existing npm warnings, Jest forced-exit notices, development Event Bus/Redis notices and baseline lint warnings remain non-blocking.

## 12. Stage-specific evidence

- HPE and Dell pass one smoke loop over the same PDP component and section navigation.
- Header/category routes cover CPU, memory, drives, RAID/HBA, network, accelerators, PSU, risers, boot storage and accessories.
- Compare URL is shareable/refresh-safe, capped at four, offers differences-only and links back to each configurator.
- Favorites reads only stored slugs and states its future account-merge behavior.
- Storage cards expose zones, bays, form factors, protocols, adapter status, controller/cable requirements, conflicts, technical details and reason codes without vendor string tests.
- Property rendering handles scalar, boolean, list/object/unit and explicit not-supported/not-specified/not-applicable states; informational values are labeled and not claimed compatible.

## 13. Definition of Done

| Criterion | Status | Evidence |
|---|---|---|
| Generic multi-brand server PDP | Complete | HPE+Dell smoke and no vendor-condition scan matches |
| Component catalog/categories/PDP | Complete | live counts, technical identity and component browser test |
| Technical vs commerce identity | Complete | null component commerce and honest UI/API tests |
| Backend-resolved storage topology | Complete | real selection/re-resolution and unit test |
| PropertyDefinition-based specs/filters | Complete | loader, generic renderer and tests |
| Compare 1–4 with URL/differences | Complete | browser share/refresh/difference smoke |
| Favorites persistence and bounded fetch | Complete | browser localStorage smoke and `slugs` contract |
| Honest states/accessibility/mobile | Complete | explicit DTO/UI states and mobile focus/screenshot test |

## 14. Gate

```text
NEXT_STAGE_GATE: GO
```

## 15. Next-stage overrides

```text
NEXT_STAGE_OVERRIDES:
- Consume ADR-017 server/component identity and generic property renderers; do not reintroduce copied SKUs or vendor/model conditions.
- Ready configurations in stage 11 must be separately publishable records and must reuse ADR-011 validation plus backend storage/group contracts.
- Preserve selected-slug compare/favorites fetching, real Medusa commerce and explicit empty/unmapped states.
- Do not add cart/RFQ pricing to technical Component records; stage 12 owns commercial recomputation.
- Keep user-owned untracked audit/roadmap files outside stage commits.
```

## 16. Handoff summary

Stage 11 starts with generic multi-brand PDP/configurator surfaces, a public technical component catalog and URL-safe collections. It should add only published ready configurations, reuse ADR-011 and ADR-017, and leave technical component commerce honest.
