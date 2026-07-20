# Current architecture baseline

Baseline captured for stage 01 from commit `21120aef106ef33567b154ca3689129ffd2e6038` on the orchestrator branch.

## Runtime and repository

- npm workspaces with Turbo; applications live in `apps/backend` and `apps/storefront`.
- Node baseline: 20 or newer. The stage was executed with Node 24.11.1 and npm 11.6.2.
- Backend: Medusa 2.17.2, custom `serverConfigurator` module, 51 API route handlers, 14 Admin pages and three tracked module migrations.
- Storefront: Next.js 15.5.18 App Router with 20 page entry points.
- PostgreSQL is the persistence contract. `DATABASE_URL` is supplied by environment; schema changes are applied only through Medusa module migrations.

## Layering

The required mutation path is module data/service -> workflow steps/composition -> API route -> Admin or storefront SDK client. Storefront code must not connect to PostgreSQL directly. Cross-module data uses Medusa query/link contracts.

The existing configurator includes models, components, component packs, applicability, compatibility rules, configurations, Admin CRUD pages and store routes. Later stages own any domain corrections; this baseline only makes their verification reproducible.

## Reproducible controls

From the repository root:

- `npm ci` installs exactly from `package-lock.json`.
- `npm run typecheck` checks both workspaces.
- `npm run lint` lints backend and storefront sources.
- `npm run test:unit` runs real backend and storefront tests.
- `npm run test:integration` runs backend module and HTTP contract suites.
- `npm run build` builds both production applications.
- `npm run test:smoke` starts the storefront and checks a runtime endpoint with Playwright.

The same matrix is enforced by `.github/workflows/quality.yml`.

## Data and migration discipline

- Models are registered through the Medusa module and represented by generated migrations and snapshots.
- Migrations must be additive or include explicit backfill/recovery. Existing data must not be replaced with seed data.
- Foreign-key access paths require indexes; constraints must use PostgreSQL-valid, safely repeatable migration patterns.
- Raw imported evidence stays separate from normalized, publishable values.

## Known baseline constraints

- Integration suites added in stage 01 are deterministic contract tests and do not yet exercise a live migrated database; domain stages must add database-backed coverage when their scope introduces schema or transactional behavior.
- Local `.env` values are intentionally not tracked.
- Existing root audit documents are historical project artifacts and are not normative contracts unless a later stage explicitly adopts them.
