# Stage 13 Report — UX, Performance and Server Publishing Assistant

## Status

Stage 13 is implemented in branch `codex/stage-13-ux-publishing-assistant` and PR #3, which is ready for review. The `main` branch has not been modified or merged.

## Previous-stage gate

Stage 12 was verified and its missing handoff report was restored before Stage 13 implementation. The following Stage 12 contracts were treated as mandatory:

- RFQ remains a separate B2B workflow and never creates a zero-price purchase;
- Medusa calculated prices, region/currency context and availability remain server-side sources of truth;
- checkout revalidates ownership, configuration hash, compatibility, price and availability;
- immutable configuration, RFQ and order snapshots remain preserved;
- migrations, typecheck, lint, automated tests, production build and browser smoke remain one reproducible quality gate.

## Pre-change audit and design system

The pre-change audit is recorded in `reports/stage-13-prechange-audit.md`.

The canonical UI ownership and component inventory are recorded in `docs/design-system.md`:

- storefront: existing Tailwind utilities and semantic `--server-*` / `--payloud-*` tokens;
- Medusa Admin: `@medusajs/ui` primitives;
- existing Headless UI/Radix primitives only where already required;
- no competing Button, Dialog, Table, Badge or Toast system was introduced.

The existing compare and configured-cart implementations already satisfied the requested core behavior, so they were preserved rather than rewritten:

- compare uses a shareable URL, differences-only mode, grouped specifications and responsive local overflow;
- configured cart groups server model, CPU, memory, drives, RAID, NIC and PSU;
- effective specs, warnings, optional states and hidden technical additions remain visible;
- RFQ remains separate from purchase.

## Implemented changes

### Shared deterministic publication readiness

`validateReadiness` remains the single publication-readiness service used by the Admin Assistant and the real server publication workflow. Production validation now evaluates:

- server model existence and complete compatibility graph;
- canonical property definitions, scope, value type, required effective values, validators/fact mappings and inherited conflicts;
- relation mappings and provider/consumer requirements;
- informational relations as evidence-only warnings rather than compatibility blockers;
- direct CapabilityProfile existence and review status;
- enabled ServerStorageOption records, storage cages, drive limits and backplane mappings;
- ConfiguratorOptionGroup candidate sources, cardinality and real none-state consistency;
- direct component existence, enabled state, canonical type definition and validator mapping;
- direct assignment quantity consistency;
- hidden technical role correctness;
- deterministic triggers for auto-added technical components;
- declared capabilities for enablement kits;
- duplicate candidate sources between direct assignments and active packs;
- repeated cross-model direct assignments that should be reviewed for conversion to reusable packs;
- bulk-manifest duplicate identities, missing dependencies, cycles and idempotency.

Each readiness finding contains:

- severity: `complete`, `warning`, `blocking_error` or `optional_improvement`;
- affected entity and label;
- property/relation/component context where relevant;
- inherited source where relevant;
- deterministic explanation;
- exact repair action;
- deep link to the appropriate Admin/Wizard surface;
- explicit revalidation requirement.

Publication is allowed only when `production_validation` reports zero blocking findings.

### Server Publishing Assistant

A dedicated Medusa Admin route was added at `server-configurator/publishing-assistant`.

The Assistant:

- loads server models and runs the shared production-readiness service;
- displays publication status, blocking-error count, warnings, candidate count and entity-level readiness;
- presents structured findings in severity order;
- creates a guided repair session for a selected finding;
- opens the final Wizard review only when publication is allowed;
- never publishes or mutates a server automatically.

### Repair sessions and audit history

A dedicated repair-session endpoint creates a `CreationWizardSession` with:

- selected server model;
- complete readiness finding;
- recommended Wizard/Admin deep link;
- default Guided Manual mode;
- return path to the Publishing Assistant.

Creation of the repair session is recorded as an Admin audit event.

### UX corrections

Browser evidence exposed a duplicated mobile navigation control. The desktop catalog mega-menu is now hidden below 720 px, leaving exactly one mobile menu button. The Playwright contract verifies:

- no desktop `Меню` control remains in the mobile accessibility tree;
- exactly one `Открыть меню` button exists;
- Escape closes the mobile navigation.

### Dependency and CI reproducibility

The storefront dependency declaration and root lockfile were synchronized so a clean `npm ci` is reproducible. Diagnostic artifacts are retained for dependency installation and test failures.

### Performance budgets

A deterministic storefront bundle budget was added after the production build.

Default budgets:

- total JavaScript: at most 8,000,000 bytes;
- largest JavaScript chunk: at most 1,500,000 bytes;
- JavaScript chunk count: at most 250.

Observed final CI values:

- total JavaScript: 1,564,150 bytes;
- largest chunk: 181,580 bytes;
- chunk count: 73;
- violations: none.

The JSON report is retained as the `storefront-performance-budget` workflow artifact.

## Verification evidence

Verified implementation run: `29812137660` on implementation head `926f36e04ced5833211c5d5343636e0d436fa0d7`.

Final report-head verification run: `29812661523` on report head `9d16eef54c9d83105a953ad15cd4bcd48ee6c52c`.

Both runs passed the complete quality workflow. The final report-head run confirmed:

- clean dependency installation;
- PostgreSQL initialization and all Medusa database migrations;
- workspace typecheck;
- workspace lint;
- unit and integration tests;
- production backend/storefront build against the deterministic Medusa mock;
- storefront performance budgets;
- Playwright browser smoke tests;
- browser and performance artifact uploads.

Automated test totals:

- storefront unit: 2 suites, 12 tests passed;
- backend unit: 17 suites, 138 tests passed;
- backend module integration: 1 suite, 1 test passed;
- backend HTTP integration: 1 suite, 1 test passed;
- total: 21 suites and 152 tests passed.

Browser smoke totals:

- storefront navigation, canonical redirects, history/refresh, mobile menu, filters, shared HPE/Dell template, component catalog, compare, favorites and ready configurations: 11 tests;
- Stage 12 RFQ/cart security and separation: 3 tests;
- total Playwright smoke: 14 tests passed.

Retained artifacts:

- `storefront-browser-evidence`;
- `storefront-performance-budget`;
- `test-diagnostics`;
- `npm-ci-diagnostics`.

## Known limitations and non-blocking follow-ups

- No production Lighthouse or real-user Core Web Vitals were fabricated. LCP, INP and CLS must be measured after deployment against the real CDN, images, Medusa backend and production data.
- Browser smoke uses a deterministic Medusa mock. It verifies UI contracts and critical flows but does not replace a staging acceptance test against the real database and payment/inventory integrations.
- The Publishing Assistant Admin screen is covered by typecheck, build and backend unit contracts; a future authenticated Admin Playwright suite should add visual acceptance coverage.
- Jest still emits the existing forced-exit/open-handle advisory. Tests pass, but removing the remaining handles would make the suite cleaner.
- Bundle budgets are deliberately generous initial regression gates and should be tightened after the first production baseline.

## Result

The Stage 13 requirements are implemented without vendor-specific storefront branching, without a second source of truth and without automatic publication. The full quality gate is green, and remaining items are production/staging observability improvements rather than Stage 13 blockers.

`NEXT_STAGE_GATE: GO`
