# Cart Workflow Result

Date: 2026-07-13  
Project: `D:\Meduza site`

## Summary

Implemented real Medusa cart flow for configured servers.

- `POST /store/server-configurator/add-to-cart` now validates the configuration through the `server-configurator` module, persists `configuration` and `configuration_item` rows, creates a Medusa cart when needed, and adds the configured server's base variant with configuration metadata.
- `/servers?view=cart` now reads the real Medusa cart through the existing `_medusa_cart_id` cookie pattern and renders configured line item snapshots from Medusa line item metadata.
- Favorites and compare remain local.
- Checkout, payment, and order snapshot behavior were not changed.
- Draft rules and runtime fallback data were not enabled.

## Backend

Added `server-configurator-cart` workflow:

- `validateConfigurationStep`
- `calculateConfigurationPriceStep`
- `saveConfigurationStep`
- `addBaseVariantToCartStep`
- `attachConfigurationMetadataStep`

The cart line item metadata includes:

- `configuration_id`
- `server_model_slug`
- `server_public_name`
- `selected_components_snapshot`
- `effective_specs`
- `warnings`
- `errors`
- `total_price`
- `pricing_mode`
- `request_quote`

Important implementation note: Medusa recursively converts all `raw_*` keys in cart objects into BigNumber values during cart totals decoration. The imported component snapshots can contain nested keys such as `raw_source`, so cart metadata is sanitized before writing to Medusa line item metadata. The original persisted configuration snapshot remains unchanged.

## Storefront

Added storefront cart server actions:

- `addConfiguredServerToCart`
- `retrieveConfiguredCart`
- `updateConfiguredCartLine`
- `removeConfiguredCartLine`

Updated configurator UI:

- Summary panel can add the current valid configuration to the real Medusa cart.
- `/servers?view=cart` renders the real cart and configured-server snapshots.
- Quantity update and remove use Medusa Store cart line-item endpoints through SDK helpers.
- Storefront add-to-cart sends `pricing_mode: "request_quote"` to avoid treating local component totals as confirmed Medusa line-item prices.

## API Verification

Manual Store API verification passed:

- `GET /store/server-configurator/models` returned 4 models.
- `GET /store/server-configurator/models/hpe-proliant-dl360-gen10-8sff/options` returned DB-backed options.
- `POST /store/server-configurator/validate` returned `valid: true`.
- `POST /store/server-configurator/add-to-cart` returned `201`, with a real `cart.id`, real line item, and persisted configuration IDs.
- `GET /store/carts/:id` returned the configured line metadata snapshot.
- `POST /store/carts/:id/line-items/:line_id` updated quantity.
- `DELETE /store/carts/:id/line-items/:line_id` removed the line.

## Checks

Passed:

- `npx tsc --noEmit --pretty false` in `apps/backend`
- `npx tsc --noEmit --pretty false` in `apps/storefront`
- `npm --workspace @dtc/backend run build`
- `npm --workspace @dtc/storefront run build`
- `npm run build`
- HTTP smoke after restarting storefront dev:
  - `GET http://localhost:8000/servers` -> `200`
  - `GET http://localhost:8000/servers?view=cart` -> `200`
  - `GET http://localhost:8000/servers/hpe-proliant-dl360-gen10-8sff` -> `200`
  - `GET http://localhost:9000/store/server-configurator/models` -> `200`

Known project warnings:

- Backend build reports fake Redis because `redisUrl` is not configured.
- Backend build skips lint because `eslint` is not installed in the backend project.
- AJV reports the existing `missingRefs` warning.
- `npx medusa lint` exits with code 1 because linting is skipped when `eslint` is not installed in the backend project.
- Running `next build` while the dev server is alive leaves the dev `.next` cache inconsistent; the storefront dev server was restarted and `apps/storefront/.next` was regenerated.

Medusa MCP tools were checked through `tool_search` and are still not callable in this session. Official Medusa docs and installed Medusa v2.17.2 typings were used instead.
