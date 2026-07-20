# ADR-014: Genius planning, confirmation and apply boundary

- Status: accepted
- Date: 2026-07-20
- Owners: Server Configurator / Admin / Import Pipeline
- Depends on: ADR-011 compatibility engine, ADR-012 guided builders and ADR-013 Core Wizard publication boundary

## Context

A server may need a platform, generation, concepts, mappings, packs, storage and product identity that do not yet exist. Automation can identify those dependencies, but it must not silently turn uncertain words or recommendations into production records. Bulk execution also needs one transaction/retry/rollback owner; implementing a Wizard-specific apply engine before the import pipeline would create conflicting semantics.

## Decision

Genius Bootstrap is a planning and confirmation layer over the Core Wizard. Discovery scans canonical registries without writes. A deterministic Dependency Planner emits ordered, typed nodes with requested identity, existing matches, duplicate state, source, confidence, blocker, warning, deferral policy and nested-wizard route.

Guided Manual, Assisted Draft and Bulk Apply are views over the same intent, decisions and Creation Manifest. Mode switching preserves confirmed data and unresolved proposals and performs no domain create, update or delete. Suggested/unresolved items never enter an approved manifest; only confirmed or edited decisions do.

Autosave may write an actor-owned `CreationWizardSession` and audit event. Explicit `SAVE_CONFIRMED_MANIFEST` may write its `CreationManifest`, `DraftDependencyNode` records and audit event. Those are orchestration metadata, not production technical or commerce entities. Duplicate canonical identities block confirmed-manifest persistence.

Nested creation carries `parent_session_id`, `parent_node_id`, return route and scroll anchor into the stage-05 builder. On return, the parent session is reloaded, the created identity is highlighted and discovery/planning are re-run. A canceled Genius session is marked abandoned, its manifests become superseded and no pre-existing domain entity is modified or deleted.

Stage 07 defines `GeniusManifestApplyAdapter`. Its dry-run operation is side-effect free and requires an idempotency key. Its capabilities declare `apply: false` and `transactional_apply_owner: stage-08-import-pipeline`; calling apply throws a fail-closed error. Stage 08 must implement staging, transactional apply, retry and rollback behind this interface. It may not receive publication authority: ADR-013 readiness and separate publication confirmation remain mandatory.

## Mode contract

| Transition | Preserved | Excluded | Automatic domain action |
|---|---|---|---:|
| Guided → Assisted | Confirmed values | None; suggestions remain drafts | 0 |
| Assisted → Guided | Confirmed/edited values | Unconfirmed suggestions remain separate | 0 |
| Assisted → Bulk | Confirmed/edited values | Suggested, rejected and unresolved items | 0 |
| Bulk → Guided | Applied-state evidence and unapplied manifest | No decision is discarded | 0 |

Bulk mode is visible for planning, grouping and dry-run. Actual apply requires a separate `server-configurator-bulk-apply` permission and the stage-08 adapter; neither is granted by stage 07.

## Confirmation levels

- Ordinary confirmation: new draft metadata or draft entity proposal.
- Enhanced confirmation: published-data changes, generation-wide assignments, compatibility mappings, disable/delete or changes affecting ready configurations.
- Separate publication confirmation: always required and owned by the Core Wizard publication workflow.

Action Preview names what will be created/linked/affected and what will explicitly not happen. Confirmation Center keeps pending, confirmed, rejected, unresolved, manifest-ready and applied counts visible.

## Consequences

Genius can start from an empty platform/generation context and still produce an explainable plan, while the reliable manual Core flow remains available. Stage 08 receives a single typed manifest contract instead of inheriting an accidental bulk engine. Metadata writes are auditable and recoverable; production writes remain impossible until their dedicated workflow and confirmation boundary exist.
