# Stage 02 report — Canonical Routes and Navigation

## 1. Executive summary

Stage 02 established one canonical URL architecture for the Payloud B2B storefront. Discovery routes are unprefixed, Medusa commerce routes remain country-scoped, legacy query views are redirected, and linked Medusa products resolve to one canonical ServerModel URL.

Existing compare and favorites views now have distinct routes; future component, solution, knowledge and RFQ routes are contracts with temporary redirects rather than placeholder features. Result: `GO`.

## 2. Input control

- Read `reports/stage-01-report.md`; its gate is `GO`.
- Preserved the root verification command contract and visible lint debt from stage 01.
- No persisted workflow/step identifiers were changed.
- User-owned untracked audit and roadmap files in `docs/` remain untouched and excluded.
- Baseline branch: `codex/master-orchestrator-01-17`; previous atomic commit: `a008470`.

## 3. Skills

- Loaded `building-storefronts` and its frontend-integration guidance for Medusa data boundaries.
- Loaded `storefront-best-practices` with navigation, breadcrumb and design references for URL state and mobile navigation.
- Loaded `react-best-practices`; independent data fetches were parallelized with `Promise.all`.
- Loaded `frontend-testing-debugging`; route behavior was exercised through Playwright against a deterministic local Medusa mock.
- `site-architecture` and `verification-before-completion` are not installed. Their required outcomes were covered by the ADR, route table, redirect tests, full command matrix and read-only diff review.
- The browser connector is unavailable; regular Playwright used the installed Chrome channel instead.

## 4. Changed files

### Backend, Admin and migrations

- None.

### Storefront

- `src/lib/routing/contracts.ts`: B2B roots and legacy-to-canonical URL transformer.
- `src/middleware.ts`: 308 legacy canonicalization, explicit B2B bypass and preserved localized commerce handling.
- `next.config.js`: temporary 307 redirects for reserved future route families.
- `src/app/servers/page.tsx` and `servers/[slug]/page.tsx`: parallel data loading and canonical search input.
- `src/app/compare/page.tsx`, `favorites/page.tsx`: separate routes for existing UI surfaces.
- localized `products/[handle]/page.tsx`: linked Medusa Product metadata canonical and redirect to `/servers/{ServerModel.slug}`.
- `catalog-client.tsx`: removed query-view page switching, exported existing compare/favorites views and implemented `search` filtering.
- `server-header.tsx`: canonical links/search/cart/RFQ/configurator entry plus mobile and Escape state handling.

### Tests and docs

- Routing contract Jest table tests.
- Expanded Playwright route/history/cart/mobile/404 smoke suite and deterministic `mock-medusa.cjs`.
- `docs/architecture/route-strategy.md`: ADR, route inventory, ownership table and redirect matrix.

## 5. Architecture and contracts

- B2B discovery is canonical at `/servers`, `/components`, `/solutions`, `/knowledge`, `/compare`, `/favorites`, `/rfq` without country prefixes.
- Commerce transactions and customer state remain under `/{countryCode}`; `/cart` is a middleware bridge to `/{countryCode}/cart`.
- `/servers/{ServerModel.slug}` is the sole canonical technical product page. A linked generic Medusa Product redirects there; unlinked products keep localized handles.
- `view` is legacy-only and never page identity. Search state uses `search`.
- No API DTO or data model changed. Compatibility is maintained through permanent 308 legacy redirects and temporary 307 future-route redirects.

## 6. Data safety

- No schema, migration, backfill or database mutation.
- Redirect logic is stateless and idempotent.
- Rollback is a Git revert; no data recovery step is required.

## 7. Verification

| Command | Result | Evidence |
|---|---:|---|
| `npm run typecheck` | 0 | Backend and storefront: 2/2 tasks successful. |
| `npm run lint` | 0 | No errors; existing warnings remain visible. |
| `npm run test:unit` | 0 | Storefront 12 tests, backend 2 tests; 14 total. |
| `npm test` | 0 | Unit plus module and HTTP integration suites all passed; 16 total assertions across the root matrix. |
| `npm run test:smoke` | 0 | Playwright 5/5 scenarios passed in 18.5 seconds. |
| `npm run build` | 0 | Medusa/Admin and Next builds passed; Next generated 47/47 pages. |
| `git diff --check` | 0 | No whitespace errors. |
| legacy-link search | 0 | Legacy forms occur only in contract tests/ADR; runtime navigation uses canonical URLs. |

## 8. Runtime/manual scenarios

- Direct `/servers` navigation, click to `/compare`, browser Back/Forward and refresh passed with no page console errors.
- The 308 redirect matrix preserved unrelated query parameters and encoded search values.
- `/servers?view=cart` resolved through `/cart` to `/dk/cart`; cart container rendered and the cart cookie survived.
- Mobile navigation at 390×844 exposed `aria-expanded`, opened, closed on Escape and retained expected navigation behavior.
- An unknown route reached the localized 404 contract without a redirect loop.
- Runtime environment: `http://127.0.0.1:8000`, Chrome via Playwright, local mock Medusa at port 9100.

## 9. Security and permissions

- Middleware redirects derive only same-origin destinations from allowlisted view names and validated component slugs; no open redirect input exists.
- No direct database access, credentials, authorization changes or new public write endpoints.
- Region/currency/cart trust remains in existing Medusa commerce routes.

## 10. Unfinished and unverified

- Future component, solution, knowledge and RFQ features are intentionally not implemented; owner stages replace temporary redirects.
- No external browser connector session was available; the checked-in Playwright suite provides reproducible runtime evidence.
- Live multi-region production data was not used; the cart/region contract was verified with deterministic `dk` mock data.

## 11. Risks and technical debt

- Existing 82 backend warnings and storefront warnings remain non-blocking visible debt.
- Next logs build-time failed external fetch attempts in this local environment, but fallback generation completes successfully.
- Next dev warns that cross-origin development requests may require `allowedDevOrigins` in a future major version.
- Temporary future-route redirects must be removed atomically when their owner stages implement pages.

## 12. Stage-specific evidence

### Route inventory and ownership

The complete inventory and authoritative table are in `docs/architecture/route-strategy.md`. Current/future ownership: servers 06/09/10, components 10, solutions 11, compare/favorites 10, RFQ/cart 12, knowledge 13, crawler metadata 16; existing localized commerce remains Medusa-owned.

### ADR and product identity

ADR-009 selects unprefixed B2B discovery plus localized commerce and fixes `/servers/{slug}` as the sole canonical linked server URL.

### Redirect matrix

Jest and Playwright cover `view=compare|favorites|cart|ready|components|storage|solution views`, `component`, `interface`, and `q`; canonicalization uses 308. Reserved future paths use 307 to `/servers` until their owner stage lands.

### Navigation continuity

Direct, refresh, Back/Forward, cart-cookie continuity, mobile keyboard interaction, 404 and loop absence are covered by the five passing browser scenarios.

## 13. Definition of Done

| Criterion | Status | Evidence |
|---|---|---|
| One URL architecture and ADR | Complete | ADR-009 plus explicit middleware roots. |
| One canonical server product URL | Complete | Linked product metadata and runtime redirect. |
| Existing navigation functional | Complete | Canonical header/search/configurator links; Playwright history/mobile tests. |
| Legacy links preserve meaning | Complete | URL transformer, 11 Jest cases and browser redirect matrix. |
| Cart and checkout continuity | Complete | Country bridge and cookie-preservation scenario. |
| Future routes contracted, not prebuilt | Complete | Ownership table and temporary 307 redirects only. |

## 14. Gate

```text
NEXT_STAGE_GATE: GO
```

## 15. Next-stage overrides

```text
NEXT_STAGE_OVERRIDES:
- Preserve ADR-009 route shapes and the unprefixed-B2B/localized-commerce boundary.
- Keep `/servers/{ServerModel.slug}` as the sole canonical linked server product URL.
- Do not repurpose `view` as page identity; owner stages replace only their temporary redirects.
- Preserve the stage-01 verification contract and keep user-owned untracked docs outside commits.
```

## 16. Handoff summary

Stage 03 may change domain models and migrations but must not change the canonical URL strategy or introduce a second public server identity. All stage-02 checks are green and its feature boundaries are documented.
