# ADR-013: Core server creation and publication boundary

- Status: accepted
- Date: 2026-07-20
- Owners: Server Configurator / Admin / Commerce
- Depends on: ADR-011 compatibility engine and ADR-012 guided builders

## Context

Creating a server spans canonical technical knowledge, a model-specific capability graph and Medusa commerce records. Saving every partial step as a Product would expose incomplete technical data, while validating a browser-only draft would create a second compatibility implementation. Administrators also need to leave and resume work without losing the exact step or confirmed values.

## Decision

The core server flow is a 14-step, actor-owned Admin wizard. Autosave stores a versioned `CreationWizardSession`; it does not create a ServerModel or Product. Preview is side-effect free and resolves platform, generation and family inheritance before showing overrides, exclusions, coverage and blockers.

When the draft is source-complete, materialization creates an explicit disabled technical graph: ServerModel, CapabilityProfile, chassis variants, property assignments, pack assignments, direct assignments and selected option-group copies. Every created record is tracked and compensated in reverse order on failure. Materialization never creates commerce IDs.

Publication is a separate confirmed workflow. It re-runs the ADR-011 engine against the materialized graph and refuses to continue unless every representative simulation is ready. Only then does it create Medusa Product/Variant records transactionally, link their generated IDs to the ServerModel, verify the capability profile and enable the technical model. The workflow does not invent prices; price records are absent until a source-authoritative pricing process supplies them.

The browser renders reason-coded server results and never evaluates compatibility. Socket, memory technology, management generation, platform, vendor generation, family, packs, components and option groups are canonical references. The specialized storage and property entry points return to ADR-012 builders. `none` remains Option Group state and is never represented by a fake component.

## API and surface inventory

| Surface | Responsibility |
|---|---|
| `/app/server-configurator/server-wizard` | Fourteen-step draft, review and publication flow |
| `/admin/server-configurator/core-wizard/context` | Canonical reference and inheritance context |
| `/admin/server-configurator/core-wizard/drafts` | Owner-scoped save and resume |
| `/admin/server-configurator/core-wizard/preview` | Side-effect-free coverage, inheritance and engine result |
| `/admin/server-configurator/core-wizard/materialize` | Compensated disabled technical graph creation |
| `/admin/server-configurator/core-wizard/publish` | Revalidation and transactional Medusa product publication |
| `/app/server-configurator/coverage-impact` | Coverage findings and read-only impact analysis |
| `/admin/server-configurator/coverage-analysis` | Registry/engine coverage counts and findings |
| `/admin/server-configurator/impact-analysis` | Affected entities and revalidation footprint before mutation |

## State and failure policy

| State | Durable writes | Commerce visibility |
|---|---|---|
| Editing / autosaved | Actor-owned wizard session and audit only | None |
| Previewed | None | None |
| Materialized | Disabled technical graph and audit | None |
| Engine-ready | Existing disabled graph only | None |
| Published | Product/Variant links, verified profile and enabled model | Explicitly published output |

- Preview and impact analysis declare `writes_performed: false`.
- Duplicate model slugs block materialization.
- An incomplete draft remains resumable and cannot create a partial graph.
- Publication requires explicit confirmation and engine readiness; recommendations are never auto-applied.
- Product creation compensation deletes newly created Products before restoring technical publication state.
- Genius planning, mode switching, Bulk Apply and vendor import remain outside this decision.

## Consequences

The technical graph is the publication boundary instead of an incidental form side effect. Administrators can inspect deterministic blockers and resume safely, while storefront and cart consumers see only server-validated records. More automation can be layered on the same draft/materialize/publish contracts without gaining authority to bypass validation.
