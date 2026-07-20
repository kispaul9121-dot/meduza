# Architecture decision log

## ADR-001 — Medusa remains the commerce foundation

Status: accepted.

Custom behavior is implemented with Medusa modules, services, workflows, links, API routes, subscribers and Admin extensions. Mutations do not bypass workflows, and storefront code consumes APIs through the Medusa SDK.

## ADR-002 — One canonical property registry

Status: accepted.

The project must not create parallel, unrelated attribute/property registries or arbitrary schemas for the same meaning. Names, generations, sockets, frequencies, form factors and protocols are data. New validators are introduced only for genuinely new behavior.

## ADR-003 — Candidate packs are not compatibility decisions

Status: accepted.

A component pack narrows the available candidate pool. Only the Compatibility Engine may decide runtime compatibility. Every property or relation that influences compatibility requires an explicit mapping and validator.

## ADR-004 — Draft, publication and provenance

Status: accepted.

Unmapped properties may exist in draft but cannot silently affect storefront output or publication. Inherited values retain their source and override provenance. Published technical data, documents and content retain source evidence.

## ADR-005 — Import boundaries

Status: accepted.

Raw vendor/source records remain separate from normalized records. Import uses staging, validation, dry-run preview and idempotent transactional apply. Generic core contains no vendor-specific conditional chains and never executes arbitrary imported/Admin code.

## ADR-006 — Migration and identity safety

Status: accepted.

Schema changes use migrations with explicit backfill and recovery considerations. Products have one canonical identity across technical configuration and commerce snapshots. Generated logs, builds, local databases, archives, agent files and secrets are never tracked.

## ADR-007 — Server trust boundaries

Status: accepted.

Cart, RFQ and order flows revalidate compatibility and pricing on the server. Client-supplied price or compatibility claims are not authoritative. No stage invents price, stock, document, SEO or technical source data.

## ADR-008 — Stage gate and design freeze

Status: accepted.

Every stage produces a report and gate before the next stage starts. Stages 01–17 preserve the existing visual direction; only functional, accessibility, responsive and component-consistency changes are allowed. Visual redesign belongs exclusively to manual stage 18.

## ADR-011 — Universal Compatibility Engine

Status: accepted.

One side-effect-free engine owns candidate, property, relation, resource, topology and rule resolution. Validators are selected only from a closed registry; unknown compatibility mappings block publication. Packs remain candidate provenance, storefront clients consume reason-coded DTOs, and repair recommendations remain separate from deterministic results. Full contract: `docs/architecture/compatibility-engine.md`.

## ADR-012 — Admin knowledge base and guided builders

Status: accepted.

Canonical registries are edited through typed Admin forms and audited workflows. Compound Component, Direct, Pack, Bundle and Storage creation uses a resumable 12-step builder with reverse-order compensation. Admin previews consume ADR-011 readiness/options APIs and never calculate compatibility locally. Full contract: `docs/architecture/admin-knowledge-base.md`.

## ADR-013 — Core server creation and publication boundary

Status: accepted.

The 14-step Server Wizard stores actor-owned resumable drafts separately from technical and commerce records. A source-complete draft is materialized as a disabled, compensated technical graph; explicit publication re-runs ADR-011 and only then creates and links Medusa Product/Variant records without inventing prices. Coverage and impact previews are read-only. Full contract: `docs/architecture/core-server-wizard.md`.

## ADR-014 — Genius planning, confirmation and apply boundary

Status: accepted.

Genius discovery and dependency planning are side-effect free. Guided, Assisted and Bulk modes share one confirmed Creation Manifest; mode switches preserve state and never mutate domain entities. Stage 07 persists only actor session/manifest/audit metadata and exposes a dry-run-only typed adapter whose transactional apply owner is stage 08. Publication remains a separate ADR-013 confirmation. Full contract: `docs/architecture/genius-bootstrap-manifest.md`.

## ADR-015 — Reviewed technical import and transactional apply

Status: accepted.

Technical vendor and Genius sources pass through separate raw, staged and normalized records, explicit row review, side-effect-free dry-run and one permission-gated compensated apply workflow. Content hashes and attempt keys provide idempotency; rollback replays saved before-images in reverse order. Applied records remain disabled/draft, affected models are revalidated through ADR-011, and commerce/publication fields are excluded. Full contract: `docs/architecture/technical-import-pipeline.md`.

## ADR-016 — Backend-owned catalog query and dynamic facets

Status: accepted.

One Store API owns search, filters, ranges, stable pagination and disjunctive facet counts. System values come from ServerModel and Medusa commerce data; dynamic filters come only from active filterable PropertyDefinitions with canonical units, concept labels/aliases and inherited values. The storefront renders the versioned backend schema, stores all query state in the URL and surfaces request failures. Admin retains effective-value provenance and index/backfill validation. Full contract: `docs/architecture/backend-catalog-query.md`.

## ADR-017 — Registry-driven storefront products and collections

Status: accepted.

ServerModel and Component remain reusable technical identities while linked Medusa Product/Variant records exclusively own commerce. Component catalog/PDP attributes come from the canonical property registry; configurator groups and storage choices are backend presentations of ADR-011 candidates, never frontend brand/model inference. Compare uses a bounded shareable URL and favorites fetch only stored slugs. Full contract: `docs/architecture/storefront-products-and-collections.md`.

## ADR-018 — Immutable ready-configuration publication versions

Status: accepted.

ReadyConfiguration is a separately publishable preset aggregate, never an alias of mutable user Configuration. Every validation or revalidation appends an immutable technical version containing frozen component/spec/property/topology values, engine trace and dependency fingerprints. ADR-011 blocks invalid publication; stale published versions cannot be cloned or ordered. Medusa remains the live commerce authority for stage 12, and stage 13 consumes only ready identity/version/hash provenance. Full contract: `docs/architecture/ready-configurations.md`.
# ADR-019 — Commerce-safe configuration lifecycle (Stage 12)

- Keep one Medusa cart and attach a bounded configuration projection to its custom-priced base-server line.
- Recompute base/components/bundles/services/adjustments from Medusa price and inventory context; never use technical component floats as checkout authority.
- Persist RFQ separately from cart purchase and protect RFQ/order snapshots with PostgreSQL triggers.
- Require production compatibility, ownership, provenance and price/availability checks before cart/RFQ/checkout actions.
- Details: `docs/architecture/cart-pricing-rfq.md`.
