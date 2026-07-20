# ADR-009 — Canonical route strategy

Status: accepted in stage 02.

## Decision

Payloud B2B discovery routes do not use a country prefix. Commerce transaction and customer routes keep `/{countryCode}` because Medusa region, currency, cart and checkout behavior is country-scoped.

The boundary is intentional:

- B2B discovery: `/servers`, `/components`, `/solutions`, `/knowledge`, `/compare`, `/favorites`, `/rfq`.
- Commerce: `/{countryCode}/cart`, `/{countryCode}/checkout`, account, order and generic Medusa catalog routes.
- `/cart` is a region bridge: middleware resolves it to the active/default `/{countryCode}/cart` while preserving cookies.

Middleware bypasses only the declared B2B roots and static metadata. Assets and framework internals remain excluded by the matcher. Unknown non-B2B paths are country-prefixed and end in the localized 404 contract.

## Canonical product identity

`ServerModel.slug` is the public technical identity and `/servers/{slug}` is the only indexable server configurator/product URL. A Medusa Product linked by `ServerModel.medusa_product_id` is the commerce record behind that server and does not create a second public card: `/{countryCode}/products/{handle}` redirects to `/servers/{slug}` when linked. Unlinked generic Medusa products remain canonical under their localized product handle.

Variant IDs are cart/selection state, never product identity. Query parameter `view` is not a page contract.

## Implemented route inventory

| URL | Purpose | Canonical behavior | Owner |
|---|---|---|---:|
| `/servers` | B2B server catalog and filter/search state | canonical; `search` is the query key | 09–10 |
| `/servers/{slug}` | canonical ServerModel/configurator page | canonical technical product identity | 06, 10 |
| `/compare` | existing comparison surface moved from `view` | canonical page | 10 |
| `/favorites` | existing favorites surface moved from `view` | canonical page | 10 |
| `/components` | registry-driven technical component catalog | canonical component root | 10 |
| `/components/{category}` | canonical component category/alias | canonical category page | 10 |
| `/components/{category}/{id}` | technical Component identity and optional commerce link | canonical component detail | 10 |
| `/{countryCode}` | localized Medusa storefront home | canonical localized commerce | existing |
| `/{countryCode}/store` | localized generic product listing | canonical localized commerce | existing |
| `/{countryCode}/products/{handle}` | generic Medusa product | redirects when linked to ServerModel | existing / 02 |
| `/{countryCode}/categories/{...category}` | category hierarchy | localized | existing |
| `/{countryCode}/collections/{handle}` | collection listing | localized | existing |
| `/{countryCode}/cart` | region-aware Medusa cart | localized transaction URL | 12 |
| `/{countryCode}/checkout` | checkout | localized transaction URL | 12 |
| `/{countryCode}/account/*` | login/profile/orders/addresses | localized customer URL | existing |
| `/{countryCode}/order/*` | confirmation and transfer | localized order URL | existing |
| `/robots.txt`, `/sitemap.xml` | crawler metadata | never country-prefixed | 16 |

## Future route contracts

Future routes are reserved now but their feature pages are not implemented in stage 02. Until the owner stage lands, Next temporary redirects return the user to `/servers` rather than rendering misleading placeholder content.

| Route shape | Parameters | Canonical behavior | Owner stage | Temporary behavior |
|---|---|---|---:|---|
| `/solutions` | none | ready solution index | 11 | 307 to `/servers` |
| `/solutions/{slug}` | stable solution/version slug | ReadyConfiguration detail | 11 | 307 to `/servers` |
| `/knowledge` | filters in query | knowledge index | 13 | 307 to `/servers` |
| `/knowledge/{slug}` | stable content slug | content/document detail | 13 | 307 to `/servers` |
| `/rfq` | optional source/config reference | RFQ entry | 12 | 307 to `/servers` |

No route above may be reassigned to another meaning by its owner stage.

## Redirect matrix

All legacy redirects are permanent 308 canonicalization and preserve unrelated query parameters. Temporary future-route redirects are 307.

| Legacy URL | Canonical destination |
|---|---|
| `/servers?view=compare` | `/compare` |
| `/servers?view=favorites` | `/favorites` |
| `/servers?view=cart` | `/cart` then region middleware to `/{countryCode}/cart` |
| `/servers?view=ready` | `/solutions` |
| `/servers?view=components` | `/components` |
| `/servers?view=storage` | `/components/storage` |
| `/servers?view={virtualization,database,project,analogs,assembly,service}` | `/solutions/{view}` |
| `/servers?component={category}` | `/components/{category}` |
| `/servers?interface={value}` | `/components/storage?interface={value}` |
| `/servers?q={text}` | `/servers?search={text}` |

## Navigation contract

- Logo, catalog and model links always target B2B canonical paths.
- Compare and favorites are separate pages; `view` is legacy-only.
- Search writes `/servers?search=` and direct refresh must reproduce the filter.
- The cart control targets `/cart`, allowing middleware to select the region without changing the cart cookie.
- Future navigation may target reserved routes because their temporary redirect is safe; owner stages replace the redirect atomically with the real page.
- Mobile navigation exposes `aria-expanded`, closes on navigation and Escape, and keeps cart visible outside the drawer.

## Consequences

- SEO stage 16 has one server canonical and a stable hierarchy.
- Region/currency logic remains isolated to commerce flows.
- New brand/generation data does not require a route-code change.
- Stage owners may add page implementations but must not revise these URL shapes without a superseding ADR and redirect plan.
