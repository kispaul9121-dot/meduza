# ADR-012: Admin knowledge base and guided builders

- Status: accepted
- Date: 2026-07-20
- Owners: Server Configurator / Admin
- Depends on: ADR-011 compatibility engine and the stage-03 canonical domain registry

## Context

Administrators need to manage properties, concepts, typed relationships, platforms, vendor generations, direct model assignments and option groups without editing JSON records blindly or introducing a second compatibility implementation in the browser. Creation also spans several records: a reusable pack has items and scope assignments, while a storage option has cages, backplanes and topology. Partial writes would corrupt the knowledge graph.

## Decision

The Admin uses four primary surfaces:

1. `/app/server-configurator/knowledge-base` for the canonical registries, coverage and usage/audit evidence.
2. `/app/server-configurator/smart-builder` for the 12-step Component, Direct, Pack, Assembly Bundle, Storage Topology and Component Type flow.
3. `/app/server-configurator/option-groups` for candidate sources, cardinality, quantities and a real `none` state.
4. `/app/server-configurator/models/:id/direct-components` for model-specific assignments and explicit Direct-to-Pack conversion.

All Admin network access uses the authenticated Medusa SDK. Registry mutations run through one whitelisted workflow descriptor map and create an actor-attributed audit event. Compound builder writes use compensating workflow steps and create disabled/draft records until they are deliberately published. Autosave stores a versioned creation-wizard session owned by the current actor.

The browser never evaluates compatibility rules. Recommendation is a deterministic entity-shape decision; all readiness, candidate availability, quantities, blockers and repair recommendations come from the stage-04 server engine. Component type creation accepts only a closed validator registry key. No executable expression or script field exists.

## Route and API inventory

| Surface | Method | Responsibility |
|---|---|---|
| `/admin/server-configurator/knowledge-base/:entity_type` | GET, POST | Paginated/searchable canonical registry and audited creation |
| `/admin/server-configurator/knowledge-base/:entity_type/:id` | GET, POST, DELETE | Retrieve, audited edit and audited removal |
| `/admin/server-configurator/admin-audit` | GET | Usage footprint and actor-attributed change history |
| `/admin/server-configurator/smart-builder/preview` | POST | Side-effect-free entity recommendation, duplicate scan and engine readiness |
| `/admin/server-configurator/smart-builder/drafts` | GET, POST | Actor-owned autosave and recovery |
| `/admin/server-configurator/smart-builder/apply` | POST | Compensated Create-and-Return |
| `/admin/server-configurator/smart-builder/convert-direct-to-pack` | POST | Compensated Direct-to-Pack conversion |
| `/admin/server-configurator/compatibility-readiness` | POST | Stage-04 authoritative readiness |
| `/store/server-configurator/models/:slug/options` | GET | Stage-04 option preview DTO |

## Permission matrix

| Capability | Anonymous | Authenticated Admin | Store client |
|---|---:|---:|---:|
| Knowledge registry read | No | Yes | No |
| Knowledge registry create/edit/delete | No | Yes | No |
| Draft read/autosave | No | Owner-scoped | No |
| Builder preview | No | Yes, read-only | No |
| Builder apply / conversion | No | Yes, audited | No |
| Audit and usage read | No | Yes | No |
| Published options read | Yes | Yes | Yes |

Medusa's authenticated `/admin/*` boundary is the current authorization boundary. Fine-grained approver/publisher roles are deferred; created builder records remain disabled so authentication alone cannot silently publish them.

## Failure and recovery policy

- Preview performs no writes and declares `writes_performed: false`.
- Every compound apply records created IDs in order and deletes them in reverse order if any later operation fails.
- Workflow compensation is idempotent and is also invoked when a completed step is rolled back by the workflow engine.
- Direct-to-Pack restores the original direct assignment when conversion fails.
- Create-and-Return navigates only after success and returns a highlight ID. Failure leaves the current wizard and its autosaved draft available.
- Audit records include actor, action, entity, before/after values and return/source context.

## Consequences

Administrators gain one explainable path for reusable, unique, bundled and topology data. New entity kinds require an explicit schema, service descriptor and UI form, which is intentional. Admin authentication currently permits all knowledge mutations; a future RBAC stage can narrow that boundary without changing the APIs or audit model.
