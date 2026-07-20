# ADR-016: Backend-owned catalog query and dynamic facet schema

- Status: accepted
- Date: 2026-07-20
- Owners: Server Configurator / Store API / Storefront catalog
- Depends on: ADR-002 property registry, ADR-004 provenance, ADR-006 migration safety, ADR-015 technical import

## Context

The `/servers` page previously downloaded every enabled ServerModel, decorated it with synthetic facet values and performed search, filtering and counts in React. That made counts unreliable, hid backend errors as empty arrays and could not scale. Dynamic technical properties already have a canonical owner in `PropertyDefinition`; creating a frontend filter registry would duplicate that ownership.

## Decision

`GET /store/server-configurator/catalog` is the canonical server catalog query. It accepts bounded page/limit, deterministic sort, free-text search, system filters, numeric ranges and `attr.<property-key>` dynamic filters. It returns page items, total, pagination, disjunctive facet counts, active filters, applied sort, query metadata and a content-derived `filter_schema.version`.

The loader performs a fixed six batched reads: ServerModels, PropertyDefinitions, TechnologyConcepts, aliases, scoped PropertyAssignments and a Medusa Product graph. Inherited effective values are resolved through the existing property resolver in memory. Prices, category and availability come from Medusa commerce data. Condition is included only when persisted in product metadata. Missing commerce data removes that filter definition rather than inventing a value.

Dynamic definitions are generated only from active `filterable=true` PropertyDefinitions. Enum/reference options use TechnologyConcept display names and aliases. Numeric assignment objects are normalized to the definition's canonical unit before filtering. Deprecated definitions are not public; unmapped but filterable properties remain usable without becoming Compatibility Engine inputs. Schema version changes when keys, types, definition versions or options change.

`GET /admin/server-configurator/catalog-index` exposes effective values and inheritance provenance to authenticated Admin users. PropertyDefinition create/update/delete responses run catalog index/backfill validation. Public items do not expose provenance.

The storefront obtains its initial page through the SDK, then React Query owns cancellable requests. Search is debounced; filter, search, sort and page state live in the URL. Facet controls are rendered from the backend schema and counts. Loading, error and empty states are distinct. Compare/favorites remain outside this decision and stage.

The legacy `/catalog-facets` and model `facets_json` surfaces remain temporarily compatible, but now contain only persisted ServerModel values and delegate counts to the canonical loader. Synthetic stock, condition, price, CPU/GPU, depth, warranty and delivery values are removed.

## Data and performance

Migration `Migration20260720221500` adds partial/composite indexes for enabled model ordering and common model dimensions, active filterable definitions and scoped assignments. Pagination is stable on `slug`; public limit is 1–48 and page is 1–100000. Cache policy is `public, max-age=30, stale-while-revalidate=120` and is returned in query metadata.

## Consequences

- The browser never downloads the complete model collection for catalog filtering.
- Counts and zero-result behavior share the same backend semantics as page items.
- New filterable registry properties become storefront controls without a frontend release.
- Query cost stays fixed in database round trips, while the current in-memory facet projection can later move to a materialized/search index without changing the API contract.
- Backend failures are visible to the user and are never converted to a successful empty catalog.
