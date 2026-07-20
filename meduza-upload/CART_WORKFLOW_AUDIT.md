# Cart Workflow Audit

Date: 2026-07-13  
Project: `D:\Meduza site`

## Medusa MCP

Medusa MCP tools were checked in the current Codex session through `tool_search`. They are still not callable in this session. The configured MCP endpoint remains documented in `MEDUSA_MCP_CONNECTION_REPORT.md`, but reload/auth through Medusa Cloud OAuth or PAT is still required before tools can be used.

Fallback sources used:

- Official Medusa personalized-products guide: line item `metadata` stores custom product data, different metadata for the same variant creates separate line items, and metadata is copied to order line items after order placement.
- Official Medusa core-flow typings from installed `@medusajs/core-flows@2.17.2`: `createCartWorkflow`, `addToCartWorkflow`, `updateLineItemInCartWorkflow`, `refreshCartItemsWorkflow`.
- Official Medusa type definitions from installed `@medusajs/types@2.17.2`: `CreateCartCreateLineItemDTO` supports `metadata` and `unit_price`.
- Existing project skills and reports: `building-with-medusa`, `building-storefronts`, `storefront-best-practices`.

## Important Context From Existing Reports

- Runtime source of truth is `Medusa DB + server-configurator module`.
- `/options` returns `source: "db"` in normal mode; `default-components.ts` must not be used as runtime source.
- The project has 4 server models and each has `medusa_product_id` / `medusa_variant_id`.
- `configuration` and `configuration_item` already exist and were intentionally not wired to real Medusa cart before this task.
- Admin mutation routes already follow `Module -> Workflow Step -> Workflow -> API Route -> Admin UI`.
- Storefront `/servers?view=cart` was local state only and needed replacement for configured servers.

## Current Backend Before Change

- `POST /store/server-configurator/price` called `service.validateConfiguration(req.body)` and returned price/validation fields only.
- `POST /store/server-configurator/save` validated and persisted a `configuration`, but did not create `configuration_item` rows.
- `POST /store/server-configurator/add-to-cart` validated, saved a `configuration`, then returned a `cart_line_item` payload. It did not create/retrieve a Medusa cart and did not add a line item.
- Store API body validation existed for Admin routes only, not for Store add-to-cart.

## Current Models

- `configuration` has the needed fields: `medusa_cart_id`, `medusa_line_item_id`, `status`, `snapshot_json`, `total_price`, `warnings_json`, `errors_json`, `effective_specs_json`.
- `configuration_item` has the needed fields for selected components: `configuration_id`, `component_id`, `type`, `quantity`, `unit_price`, `total_price`, `snapshot_json`.

## Current Storefront Before Change

- `local-actions.ts` stores `favorites`, `compare`, local `cart`, and quote requests in `localStorage`.
- `/servers?view=cart` rendered local cart rows by matching local IDs to current catalog models.
- Favorites and compare can safely remain local.
- Medusa SDK is already instantiated in `apps/storefront/src/lib/config.ts` with `publishableKey`.
- Existing cart helpers in `apps/storefront/src/lib/data/cart.ts` use cookie `_medusa_cart_id`, `sdk.store.cart.create`, `retrieve`, `updateLineItem`, and `deleteLineItem`.

## Required Replacement

- Replace configured-server cart flow with real Medusa cart.
- Keep Medusa product = chassis/model and Medusa variant = base configuration.
- Persist each configured server as `configuration` plus `configuration_item` rows.
- Add the base variant through Medusa `addToCartWorkflow`.
- Attach line item metadata containing `configuration_id`, snapshots, effective specs, warnings/errors, `total_price`, and pricing mode.
- Use `unit_price` only when backend calculated price is confirmed. For quote mode, mark metadata as `request_quote` and keep UI as "по запросу".

## Cart Creation

If `cart_id` is absent, backend can call `createCartWorkflow`. Medusa's installed type definitions allow `region_id` to be omitted; the default region is used if configured. The storefront persists the returned cart id in `_medusa_cart_id` using the existing cookie pattern.

## Risks

- If the backend has no default region, cart creation without `region_id` will fail. Storefront normally passes existing cart cookie after first creation.
- Request-quote lines use metadata and UI override; checkout/payment is intentionally out of scope.
- Header cart counters still come from the older local collection helper unless separately wired to real Medusa cart.
- Order snapshot persistence after checkout is still future work; Medusa line item metadata should be available for that later step.

## Files To Touch

Backend:

- `apps/backend/src/api/store/server-configurator/add-to-cart/route.ts`
- `apps/backend/src/api/store/server-configurator/validators.ts`
- `apps/backend/src/api/store/server-configurator/middlewares.ts`
- `apps/backend/src/api/middlewares.ts`
- `apps/backend/src/workflows/server-configurator-cart/**`

Storefront:

- `apps/storefront/src/lib/server-configurator/cart-api.ts`
- `apps/storefront/src/modules/server-configurator/cart-view.tsx`
- `apps/storefront/src/modules/server-configurator/configured-cart-line.tsx`
- `apps/storefront/src/modules/server-configurator/cart-summary.tsx`
- `apps/storefront/src/modules/server-configurator/cart-empty.tsx`
- `apps/storefront/src/modules/server-configurator/cart-format.ts`
- `apps/storefront/src/modules/server-configurator/configurator-client.tsx`
- `apps/storefront/src/modules/server-configurator/configurator-summary-panel.tsx`
- `apps/storefront/src/modules/server-configurator/catalog-client.tsx`
