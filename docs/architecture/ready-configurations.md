# Ready configuration publication and snapshot contract

Status: accepted (ADR-018).

## Decision

`Configuration` and `ConfigurationItem` remain mutable, user/cart-scoped working records. A reusable storefront preset is a separate `ReadyConfiguration` aggregate. Its descriptive and publication fields can change, while every technical revision is appended as an immutable `ReadyConfigurationVersion`.

Publication always runs ADR-011 in `production_validation` mode. A compatible result, full trace and dependency fingerprints are required. `fixed` and `from` prices additionally require currency, a linked base variant, a total and commerce links for every selected component. `request_quote` intentionally permits incomplete commerce and never invents a price.

## Version schema

```json
{
  "snapshot_schema_version": 1,
  "engine_version": "adr-011-engine-v1",
  "server_model": {
    "id": "srv_…",
    "slug": "dell-poweredge-r640-8sff",
    "schema_version": 1,
    "medusa_variant_id": "variant_…"
  },
  "topology": {
    "storage_option_id": "storage_…",
    "placements": []
  },
  "selected_components": [
    {
      "component_id": "cmp_…",
      "quantity": 2,
      "schema_version": 3,
      "normalized_specs": {},
      "medusa_product_variant_id": "variant_…",
      "unit_price": 120,
      "available_at_snapshot": true
    }
  ],
  "effective_specs": {},
  "effective_properties": [],
  "concept_ids": [],
  "pack_provenance": {
    "assignments": [],
    "packs": []
  },
  "validation": {
    "status": "compatible",
    "reason_codes": [],
    "trace": []
  },
  "commerce": {
    "price_mode": "request_quote",
    "currency_code": null,
    "total_price": null
  },
  "dependency_fingerprints": {
    "property_schema_hash": "sha256",
    "relation_graph_hash": "sha256",
    "pack_assignment_hash": "sha256",
    "dependency_hash": "sha256"
  }
}
```

The database enforces one `(ready_configuration_id, version)` pair and rejects updates to version identity, snapshot or dependency hashes once `immutable=true`. Revalidation creates the next version; it never rewrites an earlier one.

## Staleness policy

The current dependency hash covers component schema/specs/commerce link/price/stock, PropertyDefinition versions and effective assignments, concept identities and relation graph, packs/items and assignment provenance. A removed or disabled component, property mapping change, relation change, pack change, price change or availability change makes the published version stale.

Store presentation recomputes fingerprints against current canonical records. Stale records are excluded from the default list, exposed only with an explicit diagnostic flag, and cannot be cloned into the configurator or ordered. Admin can refresh the persisted stale flag and revalidate to append a current version.

## Admin and Store contracts

Admin mutations run workflows for create-from-simulator, create-from-user-configuration, duplicate, validate, revalidate, publish, unpublish, archive and reorder. The UI loads its table on mount, invalidates it after mutations, previews a record and compares any two immutable versions.

Store routes expose published list/detail and a bounded configurator-clone DTO. `/solutions` and `/solutions/[slug]` use dynamic routes. Server PDPs fetch their own published presets. `?ready=<slug>` hydrates selections, explicit-none values and storage choice, then ADR-011 resolves the current option presentation.

## Ownership handoff

- Stage 12 owns live Medusa price, inventory and cart/order recomputation. It must carry `ready_configuration_id`, version and snapshot hash as provenance, and must never trust frozen snapshot prices as checkout authority.
- Stage 13 owns RFQ persistence/workflow. It consumes the same identity/version/hash and rejects stale or unpublished versions.
- ReadyConfiguration owns descriptive publication and technical snapshot history; it does not own cart, order, RFQ or alternative product schemas.
