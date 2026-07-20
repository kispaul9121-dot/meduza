# Orchestrated stage sequence

Stages are executed in order and gated by `reports/stage-XX-report.md`. A stage may advance only with `NEXT_STAGE_GATE: GO`; `GO_WITH_CORRECTIONS` is resolved in the same stage, and a real external blocker produces `STOP`.

1. Baseline, tooling and guardrails.
2. Canonical routes, navigation and redirects.
3. Domain entities, schemas, invariants and provenance.
4. Compatibility Engine decisions and calculators.
5. Reusable Admin knowledge base and builders.
6. Controlled core Server Creation Wizard.
7. Genius Bootstrap modes, confirmation, manifest and recovery.
8. Staging, vendor adapters and transactional import apply.
9. Backend catalog query, filters, facets and counts.
10. Storefront catalog, product, compare and favorites.
11. Versioned ReadyConfiguration technical snapshot.
12. Server-validated cart, pricing, RFQ and B2B checkout.
13. Content, knowledge and document publication state.
14. Multibrand and future-generation proof.
15. Functional UX, accessibility, performance and Publishing Assistant.
16. SEO representation, canonical URLs, schema, sitemap and indexation.
17. Independent read-only technical audit and project readiness.

Stage 18 is a separate manual read-only design analysis. It is never launched by the technical orchestrator.

Each implementation stage owns only its row in `STAGE_OWNERSHIP_MAP.md`, records exact verification evidence, creates an atomic commit, and passes explicit overrides to the next stage through the orchestrator state.
