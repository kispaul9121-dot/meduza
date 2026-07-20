# Stage 09 report — Backend Catalog, Filters and Facets

## 1. Executive summary

- Goal: remove full-model client filtering and establish one scalable backend catalog/facet contract.
- Delivered: a versioned Store API, fixed-round-trip loader, real commerce and registry facets, dynamic typed filters, deterministic pagination, URL-backed React Query storefront, Admin provenance/index diagnostics, indexes, tests and runtime evidence.
- Result: synthetic facets and silent catalog fallbacks are removed; `NEXT_STAGE_GATE` is `GO`.

## 2. Input control

- Read `reports/stage-08-report.md`; incoming gate was `GO`.
- Applied stage-08 overrides: ADR-015 technical data is reused, commerce/publication ownership is preserved, unresolved registry behavior is not guessed, ADR-011 remains the compatibility authority and user-owned audit/roadmap files are excluded.
- Read master orchestration, common contract, ownership map, report template and stage-09 prompt. Baseline branch was `codex/master-orchestrator-01-17` at `a1fe06b`.
- Scope remained catalog query/facets/pagination/storefront integration; compare, favorites, SEO filter pages and visual redesign were not changed.

## 3. Skills

- Applied `building-with-medusa` for module service, Store/Admin routes and Medusa Query graph integration.
- Applied `building-storefronts` for custom API access through `sdk.client.fetch`, explicit errors and client cache ownership.
- Applied `react-best-practices` for server initial data, React Query caching, abort signals and avoiding request waterfalls.
- Applied `supabase-postgres-best-practices` for partial/composite indexes, bounded queries, deterministic pagination and `EXPLAIN ANALYZE` checks.
- Applied `frontend-testing-debugging` for real API/browser scenarios, console/page error capture and visual inspection.
- Prompt skill `verification-before-completion` was unavailable; its required outcome was covered by focused correctness/performance tests, full gates and live evidence.

## 4. Changed files

### Backend

- `catalog-query.ts`: typed schema, parser, filters/ranges/search/sort, disjunctive counts, pagination, unit normalization and registry validation.
- `catalog-loader.ts`: six batched reads, inheritance resolution, real commerce projection and schema assembly.
- `/store/server-configurator/catalog`: canonical public endpoint with cache headers.
- `/admin/server-configurator/catalog-index`: authenticated effective-value/provenance/index diagnostics.
- Legacy models/facets compatibility now contains only persisted values and delegates counts to the canonical loader.
- PropertyDefinition mutations return index/backfill validation.

### Storefront

- `/servers` fetches one backend page and no longer downloads/filters all models.
- SDK catalog DTO/fetcher, React Query dependency, abortable requests, 350 ms search debounce, URL filters/sort/page, backend counts, loading/error/empty states, pagination and mobile all-filters drawer.

### Tests, migrations and docs

- 15 catalog unit checks plus URL/history smoke coverage and updated smoke mock.
- `Migration20260720221500` adds catalog access indexes.
- ADR-016, decision-log entry, this report and two visually inspected screenshots.

## 5. Architecture and contracts

Canonical example:

```text
GET /store/server-configurator/catalog
  ?q=dl360&brand=HPE&supported_drive_interfaces=SAS
  &price_min=3000&price_max=4000&sort=price_asc&page=1&limit=12
```

Response fields are `items`, `total`, `pagination`, `facets`, `filter_schema`, `active_filters`, `applied_sort`, `query_metadata` and `index_validation`. Dynamic filters use `attr.<PropertyDefinition.key>`; numeric bounds accept `<key>.min/.max` and documented aliases. Schema version is a hash of keys/types/property schema versions/options.

ADR-016 owns the boundary. ADR-002 remains the only property registry, ADR-015 remains technical ingestion, Medusa remains commerce owner and ADR-011 remains runtime compatibility owner. The legacy facets route is backward-compatible but no longer authoritative or synthetic.

## 6. Data safety

- Migration is additive and applied successfully. It adds indexes only; there is no destructive data/backfill mutation.
- Down migration removes only those five indexes.
- Property changes run read-only index/backfill validation and report missing coverage/orphans; no automatic guessed values are written.
- Catalog operations are read-only and idempotent. Recovery is migration rollback of indexes; risk of data loss is none.

## 7. Verification

| Command/check | Result | Conclusion |
|---|---:|---|
| focused catalog unit suite | 15/15 | combinations, OR/AND, ranges, counts, invalid input, high page, empty, registry rules, aliases, units, provenance and 10k timing pass |
| `npx medusa db:migrate` | exit 0 | catalog migration applied |
| live Store API matrix | all expected | combined 3, search 4, high page empty, zero-result empty, invalid request 400 |
| publishable-key browser Playwright | exit 0 | desktop/mobile, drawer and URL navigation; zero console/page errors |
| `npm test` | 127 checks | backend 113, storefront 12, module 1, HTTP 1; all pass |
| `npm run typecheck` | exit 0 | both workspaces pass |
| `npm run lint` | exit 0 | 0 errors; unchanged 83 backend and 22 storefront warnings |
| `npm run build` | exit 0 | backend/Admin and Next succeed; 47/47 static pages |
| `npm run test:smoke` | 6/6 | canonical routes and catalog URL history pass |
| `git diff --check` | exit 0 | no whitespace errors |
| read-only source review | clean | no client model filtering and no legacy fake facet terms |

## 8. Runtime/manual scenarios

- Live query `brand=HPE&supported_drive_interfaces=SAS&price=3000..4000` returned 3 real products, real prices/availability and backend counts.
- Search `q=dl360&sort=price_desc&limit=2` returned 4 total / 2 page items.
- Page 9999 returned total 5 and zero page items without an error; an unknown brand returned an explicit valid zero result.
- `page=0&unknown=x` returned HTTP 400 with both validation messages.
- Desktop URL `brand=HPE&price_min=3000&sort=price_asc` rendered 3 cards and restored state through history.
- Mobile `supported_drive_interfaces=SAS` opened the all-filters dialog. Evidence: `reports/evidence/stage-09/catalog-desktop-filtered.png`, `catalog-mobile-drawer.png`.

## 9. Security and permissions

- Store route exposes only enabled models linked to a published Medusa Product; draft/unlinked technical records remain outside the catalog. It requires the normal publishable-key boundary.
- Admin diagnostics use the Admin route boundary and are not exposed in public items. They contain effective values and inheritance provenance, not secrets.
- Query parser allowlists controls, definitions, sorts, page/limit and numeric/text sizes. Unknown inputs fail with HTTP 400.
- Catalog and PropertyDefinition validation perform no domain mutation; commerce and publication boundaries remain unchanged.

## 10. Unfinished and unverified

- No blocker remains for stage 09.
- The 10k performance proof exercises the pure query/facet layer rather than inserting 10k persistent ServerModels into the development database. Real PostgreSQL access paths were separately verified with `EXPLAIN ANALYZE`.
- Compare/favorites selected-item fetching is intentionally deferred to stage 10.

## 11. Risks and technical debt

- Facet projection is currently in memory after six fixed batched reads. The API contract permits a future materialized/search index if millions of records require it.
- The tiny development tables make PostgreSQL choose sequential scans for models/definitions; this is cheaper at five models/15 definitions. The scoped assignment plan uses the new index.
- Existing npm config, Jest open-handle, local Event Bus, build-time optional backend fetch and baseline lint warnings remain non-blocking and unchanged.

## 12. Stage-specific evidence

### Query plans and latency

- Live API: 26–60 ms for repeated catalog scenarios, six database/module queries, no N+1.
- Enabled models: execution 0.055 ms on five rows; planner correctly chose a sequential scan plus 25 kB quicksort for the tiny table.
- Scoped PropertyAssignments: `IDX_catalog_property_assignment_scope` index scan, execution 0.020 ms.
- Active definitions: execution 0.055 ms on 15 rows; sequential scan is cheaper at current size.
- Seeded-volume pure query: 10,000 records, six facet definitions, brand+price filters and 48-item page completed under the 1,000 ms test budget.

### Facet/count and URL correctness

- Disjunctive facets ignore their own active selection while retaining every other active filter.
- Values within one facet are OR; different facets and ranges are AND.
- Refresh/share links are server-rendered from the same URL; client changes use router history. Smoke explicitly verifies Back/Forward.
- Real schema had 29 filters: 14 system/commerce plus 15 active PropertyDefinitions. Condition was omitted because no persisted condition exists.
- Confirmed absent: warranty, delivery, GPU support/quantity, fake CPU family/depth/condition/price-range values.

## 13. Definition of Done

| Criterion | Status | Evidence |
|---|---|---|
| Browser does not receive all models | Complete | page API returns only bounded `items`; no client filtering source |
| Real facets and backend counts | Complete | live 29-filter schema and facet tests |
| Typed PropertyDefinition integration | Complete | active/filterable only, concepts/aliases, units, inheritance and version |
| Full URL state | Complete | desktop proof and 6/6 smoke history test |
| Safe scalable query layer | Complete | limit/page bounds, slug tie-break, six reads, indexes/plans/timing |
| Errors not masked | Complete | SDK catalog fetch has no catch-to-empty and explicit UI error |
| Mobile/filter UX preserved | Complete | 10 primary filters plus dynamic all-filters drawer |
| Admin provenance/backfill diagnostics | Complete | authenticated Admin endpoint and mutation validation |

## 14. Gate

```text
NEXT_STAGE_GATE: GO
```

## 15. Next-stage overrides

```text
NEXT_STAGE_OVERRIDES:
- Consume ADR-016 catalog APIs; do not restore full-model client filtering or frontend-owned facet definitions/counts.
- Keep compare/favorites URL and local-collection UX in stage 10, but fetch only the selected/current models needed by each surface.
- Preserve real Medusa commerce values, dynamic PropertyDefinition schema/version and explicit backend error states.
- Do not turn catalog attributes into a second compatibility engine; ADR-011 remains the only runtime authority.
- Keep user-owned untracked audit/roadmap files outside stage commits.
```

## 16. Handoff summary

Stage 10 starts from a working backend-owned catalog with dynamic filters and URL state. It should focus only on storefront product-detail/compare/favorites behavior, reuse the bounded catalog/selected-item contracts, and preserve the functional design freeze.
