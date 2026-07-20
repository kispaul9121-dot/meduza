# ADR-017: Registry-driven storefront products and collections

Status: accepted in stage 10.

## Context

The original configurator inferred HPE chassis behavior from product names, component pages were redirected away, compare/favorites downloaded every server, and technical Component price/stock fields were presented as commerce. Those behaviors could not support another brand or preserve the ADR-011 compatibility boundary.

## Decision

### Public product boundaries

- `ServerModel` remains the public technical server identity and a linked published Medusa Product/Variant remains the commerce identity.
- `Component` is a reusable technical identity. It is not sellable unless `medusa_product_variant_id` links it to commerce. Legacy Component `price` and `stock_qty` never become public commerce facts.
- Server/component attributes are rendered from active, public `PropertyDefinition` records and their resolved values. A missing value is explicit; an informational/unmapped attribute is never a compatibility claim.

### Store APIs

- `GET /store/server-configurator/components` owns category/search/filter/sort/pagination/facets for enabled technical Components.
- `GET /store/server-configurator/components/{id}` returns one public technical identity, its normalized attributes/capabilities and separate commerce-link status.
- `GET /store/server-configurator/catalog?slugs=...` is the bounded selected-model contract for compare/favorites.
- `GET /store/server-configurator/models/{slug}` uses the same publication, commerce and public-property projection as ADR-016.

### Configurator

Configurator groups come from persisted `ConfiguratorOptionGroup` records or deterministic backend presentation groups over ADR-011 candidates. The frontend has no brand/model string conditions. Optional GPU/accelerator, boot-storage and rails groups default to explicit none when they are derived.

Storage choices expose a base model, persisted `ServerStorageOption`, or ADR-011 backplane/cage candidate. The user selects a topology; the backend resolves controller/cable requirements, conflicts, drive candidates and reason codes. Unknown requirements are returned as `not_specified`, never guessed.

### Collections

Compare accepts one to four unique slugs in `?items=`; the URL is authoritative after one local-storage hydration and is shareable/refresh-safe. Favorites remain device-local with an explicit future account-merge boundary. Both request only their selected slugs. Comparison rows combine stable server fields with comparable resolved properties and preserve `not_supported`, `not_specified` and `not_applicable` states.

## Consequences

- HPE and Dell use one PDP/configurator template.
- Components are reusable across servers without copied SKU/product records.
- ADR-011 remains the only compatibility authority and Medusa remains the only commerce authority.
- Account merge, ready-configuration persistence and cart/RFQ pricing are left to their owning stages.
- Component URLs use immutable technical IDs for now; a future public-slug migration requires redirects.
