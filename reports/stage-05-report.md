# Stage 05 report — Admin Knowledge Base and Smart Builders

## 1. Executive summary

- Goal: give administrators typed, recoverable tools for canonical technology knowledge, components, packs, direct assignments, storage topology and option groups.
- Delivered: seven-section Knowledge Base, deterministic 12-step Smart Builder, Direct Components management, Storage Cage flow, Option Group editor, autosave/recovery, compensated Create-and-Return and actor audit history.
- Result: migration, runtime Admin checks and the complete repository verification contract are green. Gate is `GO`.

## 2. Input control

- Read `reports/stage-04-report.md`; incoming gate was `GO`.
- Read the stage-05 prompt, master orchestrator, common contracts and stage-04 overrides.
- Preserved the stage-03 registries and stage-04 engine as the only compatibility authority.
- Baseline: branch `codex/master-orchestrator-01-17`; stage-04 commit `a042ccc`; user-owned untracked audit/roadmap documents stayed untouched and excluded.

## 3. Skills

- Loaded `building-with-medusa` for module models, validated Admin routes and compensated workflows.
- Loaded `building-admin-dashboard-customizations` plus its data-loading, forms, display, navigation, table, typography references. Applied SDK-only authenticated calls, display queries on mount, FocusModal create, Drawer edit, DataTable search/pagination and explicit loading/error/empty states.
- Loaded `react-best-practices`; reference data is fetched once per screen, readiness and display data are separate queries, and mutations invalidate only affected query keys.
- Loaded `frontend-testing-debugging`; the browser connector was unavailable, so installed Playwright Chromium, ran the real local Admin and captured verified screenshots.
- Prompt skills `composition-patterns` and `verification-before-completion` were unavailable; their outcomes were implemented directly through component boundaries, workflow tests and the full gate matrix.

## 4. Changed files

### Backend and workflows

- `apps/backend/src/modules/server-configurator/models/admin-audit-event.ts` and migration `Migration20260720164322.ts`.
- `apps/backend/src/modules/server-configurator/admin-builders.ts` deterministic entity recommendation.
- `apps/backend/src/workflows/server-configurator/knowledge-base/*` audited generic registry mutations with compensation.
- `apps/backend/src/workflows/server-configurator/smart-builder/*` compound apply and Direct-to-Pack conversion.
- Knowledge Base, audit, preview, drafts, apply and conversion Admin APIs plus typed validators/middleware.

### Admin

- Knowledge Base, Smart Builder, Option Groups and per-model Direct Components routes.
- Shared canonical types and typed key/value resource builder.
- Server Configurator navigation and links from Server Models.
- Component type choices now include drive cage, boot storage and accelerator.

### Verification and docs

- 12 new backend assertions across builder recommendation, schemas, side-effect-free preview, SDK-only UI, compensation and migration safety.
- ADR-012 `docs/architecture/admin-knowledge-base.md` and decision-log entry.
- Four verified PNGs in `reports/stage-05-screenshots/`.
- Storefront smoke screenshot uses `caret: "initial"` so Playwright does not mutate a controlled input while a streamed route hydrates.

## 5. Architecture and contracts

- The seven Knowledge Base tabs are Property Registry, Technology Concepts, Relationships, Technology Platforms, Vendor Generations, Coverage & Unmapped and Usage & Impact.
- Smart Builder has 12 explicit steps: intent, recommendation, server context, type, object data, components, compatibility mapping, resources, visibility, assignment, validation and save/return.
- Recommendation selects ComponentPack, Direct Assignment, Assembly Bundle, Storage Topology or Component Type Definition from intent/reuse/resource answers; vendor names do not affect policy.
- Compatibility mapping and readiness are server results from stage 04. Admin never computes availability or accepts executable validators.
- Compound writes create disabled/draft records, record IDs in order and compensate in reverse order. Navigation occurs only after success.
- Drafts are actor-owned, versioned creation-wizard sessions with debounced autosave, recovery and dirty-close protection.

## 6. Data safety

- Generated migration adds only `server_configurator_admin_audit_event` and its active-row, actor/time and entity/time indexes.
- Forward migration contains no drop, truncate, delete or legacy-table recreation; it applied successfully to the local PostgreSQL database.
- Generic knowledge mutation stores before/after snapshots and restores update/delete state on compensation.
- Direct-to-Pack restores the original direct assignment if any pack/item/assignment/audit write fails.
- Smart Builder cleans compound writes in reverse order on both immediate error and workflow rollback.
- No fake “none” component is created; absence is an Option Group state.

## 7. Route and permission inventory

| UI route | Purpose |
|---|---|
| `/app/server-configurator/knowledge-base` | Seven canonical registry/coverage/usage sections |
| `/app/server-configurator/smart-builder` | 12-step component/pack/bundle/storage/type builder |
| `/app/server-configurator/option-groups` | Candidate sources, quantities, cardinality and none state |
| `/app/server-configurator/models/:id/direct-components` | Model-specific choices, kits, hidden technical parts and conversion |

All `/admin/server-configurator/*` reads and writes require an authenticated Medusa Admin. Draft lists are additionally owner-filtered. Writes record `auth_context.actor_id`. Public Store clients may only read published option DTOs; they cannot call knowledge, draft, audit or apply APIs. Granular publisher/approver RBAC is deferred, and builder output remains disabled until explicit publication.

## 8. Create-and-Return scenarios

| Scenario | Success | Failure / recovery |
|---|---|---|
| Direct component | Component + model assignment + audit; returns highlight ID | Deletes assignment/component in reverse order |
| Candidate pack | Disabled pack + ordered items + optional scope assignment | Removes scope, items and pack |
| Assembly bundle | Disabled assembly pack + ordered parts | Same reverse-order compensation |
| Storage option | Cage + backplane + option + topology + audit | Removes topology, option, backplane and cage |
| Direct → Pack | Disabled pack + item + model PackAssignment; direct removed last | Recreates original direct assignment and removes new graph |
| Draft autosave | Actor-owned session resumes at current step | Failed apply keeps the saved draft and current UI context |

## 9. Runtime screenshots

- `reports/stage-05-screenshots/knowledge-base.png`: populated canonical Property Registry and seven-section navigation.
- `reports/stage-05-screenshots/smart-builder.png`: accessible FocusModal, 12-step progress and six entity intents.
- `reports/stage-05-screenshots/option-groups.png`: explicit empty state and create action.
- `reports/stage-05-screenshots/direct-components.png`: model context, engine readiness and direct/storage entry points.
- Authenticated browser pass loaded all four routes with `problems=0` across HTTP responses, console errors and page errors. A temporary verifier Admin was removed after capture.

## 10. Verification

| Command | Result | Evidence |
|---|---:|---|
| `npx medusa db:generate serverConfigurator` | 0 | Generated audit migration and updated module snapshot. |
| `npx medusa db:migrate` | 0 | Stage-03 and stage-05 pending migrations applied; links synchronized. |
| `npm run typecheck` | 0 | Backend and storefront compile. |
| `npm run lint` | 0 | 0 errors; 81 backend and 22 storefront pre-existing warnings remain visible. |
| `npm test` | 0 | Backend 69 unit, storefront 12 unit, module 1 and HTTP 1: 83 checks. |
| `npm run build` | 0 | Medusa backend/Admin and Next production builds passed; 47/47 Next pages generated. |
| `npm run test:smoke` | 0 | Playwright 5/5 after removing screenshot-induced caret mutation. |
| authenticated Admin Playwright pass | 0 | Four routes, modal state and engine-backed Direct page; no problems. |
| `git diff --check` | 0 | No whitespace errors. |

## 11. Stage-04 API proof

- Smart preview calls `validateCompatibilityReadiness` with `assisted_preview`, returns `writes_performed: false` and has a unit assertion that create/update/delete are untouched.
- Smart Builder validation displays the server engine status, blockers, recommendations and affected candidate count.
- Option Group preview calls both the Store options endpoint and Admin readiness endpoint; disabled reasons and maximum quantities remain engine-owned.
- Direct Components runs readiness on mount and on explicit recheck. No local fallback or client-side rule evaluator exists.

## 12. Unfinished and unverified

- Medusa currently supplies one authenticated Admin authorization boundary; fine-grained read/editor/approver/publisher roles are not implemented.
- Compound compensation is unit/source-contract verified and uses Medusa workflow rollback; a forced production database fault-injection run was not performed.
- Full Server Wizard remains stage 06. Bulk import/apply remains stages 07–08.
- Option Groups are empty in the current local dataset; the empty state and typed create form were browser-verified without inventing production data.

## 13. Risks and technical debt

- Audit before/after JSON can grow with large entities; retention/archival policy should be set before high-volume production editing.
- Usage counts are live aggregate queries. Real cardinality may justify cached counters after production profiling.
- Builder records are disabled but authentication is broad; stage 17 security audit should define granular publish privileges.
- Existing npm config, build fallback, Jest open-handle and lint warnings remain non-blocking and visible.

## 14. Definition of Done

| Criterion | Status | Evidence |
|---|---|---|
| Seven Knowledge Base sections | Complete | Runtime screenshot and route source |
| Typed create/edit UI | Complete | FocusModal, Drawer and entity-specific fields |
| Smart recommendation | Complete | Deterministic recommender and tests |
| 12-step wizard | Complete | ProgressTabs runtime screenshot |
| Direct/Pack/Bundle/Storage/Type | Complete | Schemas, UI payloads and workflows |
| Direct Components UI | Complete | Grouped roles, resources, source and conversion |
| Smart Storage Cage builder | Complete | Multi-zone bay groups, backplane, limits and topology apply |
| Option Group builder | Complete | Sources, cardinality, none, quantities and engine preview |
| Draft/autosave/recovery | Complete | Actor sessions, debounce, resume and dirty-close guard |
| Create-and-Return compensation | Complete | Reverse-order cleanup and original assignment restore |
| Permissions and audit trail | Complete | Authenticated routes, owner drafts and actor before/after audit |
| Stage-04 engine reused | Complete | API/source/runtime proof; no local evaluator |

## 15. Gate

```text
NEXT_STAGE_GATE: GO
```

## 16. Next-stage overrides

```text
NEXT_STAGE_OVERRIDES:
- Build the full Server Wizard on the stage-03 registries and stage-04 engine; do not duplicate compatibility calculations in Admin.
- Reuse Smart Builder create-and-return and actor-owned draft contracts for nested component, pack and storage creation.
- Keep created server graphs draft/disabled until explicit readiness and publication confirmation succeed.
- Preserve reason codes, trace, source provenance and repair recommendations in every server-step preview.
- Treat Option Group none as state, never as a fake Component/SKU.
- Add granular publication confirmation without weakening the authenticated Admin boundary or audit trail.
- Keep user-owned untracked audit/roadmap files outside stage commits.
```

## 17. Handoff summary

Stage 06 can compose a full Server Wizard from canonical platform/generation/family/model/chassis/storage/property/assignment records. Nested creation should enter the existing Smart Builder with return/highlight context, and all previews/publication checks must continue through the stage-04 engine.
