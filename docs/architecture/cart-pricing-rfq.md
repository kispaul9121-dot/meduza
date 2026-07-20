# ADR-019: Commerce-safe configuration lifecycle

Status: accepted  
Stage: 12

## Decision

The technical compatibility snapshot, live commercial calculation, cart line, RFQ and order evidence are separate records with explicit provenance.

- `ReadyConfigurationVersion` remains unchanged and is only referenced by ID, version and snapshot hash.
- A purchase configuration is revalidated in production mode and repriced from Medusa calculated variant prices in the cart region/currency.
- The price formula is base server/chassis plus linked components, auto-added bundles, services and triggered rule adjustments. Technical `Component.price` is never checkout authority.
- A calculated configuration can enter the single Medusa cart only when all required variants have a current price and are reservable or backorderable.
- RFQ is a separate `QuoteRequest` process. Missing price or partial supplier availability is recorded in its immutable request snapshot; it never becomes a zero-price cart line.
- Before checkout, configured lines are checked again for ownership, snapshot hash, compatibility, price hash, unit amount and availability.
- `order.placed` copies the configuration and order line into `order_snapshot_json`; PostgreSQL prevents later mutation of that snapshot/hash/order identity.

## Lifecycle

`Configuration.status` uses `draft → valid/invalid → in_cart | quote_requested → quoted → ordered`, with `expired` and `archived` terminal alternatives. It stores Medusa customer/cart/line/order IDs without creating cross-domain ORM relations.

`QuoteRequest.status` uses `requested → reviewing → quoted → accepted | rejected | expired | converted`. Admin APIs may change status and quote terms, but the submitted request identity, contact, quantity and snapshot are immutable.

## Security and failure policy

- Store schemas bound component count, quantities, IDs, comments and contact lengths.
- Authenticated cart/customer identity is derived from the request, never accepted from the body.
- Existing owned carts are rejected when their customer differs from the actor.
- Ready-configuration actions require exact published ID/version/hash and exact frozen component selection.
- Cart metadata is a bounded presentation projection (48 KB maximum); full audit data remains in the custom module.
- Workflow compensation removes created configuration items/configurations, cart lines/new carts and RFQ rows on failure.

## Consequences

Prices and inventory can make a previously valid technical configuration unavailable for purchase without altering its technical snapshot. RFQ can still capture that explicit partial state. Orders preserve what was actually bought even if the catalog, price lists or compatibility graph later change.

## Verification

The stage includes pure pricing/tampering/rollback tests, real PostgreSQL immutability checks, a live Medusa calculated-price query and Playwright configurator/RFQ/cart coverage. The current real base variant is out of stock, so the live calculated-purchase path correctly blocks while the positive purchase path is covered with deterministic Medusa-query fixtures.
