# Stage 06 report — Core Server Creation Wizard and Coverage Analysis

## 1. Executive summary

- Goal: prove a controlled daily server-creation path before introducing Genius automation or Bulk Apply.
- Delivered: actor-owned 14-step Core Server Wizard, side-effect-free inheritance/coverage preview, compensated disabled-graph materialization, engine-gated transactional Medusa Product publication, Coverage & Unmapped dashboard and read-only impact analysis.
- Result: authenticated Admin E2E, 89 automated checks, production builds and storefront smoke are green. Gate is `GO`.

## 2. Input control

- Read `reports/stage-05-report.md`; incoming gate was `GO`.
- Read the stage-06 prompt, master orchestrator, common contract, ownership map, report template and stage-05 overrides.
- Reused stage-03 canonical registries, stage-04 Compatibility Engine and stage-05 Smart/Storage/Property/Option Group builders.
- Baseline: branch `codex/master-orchestrator-01-17`; stage-05 commit `c4aa348`. User-owned untracked audit/roadmap documents remained untouched and excluded.

## 3. Skills

- Loaded `building-with-medusa` for validated Admin APIs, module-service operations and compensated workflows.
- Loaded `building-admin-dashboard-customizations` plus its required references for authenticated SDK calls, FocusModal wizard structure, loading/error states and Admin navigation.
- Loaded `react-best-practices` for stable reference queries, local draft boundaries, mutation invalidation and debounced autosave.
- Loaded `frontend-testing-debugging`; the browser connector was unavailable, so the real Admin was exercised with repository Playwright and installed Chromium.
- Prompt skills `composition-patterns` and `verification-before-completion` were unavailable; their required outcomes were implemented directly through reusable panels, source-contract tests and the complete gate.

## 4. Changed surface

### Domain, APIs and workflows

- `core-server-wizard.ts`: exact 14-step contract, deterministic draft blockers and explicit disabled ServerModel/CapabilityProfile payloads.
- Core context, draft, preview, materialize and publish Admin APIs with typed Zod middleware.
- Materialization workflow for ServerModel, CapabilityProfile, chassis, properties, packs, direct assignments and selected option-group copies.
- Publication workflow that re-runs stage 04, creates Medusa Products/Variants, links generated IDs and enables the validated graph.
- Coverage analysis and read-only impact analysis APIs.

### Admin and documentation

- `/app/server-configurator/server-wizard`: full FocusModal creation flow and resumable draft list.
- `/app/server-configurator/coverage-impact`: coverage counts/findings and impact preview.
- Server Configurator home links for both surfaces.
- ADR-013 `docs/architecture/core-server-wizard.md` and decision-log entry.
- Five verified images under `reports/stage-06-screenshots/`.

## 5. Architecture and publication boundary

The draft, technical graph and commerce product are deliberately separate states:

1. Autosave writes only an actor-owned `CreationWizardSession` and audit evidence.
2. Preview resolves inheritance and coverage without writes.
3. A source-complete draft materializes an explicit disabled technical graph with reverse-order compensation.
4. Stage-04 readiness runs against that real graph, never a browser-only approximation.
5. Explicit confirmation plus all-ready simulations allows transactional Product/Variant creation and technical publication.

No price is invented. Product variants are created without `prices`, and no manual `prod_...` or `variant_...` input appears in the primary flow.

## 6. Step/state matrix

| Step | Canonical state / action | Validation and persistence |
|---:|---|---|
| 1 | Scratch, generation template, clone, documentation or saved draft | Draft state only; no product/model write |
| 2 | Vendor, family, model, public name, slug, form factor, chassis and source | Required source-backed identity |
| 3 | TechnologyPlatform, VendorGenerationTemplate and ServerFamily | Inherited properties/packs shown before exclusions/overrides |
| 4 | Socket concept, quantity, ownership, TDP/cooling and CPU packs | Socket is a canonical concept; free text is rejected |
| 5 | Memory concept, module types, slots/channels, capacity, profiles, speed and packs | Canonical technology plus positive slot count |
| 6 | Chassis variants, bays/backplane, protocols, controllers and drive packs | Links to stage-05 Smart Storage after materialization |
| 7 | Risers, physical/OCP slots, lane/shape/ownership/conflict data | Requires explicit slots or explicit none record |
| 8 | PSU packs, power budget, cooling mode, fans/heatsinks, zones and conditions | Unknown is explicit; invalid negative budget blocks |
| 9 | Embedded/NIC packs, management concept, boot/direct/bundle references | Canonical management generation and existing components/groups |
| 10 | Optional Configurator Groups | Uses real Option Groups and stage-05 create-and-return |
| 11 | Single card/chassis options, catalog cards, separate products or shared platform | Workflow generates commerce IDs automatically |
| 12 | Property assignments and inherited/direct/override/unmapped coverage | Unresolved compatibility properties block publication; Property Wizard linked |
| 13 | Representative components, explicit none and storage options | Calls only stage-04 server engine; recommendations are not applied |
| 14 | Reviewer, notes, draft save, materialize, engine re-run, confirmation and publish | Publish disabled until graph exists and every simulation is ready |

## 7. E2E core Wizard scenario

The authenticated Playwright scenario used a temporary Medusa Admin and the real local backend/Admin on port 9000:

1. Logged in and opened `/app/server-configurator/server-wizard`.
2. Started a new server and verified `Step 1 of 14: Creation method`.
3. Traversed all 14 steps and invoked `Run stage-04 simulation` on step 13.
4. Confirmed an incomplete, unsourced draft was not materializable: exact step blockers were rendered and preview reported `writes: false`.
5. Entered a reviewer, saved step 14, closed the modal, reopened the saved draft and recovered step 14 plus the reviewer value.
6. Opened Coverage & Impact, loaded live counts, selected a canonical PropertyDefinition and ran read-only impact preview.
7. Observed zero unexpected HTTP responses, console errors or page errors after authentication.

The local registry lacks enough sourced model-specific facts for a truthful successful publication. The E2E therefore proves the required path through publication review and the fail-closed gate. Unit/source contracts prove ready-fixture materialization/publication behavior without inventing production technical data or prices.

## 8. Draft save/continue evidence

- Draft GET is filtered by `auth_context.actor_id`, `mode_hint: core_server` and resumable states.
- Debounced autosave records the exact current step and complete versioned payload.
- Explicit Save uses the same actor-owned contract.
- Dirty close and `beforeunload` guards prevent accidental loss.
- Runtime screenshot `03-resumed-draft.png` shows restored step 14 with `Stage 06 browser verifier` intact.
- Test-only sessions, audit events and the temporary Admin were removed after the run.

## 9. Coverage and impact evidence

- Live local counts shown in `04-coverage-dashboard.png`: 15 properties, 10 engine-mapped, 0 unmapped, 0 missing validator, 11 concepts without relations and 12 packs without effective entities.
- Findings include properties without usage, compatibility mapping gaps, relationship validator/usage gaps, duplicate aliases/concepts, inherited conflicts and deprecated usage.
- `05-impact-preview.png` selects `Accelerator subtype` and shows affected ServerModels, Components and potentially invalid carts/configurations, plus `revalidation_required` and `writes_performed: false`.
- Impact supports PropertyDefinition, TechnologyConcept, TechnologyRelation and PackAssignment inputs and performs no mutation.

## 10. Data safety and recovery

- Preview and impact routes are read-only and declare `writes_performed: false`.
- Duplicate ServerModel slugs block materialization.
- Materialization creates disabled records, records every created ID and compensates in reverse creation order.
- Publication requires explicit confirmation, re-runs deterministic readiness and creates Products through Medusa workflows.
- Product compensation uses Medusa product deletion before restoring technical state.
- Existing actor session state is restored if a later workflow step fails.
- No schema migration was required for stage 06; the actor-session and canonical domain models from stages 03/05 are reused.

## 11. Permission and route inventory

| Route | Access | Writes |
|---|---|---:|
| `/admin/server-configurator/core-wizard/context` | Authenticated Admin | No |
| `/admin/server-configurator/core-wizard/drafts` | Authenticated Admin, owner-filtered | Session/audit only |
| `/admin/server-configurator/core-wizard/preview` | Authenticated Admin | No |
| `/admin/server-configurator/core-wizard/materialize` | Authenticated Admin | Disabled technical graph, compensated |
| `/admin/server-configurator/core-wizard/publish` | Authenticated Admin + explicit confirmation/readiness | Product links and publish state |
| `/admin/server-configurator/coverage-analysis` | Authenticated Admin | No |
| `/admin/server-configurator/impact-analysis` | Authenticated Admin | No |

Store clients cannot call these routes. Medusa's authenticated Admin boundary remains the current coarse permission boundary; actor audit is preserved for mutations.

## 12. Stage-04 engine proof

- Preview calls `validateCompatibilityReadiness` only when a materialized model exists and returns the engine results unchanged.
- Step 13 and the post-materialization recheck call the same server preview API.
- Publication independently calls the engine again; a stale browser result cannot authorize Product creation.
- Unit assertions verify side-effect-free preview, readiness fixture behavior and absence of a second local evaluator.
- Client code only renders readiness, blockers, warnings, candidate counts and provenance.

## 13. Proof of no premature Genius/Bulk behavior

- Core UI/API/workflow source contains no `Genius` or `Bulk` implementation.
- There is one controlled Core mode and one explicit 14-step list.
- No dependency planner, automatic classifier, mode switcher or Bulk Apply endpoint was added.
- Creation recommendations and repair recommendations are never auto-applied.
- Vendor import remains outside this stage.

## 14. Runtime screenshots

- `01-creation-method.png`: step 1 and the five explicit creation methods.
- `02-publication-review.png`: step 14, deterministic blocker list, `preview writes: false` and disabled materialize/publish actions.
- `03-resumed-draft.png`: saved step and reviewer restored after close/reopen.
- `04-coverage-dashboard.png`: populated live Coverage & Unmapped counts/table.
- `05-impact-preview.png`: selected shared property and read-only impact results.

All screenshots were visually inspected. The test passed in 13.2 seconds on its clean run.

## 15. Verification

| Command | Result | Evidence |
|---|---:|---|
| backend unit tests | 0 | 75/75 across 11 suites, including 6 core-wizard checks |
| `npm test` | 0 | Backend 75, storefront 12, module 1 and HTTP 1: 89 checks |
| `npm run typecheck` | 0 | Backend and storefront TypeScript green |
| `npm run lint` | 0 | 0 errors; 83 backend and 22 storefront existing warnings remain visible |
| `npm run build` | 0 | Medusa backend/Admin and Next production builds; 47/47 static pages |
| `npm run test:smoke` | 0 | Playwright storefront 5/5 |
| authenticated Admin Playwright | 0 | 14 steps, engine preview, save/resume, coverage and impact; no post-auth problems |
| `git diff --check` | 0 | No whitespace errors |

## 16. Unfinished, risks and technical debt

- Fine-grained reviewer/publisher RBAC is not implemented; the authenticated Admin boundary is coarse and stage 17 must audit it.
- The current local dataset deliberately blocks a complete server publication because required sourced identity/canonical facts are absent. No fake record was created to make the screenshot green.
- Forced production database fault injection was not performed; compensation is unit/source-contract verified and uses Medusa workflow rollback.
- Coverage aggregate queries are live and may need indexed/cached projections at production cardinality.
- Existing npm config, lint-warning, Next dev-origin, smoke teardown and Jest open-handle warnings remain non-blocking and visible.

## 17. Definition of Done and gate

| Criterion | Status | Evidence |
|---|---|---|
| Method through publication review | Complete | Authenticated E2E and screenshots |
| Inheritance before overrides | Complete | Step 3 preview and API contract |
| Canonical CPU/memory/storage/expansion/power/network/product strategy | Complete | Step matrix, schemas and context API |
| Stage-05 specialized builders | Complete | Storage, Property and Option Group return links |
| Stage-04-only simulation | Complete | Preview/publication source and tests |
| Coverage dashboard | Complete | Live runtime counts/table screenshot |
| Impact analysis | Complete | Property impact runtime screenshot and API |
| Save/continue without loss | Complete | Runtime close/reopen assertion |
| No hidden dependencies/Bulk | Complete | Source scan, disabled graph contract and scope proof |
| Core E2E before Genius | Complete | Clean Playwright pass |

```text
NEXT_STAGE_GATE: GO
```

```text
NEXT_STAGE_OVERRIDES:
- Add Genius planning and alternate creation modes only on top of the ADR-013 draft/materialize/publish boundary; never bypass stage-04 readiness.
- Keep planning and dependency previews side-effect free, explainable and source-aware before any apply action.
- Bulk Apply must be explicit, reviewable, idempotent and compensated; it must not turn recommendations into silent writes.
- Reuse the same canonical references, actor-owned drafts, audit trail and stage-05 create-and-return builders.
- Preserve Core mode as the reliable manual fallback and keep vendor import in stage 08.
- Do not invent technical facts, prices or commerce identities to satisfy readiness.
- Keep user-owned untracked audit/roadmap files outside stage commits.
```

Stage 07 can now layer Genius dependency planning, its three creation modes and controlled Bulk Apply over a proven manual core flow.
