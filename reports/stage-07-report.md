# Stage 07 report — Genius Bootstrap Wizard, Modes and Confirmation

## 1. Executive summary

- Goal: add explainable bootstrap automation only after the manual Core Wizard was proven.
- Delivered: empty-context Discovery Scan, deterministic Dependency Planner, recursive Create-and-Return context, Guided/Assisted/Bulk modes, Action Preview, Confirmation Center, property completeness flow, actor recovery/abandon, canonical Creation Manifest and a typed stage-08 dry-run adapter.
- Safety result: production apply is physically unavailable in stage 07; publication remains a separate Core Wizard action. The full gate is green and `NEXT_STAGE_GATE` is `GO`.

## 2. Input control

- Read `reports/stage-06-report.md`; incoming gate was `GO`.
- Read stage 07, the master orchestrator, common contract, ownership map, report template and all stage-06 overrides.
- Preserved ADR-013 draft/materialize/publish boundaries and stage-04 as the only compatibility authority.
- Baseline: branch `codex/master-orchestrator-01-17`, stage-06 commit `954b780`; user-owned untracked audit/roadmap documents were excluded.

## 3. Skills

- Reused the already-loaded `building-with-medusa`, `building-admin-dashboard-customizations`, required Admin references, `react-best-practices` and `frontend-testing-debugging` instructions for this orchestrated turn.
- Prompt skills `composition-patterns`, `systematic-debugging` and `verification-before-completion` were unavailable. Their required outcomes were covered with pure planner boundaries, a typed adapter, runtime log/response diagnosis, a clean repeated E2E and the full repository gate.

## 4. Changed surface

### Planner, adapter and workflows

- `genius-bootstrap.ts`: canonical modes, discovery, duplicate detection, deterministic 12-node dependency graph, canonical manifest, mode-transition contract and property completeness chain.
- `genius-apply-adapter.ts`: typed `GeniusManifestApplyAdapter`; stage-07 implementation supports dry-run and rejects apply.
- Actor-owned session, confirmed-manifest, dependency-node, bulk-adapter, abandon and property-completeness Admin APIs.
- Compensated confirmed-manifest graph save and abandon/supersede workflows with audit evidence.

### Admin and nested builders

- `/app/server-configurator/genius-bootstrap`: persistent mode bar, discovery, dependency graph, Action Preview, Confirmation Center, property flow, classification, manifest, dry-run and recovery.
- Core Wizard and Server Configurator home link to Genius while keeping Core free of Assisted/Bulk logic.
- Knowledge Base supports nested return/highlight/revalidation context.
- Smart Builder persists `parent_session_id`, `parent_node_id`, return route and validation return state.
- ADR-014 `docs/architecture/genius-bootstrap-manifest.md` plus decision-log entry.

## 5. Empty-platform bootstrap scenario

The browser scenario began with no platform or generation selection and supplied only an unpersisted intent:

```text
Vendor: Acme
Generation: G1
Platform: Acme Compute One / acme-compute-one
Socket: ACME-S1
Memory: DDR-X
Model: Rack One
Source: Acme guide p. 12
Confidence: 0.9
```

Discovery returned existing/reusable counts, missing canonical entities, unmapped compatibility properties and validator gaps with `writes_performed: false`. The planner produced stable dependency order:

```text
Property/concept types → socket → memory → relations/mappings
→ platform → generation → shared packs → server model
→ chassis/storage → option groups → Medusa product → final validation
```

Missing required nodes showed create/confirm blockers and their exact nested builder; no entity was created.

## 6. Mode-switch matrix

| Transition | Preserved | Manifest behavior | Domain create/update/delete |
|---|---|---|---:|
| Guided → Assisted | Existing and confirmed values | Suggestions become separate status-bearing proposals | 0 |
| Assisted → Guided | Confirmed/edited values | Unconfirmed suggestions remain drafts | 0 |
| Assisted → Bulk | Confirmed/edited values | Suggested/rejected/unresolved excluded | 0 |
| Bulk → Guided | Confirmed state and unapplied manifest | User may continue node-by-node | 0 |

Every switch first displays what changes, what remains, what stays unconfirmed and that no create/update/delete/apply/publication action occurs. Mode is stored in `CreationWizardSession.mode_hint`; default is always Guided Manual.

## 7. Dependency and duplicate policy

- Identity comparison is normalized and exact across canonical key/name/alias fields.
- Single-identity concepts, platforms, generations and models become `duplicate` when more than one exact canonical match exists.
- Multi-valued reusable collections such as packs, option groups, storage options and relations explicitly allow multiple matches; they are not false duplicates.
- Confirmed manifest save re-runs discovery/planning on fresh registry data and rejects any remaining duplicate identity.
- Candidate packs are reusable pool evidence only; they never prove compatibility.

## 8. Recursive Create-and-Return

Each dependency carries a nested wizard route. Before leaving, the parent Genius session is saved with phase, mode, decisions, classification and scroll anchor. Smart Builder receives `parent_session_id`, `parent_node_id` and the encoded return route. Knowledge Base receives section, return node and scroll anchor.

On return, `session_id` reloads the exact parent draft, the created ID is highlighted when present and the dependency plan is revalidated. The runtime scenario opened PropertyDefinition creation, verified the `Nested Create-and-Return` context and returned without creating; phase/mode/fields remained recoverable.

## 9. Property and classification flows

The Property Assignment panel exposes the required ten-stage chain: scope, PropertyDefinition, normalized value/unit, inheritance, usage, compatibility mapping, conflict check, impact preview, confirmed manifest assignment and coverage recalculation.

Compatibility usage requires concept, relation and validator. The server completeness API reports the exact missing chain and performs no writes. Confirmed/edited assignments enter `planned_assignments`; compatibility mappings require enhanced confirmation. Unknown terms are classified as known concept value, property, resource, component, component type, relation or unresolved. Classification alone never creates an entity.

## 10. Creation Manifest example

The verified manifest was deliberately incomplete and contained one confirmed platform create plus eleven excluded unresolved decisions:

```json
{
  "mode": "bulk_apply",
  "planned_creates": [
    {
      "entity_type": "technology_platform",
      "dependency_order": 5,
      "idempotency_identity": "technology-platform-technology-platform"
    }
  ],
  "planned_updates": [],
  "planned_links": [],
  "planned_assignments": [],
  "publication_actions": [],
  "status": "blocked",
  "writes_performed": false
}
```

Only `confirmed` and `edited` decisions enter creates/links/assignments. Product proposals are separate `publication_actions` with `requires_separate_confirmation: true`.

## 11. Typed stage-08 apply contract

```text
GeniusManifestApplyAdapter
  capabilities(): dry_run=true, apply=false,
                  transactional_apply_owner=stage-08-import-pipeline
  dryRun({ manifest, idempotency_key, actor_id, approved_groups })
  apply(...) -> fail closed in stage 07
```

The runtime dry-run returned adapter version 1, dependency group order, blockers/warnings, approved count, `writes_performed: false` and `apply_available: false`. The UI Apply button is disabled. The API reports required permission `server-configurator-bulk-apply` and `apply_granted: false`. No Wizard-specific bulk engine exists.

## 12. Interruption, recovery and rollback

- Debounced autosave after phase/data/mode changes writes only the actor session and audit event.
- Reload plus resume recovered Bulk mode, phase 1, socket `ACME-S1`, all intent fields and the confirmed decision.
- Explicit manifest save atomically replaces draft dependency nodes and updates/creates the manifest; compensation restores the prior nodes/manifest.
- Cancel cleanup preview states existing entities modified/deleted = 0.
- Runtime abandon marked the session abandoned, superseded its manifest, retained audit evidence and returned zero production entities touched.
- E2E cleanup removed 3 test sessions, 24 dependency nodes, 2 manifests, 10 audit events and the temporary Admin.

## 13. Network/database proof of no hidden writes

After authentication the E2E recorded every POST/PUT/PATCH/DELETE. Allowed writes were only explicit `/genius/sessions`, `/genius/manifest` and `/genius/abandon` orchestration metadata. There were no writes to Knowledge Base, Smart Builder apply, Core materialize/publish, Products or other domain APIs.

Unit source-contract tests also scan discovery, planning, completeness and bulk-adapter routes for domain create/update/delete/Product workflow calls. The stage reused existing stage-03 tables; no schema migration was added. Cleanup database evidence found only session/node/manifest/audit test metadata.

## 14. Runtime screenshots

- `01-empty-platform-guided.png`: default Guided Manual and empty platform/generation form.
- `02-discovery-dependency-plan.png`: populated intent, real discovery counts and planner entry.
- `03-mode-switch-preview.png`: Assisted → Bulk behavior preview with explicit no-action text.
- `04-confirmation-action-preview.png`: confirmed platform node, Confirmation Center and Action Preview.
- `05-manifest-dry-run.png`: blocked but saveable manifest, disabled Apply and stage-08 dry-run controls.
- `06-interruption-recovery.png`: recovered Bulk mode and all populated intent fields after reload.

All six images were visually inspected. The clean authenticated E2E passed in 17.3 seconds with no unexpected post-auth HTTP or console errors.

## 15. Verification

| Command | Result | Evidence |
|---|---:|---|
| Genius unit/source contract | 0 | 8/8: empty bootstrap, duplicates, manifest, modes, properties, adapter, hidden writes, UI contract |
| `npm test` | 0 | Backend 83, storefront 12, module 1 and HTTP 1: 97 checks |
| `npm run typecheck` | 0 | Backend and storefront green |
| `npm run lint` | 0 | 0 errors; unchanged 83 backend and 22 storefront warnings |
| `npm run build` | 0 | Medusa backend/Admin and Next; 47/47 static pages |
| `npm run test:smoke` | 0 | Storefront Playwright 5/5 |
| authenticated Admin Playwright | 0 | Empty bootstrap, modes, manifest, dry-run, reload, nested return and abandon |
| `git diff --check` | 0 | No whitespace errors |

## 16. Unfinished, risks and technical debt

- Stage 07 intentionally cannot apply a Bulk manifest. Stage 08 must implement staging, transactional apply, idempotency retry and rollback behind the typed adapter.
- No AI/document extraction service was added; Assisted mode represents suggestions with status/source/confidence but grants them no write authority.
- Fine-grained Medusa RBAC is not yet present. Apply is therefore disabled, not merely hidden behind the broad Admin boundary.
- Parent context is persisted in session payloads; deeply nested cross-builder visual breadcrumbs can be improved in stage 15 without changing the contract.
- Existing npm config, lint, Next dev-origin/smoke teardown and Jest open-handle warnings remain visible and non-blocking.

## 17. Definition of Done and gate

| Criterion | Status | Evidence |
|---|---|---|
| Empty platform/generation bootstrap | Complete | Pure test + authenticated screenshot |
| Deterministic Dependency Planner | Complete | Stable 12-node order test/runtime |
| Recursive Create-and-Return | Complete | Parent context and runtime Property return |
| Three modes, one manifest | Complete | Mode matrix, source and E2E |
| Mode switch has no domain mutation | Complete | Transition contract + network proof |
| Action Preview / Confirmation Center | Complete | UI and screenshot |
| Separate publication | Complete | Disabled apply and Core publication link |
| Recovery/rollback protects existing data | Complete | Reload, abandon and compensated workflow |
| Duplicate prevention | Complete | Exact/multi identity tests and save guard |
| Stage-08 adapter, no bulk engine | Complete | Typed dry-run adapter and fail-closed apply |
| No hidden writes | Complete | Network, source and cleanup evidence |

```text
NEXT_STAGE_GATE: GO
```

```text
NEXT_STAGE_OVERRIDES:
- Implement staging, normalized preview, transactional apply, idempotency retry and rollback behind GeniusManifestApplyAdapter; do not add a second Wizard bulk engine.
- Consume Creation Manifest schema version 1 and preserve dependency order, approved groups, source/confidence, duplicate identities and idempotency keys.
- Keep raw vendor/source records separate from canonical normalized entities and make every adapter dry-run side-effect free.
- Bulk apply must create disabled/draft records, record an immutable audit trail and never publish server/Product automatically.
- Re-run stage-04 readiness after apply and return revalidation tasks/blockers to the same Confirmation Center contract.
- Preserve the `server-configurator-bulk-apply` permission boundary; broad Admin authentication alone must not authorize apply.
- Keep user-owned untracked audit/roadmap files outside stage commits.
```

Stage 08 can now implement the single transactional import/apply owner and connect it to the dry-run contract without changing Genius planning or Core publication semantics.
