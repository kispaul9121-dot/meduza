# Stage 01 report — Repository Baseline and Guardrails

## 1. Executive summary

Stage 01 established a reproducible monorepo baseline without changing the configurator domain model. Hidden storefront checks were restored, cross-platform scripts and real test suites were added, CI was defined, generated artifacts were removed from Git tracking, and architecture guardrails were recorded.

Result: baseline controls are executable and the stage gate is `GO`.

## 2. Input control

- Previous report: none (`INPUT_REPORTS: NONE`).
- Input gate: orchestrator bootstrap.
- `NEXT_STAGE_OVERRIDES`: none.
- Starting commit: `21120aef106ef33567b154ca3689129ffd2e6038` on `main`; work moved to `codex/master-orchestrator-01-17` before edits.
- Pre-existing user files under `docs/` were left untouched and are not included in the stage commit; only the three new `docs/architecture/*` files are stage-owned.
- Runtime: Node 24.11.1, npm 11.6.2, Medusa 2.17.2, Next.js 15.5.18.
- Inventory: 51 backend routes, 14 Admin pages, 20 storefront pages, three configurator migrations.

### Pre-existing failures

- `npx medusa --version` from repository root timed out; the workspace package version is used instead.
- `npm run lint` failed because the global AJV override broke ESLint and storefront used deprecated `next lint`.
- Backend unit/module/HTTP scripts failed on Windows because they used POSIX `NAME=value` syntax.
- Root `npm test` exited 0 while Turbo executed zero tasks.
- Storefront build explicitly skipped TypeScript and ESLint validation.
- Existing code produced 82 backend lint warnings and 25 storefront warnings once lint was restored.

## 3. Skills

- Loaded `building-with-medusa`, including `custom-modules.md` and `workflows.md`, to verify module registration, migration discipline and module -> workflow -> API layering.
- Loaded `supabase-postgres-best-practices`, including safe constraints and foreign-key index guidance.
- `systematic-debugging` and `verification-before-completion` were listed by the prompt but are unavailable in this environment. Confirmed failures were isolated through command evidence; completion was verified with the project matrix and read-only review.
- No unrelated skills were loaded.

## 4. Changed files

### Backend

- `apps/backend/package.json`: cross-platform test scripts, typecheck and real ESLint command.
- `apps/backend/jest.config.js`: unit/module/HTTP suite selection.
- `apps/backend/integration-tests/setup.js` and `integration-tests/http/health-route.spec.ts`: deterministic HTTP route contract.
- `apps/backend/src/modules/server-configurator/__tests__/applicability.unit.spec.ts` and `applicability.spec.ts`: unit and module candidate-boundary coverage.

### Storefront

- `apps/storefront/next.config.js`: removed hidden lint/typecheck bypasses.
- `apps/storefront/eslint.config.mjs`, `jest.config.js`, `playwright.config.ts`: lint, component test and smoke harnesses.
- Divider component test and Playwright runtime smoke.
- Narrow safety corrections in cart/configurator boundaries, `Link` navigation, and removal of redundant `@ts-ignore` directives so restored checks pass.

### Tooling and CI

- Root `package.json`, `package-lock.json`, `turbo.json`: private workspace, explicit typecheck/unit/integration/smoke contracts and compatible dependency graph.
- `.github/workflows/quality.yml`: lockfile install, typecheck, lint, tests, builds and smoke on Node 20 with disposable PostgreSQL.
- `.gitignore`: logs, TypeScript build info, Medusa/Next output, agent files, archives, coverage and Playwright output.
- Removed tracked logs, `.codex/tmp/*`, `apps/backend/src.zip` and `apps/storefront/tsconfig.tsbuildinfo` from the index while retaining local ignored copies.

### Documentation and reports

- `docs/architecture/current-state.md`, `stage-sequence.md`, `decision-log.md`.
- `reports/orchestrator-state.json` and this report.

## 5. Architecture and contracts

- No data models, API DTOs, routes or migrations were added or changed.
- Root verification contract is now `typecheck`, `lint`, `test:unit`, `test:integration`, `test`, `build` and `test:smoke`.
- ADRs fix the generic-core/vendor boundary, one canonical property registry, candidate-pack versus compatibility ownership, raw versus normalized data, provenance, migrations-only changes, single product identity, server trust boundaries and report gates.
- Backward compatibility is preserved; runtime edits only replace unsafe boundary typing and an internal anchor with `next/link`.

## 6. Data safety

- No schema or data mutation occurred.
- Existing migrations and snapshots were not regenerated.
- CI uses an ephemeral PostgreSQL 16 service with trust authentication and no stored credential.
- Future foreign keys require indexes; constraint migrations must use PostgreSQL-valid existence checks.
- Rollback is a normal Git revert of this stage commit; no data backfill is needed.

## 7. Verification

| Command | Result | Evidence |
|---|---:|---|
| `npm ci --dry-run --ignore-scripts --offline` | 0 | Lockfile is consistent; reported up to date. |
| `npm run typecheck` | 0 | Backend and storefront: 2/2 Turbo tasks successful. |
| `npm run lint` | 0 | 0 errors; 82 visible backend warnings and 25 visible storefront warnings. |
| `npm test` | 0 | Unit/component: 2 suites, 3 tests; module/API integration: 2 suites, 2 tests. |
| `npm run build` | 0 | Medusa backend/Admin and Next storefront production builds succeeded; Next performed lint/type validation. |
| `npm run test:smoke` | 0 | Playwright 1/1; runtime `/robots.txt` returned OK and contained `User-Agent`. |
| `git diff --check` | 0 | No whitespace errors. |
| forbidden tracked artifact query | 0 | No logs, tsbuildinfo, `.codex`, build directories or archives remain tracked. |
| secret-pattern scan (worktree and history) | 0 | No matching secret material after CI credential correction. |
| ignore-flag search | 0 | No `ignoreBuildErrors` or `ignoreDuringBuilds`. |

## 8. Runtime/manual scenarios

- Playwright started the storefront using explicit non-secret smoke environment values and fetched `http://127.0.0.1:8000/robots.txt` successfully.
- The HTTP contract invoked `GET /store/custom` and verified status 200.
- Production build generated all 47 static pages and dynamic route manifests.
- Build-time source fetches logged `EACCES` in the local environment but existing catch/fallback behavior allowed deterministic completion; no assertion depends on external source availability.

## 9. Security and permissions

- `.env*`, keys, logs, archives and local agent output are excluded from tracking.
- Worktree/history secret-pattern scan found no secret values.
- Historical root audit reports contain hardcoded local path references; they contain no detected credentials and are retained as historical evidence, not runtime configuration.
- Storefront continues to use SDK clients; no direct database access was introduced.
- Test/CI credentials are synthetic and the CI database uses no password.

## 10. Unfinished and unverified

- No live database migration/up/down cycle was run because this stage changed no schema.
- The new module and HTTP integration suites are deterministic contract tests, not a full live-PostgreSQL Medusa boot; schema-owning stages must add database-backed coverage.
- CI workflow was validated structurally and through its local command matrix but has not yet executed on GitHub Actions.
- Jest uses `--forceExit`; no open-handle leak was observed in these synchronous tests, but later database suites should remove it where feasible.

## 11. Risks and technical debt

- 82 backend and 25 storefront lint warnings remain visible. Workflow/step identifier renames can affect persisted workflow identities and were not mass-fixed in baseline scope.
- npm warns that the `.npmrc` `auto-install-peers` project option will be unsupported in a future npm major.
- Local production generation logs failed external fetch attempts (`EACCES`); later runtime/data stages must distinguish permitted fallbacks from required sources.
- These are recorded debt, not current gate blockers; all mandatory commands exit successfully and do not suppress errors.

## 12. Stage-specific evidence

### Baseline command matrix

The exact successful commands and exit statuses are in section 7. Initial failures are listed in section 2 and were reproduced before changes.

### Branch, CI and test policy

- Orchestrator branch: `codex/master-orchestrator-01-17`.
- One atomic commit per `GO` stage; unrelated user changes are excluded with path-specific staging.
- CI installs with `npm ci`, then independently runs typecheck, lint, tests, builds and Playwright smoke.
- Test suite names/counts: backend applicability unit (2), storefront Divider component (1), module candidate preview (1), HTTP health contract (1), Playwright smoke (1).

### Artifact and secret confirmation

- Tracked forbidden-artifact query: `NONE`.
- Tracked secret environment files: only `apps/backend/.env.template`.
- Worktree/history secret scan: `NONE` after correction.

## 13. Definition of Done

| Criterion | Status | Evidence |
|---|---|---|
| Repository cleaned | Complete | Generated logs, archives, `.codex` and tsbuildinfo removed from tracking and ignored. |
| Checks are not hidden | Complete | Next ignore flags removed; lint/typecheck execute in build and standalone. |
| CI and test harness work | Complete | Local matrix green; five Jest tests plus one Playwright smoke; CI mirrors commands. |
| Initial state documented | Complete | Three architecture documents plus baseline evidence in this report. |
| Stable commands for later stages | Complete | Root scripts and Turbo tasks normalized. |

## 14. Gate

```text
NEXT_STAGE_GATE: GO
```

Independent review initially returned `GO_WITH_CORRECTIONS` for a literal disposable PostgreSQL password in CI. The CI service was changed to trust authentication, the secret scan was rerun, and the final review result is `GO`.

## 15. Next-stage overrides

```text
NEXT_STAGE_OVERRIDES:
- Preserve the root verification command contract introduced in stage 01.
- Treat existing lint warnings as visible technical debt; do not rename persisted workflow/step IDs without a compatibility decision.
- Keep user-owned untracked docs outside path-specific stage commits.
```

## 16. Handoff summary

Stage 02 can rely on green typecheck, lint, Jest, build and Playwright smoke commands. It owns canonical routes and navigation only; domain changes remain deferred to stage 03.
