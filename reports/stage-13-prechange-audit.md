# Stage 13 Pre-change Audit

## Method and evidence limits

This audit was performed before Stage 13 code changes against commit `aabd10abb8fd48a500b0e4b1bb15008cc41b07f2` using repository inspection, the committed Playwright suite, API/workflow contracts and the previous Stage 12 verification history.

The connected GitHub environment does not expose an interactive Chrome DevTools session. Existing Playwright tests already capture desktop compare, mobile navigation, mobile component catalog and ready-configuration screenshots. A fresh clean CI run, screenshots and performance-budget artifact are required after the Stage 13 branch is opened. No invented Lighthouse/Core Web Vitals numbers are used.

## Previous-stage gate

`reports/stage-12-report.md` was missing and was restored before implementation. Stage 12 recommendations applied as mandatory inputs:

- preserve the separate RFQ workflow;
- preserve server-side Medusa price/availability resolution;
- preserve checkout revalidation and immutable snapshots;
- run migrations, typecheck, lint, tests, production build and browser smoke in one reproducible workflow;
- keep the deterministic Medusa mock available for build and browser verification.

## Surface audit

### Navigation and home

- Server navigation uses canonical routes and has a mobile menu with Escape dismissal.
- Browser history and refresh are covered by Playwright.
- Main risk: many Admin configurator tools are presented as an undifferentiated list; publication readiness has no primary entry point.

### Server catalog and filters

- Catalog filters are URL-backed and history-restorable.
- Loading, retry and empty states exist.
- The catalog already uses one registry-driven template for HPE and Dell.
- Risk: no committed route/API payload budget; regressions can enter unnoticed.

### Server detail and configurator

- Server pages expose section navigation, configuration groups, effective technical data and source-backed model data.
- Backend compatibility remains the source of truth.
- Risk: Admin publication can still depend on a generic readiness response that does not explain storage, option-group and direct-component repair paths in one DTO.

### Component catalog

- Component category and detail pages expose technical identity and honest commerce state.
- Mobile focusability is covered by Playwright.
- Risk: validated direct components may be publishable without a full type/fact/validator readiness explanation.

### Compare

- Already supports a shareable URL, differences-only mode, grouped specifications, remove/configure actions and mobile overflow layout.
- Playwright verifies the shareable URL and differences-only control.
- No structural rewrite is justified; Stage 13 should preserve this implementation and guard it with existing tests.

### Favorites

- Device-local persistence and missing-publication messaging exist.
- Playwright verifies persistence.

### Cart and RFQ

- Configured-server cart rows already group CPU, memory, drives, RAID, NIC and PSU.
- Effective specs, warnings, optional-group states and hidden technical auto-added components are visible.
- Quantity updates and deletion use configured-cart server actions rather than generic line mutation.
- RFQ is separate from purchase and does not create a zero-price order.
- Risk: this behavior is not represented in a formal design-system inventory; future UI changes can drift.

### Admin Server Model, Pack Library and import/review

- Dedicated Admin routes exist for models, direct components, packs, applicability, option groups, Smart Builder, Knowledge Base, Coverage & Impact and import review.
- Bulk/import paths already separate preview/dry-run from apply.
- Main gap: no single publication screen combines model capability, storage, packs, direct components, properties, relations, inheritance and exact deep links.

## Accessibility and interaction findings

- Existing storefront controls use native buttons, links, labels and semantic tables in the audited critical flows.
- Mobile menu keyboard dismissal and focus visibility are tested.
- Publishing readiness currently has no dedicated status hierarchy for complete, warning, blocking error and optional improvement.
- Repair actions need explicit buttons and must not mutate data automatically.

## Design-system findings

Existing CSS already defines server semantic colors, typography families, surfaces, borders, radius and shadow tokens. Medusa Admin consistently uses Medusa UI primitives. The missing artifact is a canonical inventory explaining which primitives own Button/Input/Dialog/Table/Card/Tabs/Badge/Toast/Skeleton behavior and how storefront tokens map to light/dark states.

## Performance baseline findings

- Next production build and browser smoke are already CI gates.
- No deterministic JavaScript total/chunk/count budget is committed.
- No artifact records observed bundle size for comparison between runs.
- LCP, INP, CLS, image weight, request count, API payload size and catalog query time require a deployable browser/network environment; these are not fabricated in this audit.

## Publishing-readiness gaps

The existing readiness service checked property mapping, relation mapping, inheritance and bulk-manifest consistency, but did not provide the complete Stage 13 publication contract:

- no required CapabilityProfile publication check;
- no complete ServerStorageOption structural check;
- no direct-component role/visibility/trigger/provides/pack-duplication checks;
- no option-group source/cardinality/none-state checks;
- no structured finding DTO with affected entity, inherited source, exact repair action, deep link and revalidation requirement;
- no cross-model direct-component reuse recommendation;
- no dedicated Publishing Assistant;
- no repair CreationWizardSession with preserved server/finding context.

## Planned changes

1. Extend the single readiness engine only in `production_validation` mode, preserving guided/assisted/bulk contracts.
2. Feed cross-model direct assignments into readiness for convert-to-pack recommendations.
3. Add a dedicated Admin Publishing Assistant that never auto-publishes.
4. Add explicit repair-session creation and audit events.
5. Keep the existing publish workflow as the only publication mutation and make it consume the same readiness service.
6. Add unit coverage for allowed publication, missing storage, invalid hidden direct components and informational relations.
7. Add deterministic storefront bundle budgets and retain the report as a CI artifact.
8. Document the existing canonical storefront/Admin design system instead of introducing a competing UI library.
