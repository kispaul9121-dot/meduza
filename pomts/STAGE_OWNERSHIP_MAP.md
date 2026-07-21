# STAGE OWNERSHIP MAP

| Этап | Владеет | Не владеет |
|---|---|---|
| 01 | baseline, tooling, guardrails, CI/test contracts | domain/UI redesign |
| 02 | canonical URL strategy, route contracts, redirects | реализация будущих features |
| 03 | domain entities, schemas, invariants, inheritance, provenance | algorithms и Wizard UX |
| 04 | compatibility resolution, calculators, validation modes | Admin/import |
| 05 | Admin registries, CRUD and specialized builders | full Server Wizard |
| 06 | core Server Creation Wizard, coverage and impact | Genius modes/bulk/import |
| 07 | Genius Bootstrap, modes, confirmation, manifest and recovery | transactional import apply |
| 08 | vendor adapters, staging, validation and transactional apply | runtime compatibility policy |
| 09 | backend catalog query, facets and counts | visual storefront |
| 10 | storefront catalog/product/compare/favorites | cart/RFQ |
| 11 | canonical ReadyConfiguration snapshot/version | alternate order schema |
| 12 | cart, pricing, RFQ, B2B checkout and commerce snapshot | statutory accounting |
| 13 | content, documents, knowledge publication state | SEO representation |
| 14 | multibrand/future-generation proof | vendor-specific generic core |
| 15 | functional UX, component consistency, performance, Publishing Assistant | visual direction |
| 16 | SEO metadata, canonical, schema, sitemap, redirects and indexation | content authoring |
| 17 | independent read-only technical audit and readiness | remediation/design |
| 18 | read-only visual/design analysis and proposals | implementation |

## Critical shared boundaries

### Domain → Engine → Admin

- Stage 03 defines contracts.
- Stage 04 evaluates contracts.
- Stages 05–07 consume the engine and must not recreate it.

### Admin builders → Core Wizard → Genius Wizard

- Stage 05 creates reusable Admin tools.
- Stage 06 proves a controlled core flow.
- Stage 07 adds automation only after the core flow is stable.

### Genius Wizard ↔ Import

- Stage 07 owns Creation Manifest, preview and user confirmation.
- Stage 08 owns staging, transaction, retry and rollback.
- Bulk Apply calls the shared stage-08 apply workflow; no parallel bulk engine.

### Ready configuration ↔ Cart/Order

- Stage 11 owns canonical technical snapshot.
- Stage 12 stores a commerce-safe immutable copy/reference.

### Content ↔ SEO

- Stage 13 owns content and publication state.
- Stage 16 owns SEO representation and indexation.

### Functional UX ↔ Design

- Stage 15 fixes functional blockers without visual redesign.
- Stage 18 proposes visual changes without code modifications.

### Audit

- Stage 17 is read-only and always stops automation.
- Stage 18 is manual and requires explicit user authorization.
