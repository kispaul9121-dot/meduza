# Этап 16. SEO Module and Search Operations

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `16`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-15-report.md`
- `OUTPUT_REPORT`: `reports/stage-16-report.md`
- `NEXT_STAGE`: `17`


## Skills

- `building-with-medusa` — SEO Admin/data integration
- `building-storefronts` — Next.js metadata, sitemap and routes
- `react-best-practices` — rendering/caching correctness
- `site-architecture` — canonical hierarchy/internal linking
- `seo-audit` — technical SEO verification
- `schema` — structured-data contracts
- `verification-before-completion` — crawl/index evidence

## Ownership

Владеет SEO representation: metadata, canonical, schema, sitemap, robots, redirects и indexation policy.

## Out of scope

- Content authoring domain этапа 13.
- Массовый programmatic SEO до data-quality gate.
- Visual redesign.

## Цель

Создать отдельный SEO domain в backend и единый SEO layer в Next.js после стабилизации routes, data, content и UX.

## Работы

1. Создай Medusa custom SEO module, не отдельный server:
   - SeoEntry;
   - SeoTemplate;
   - Redirect;
   - IndexationPolicy;
   - SeoIssue;
   - SearchSubmission/IndexNow log при необходимости.
2. SeoEntry связан через entity type/id:
   server model, component, ready configuration, category, brand, generation, solution, article, landing.
3. SeoEntry:
   locale, title, description, canonical, index/follow, OG, schema type/overrides, template, review, validation date, source/owner.
4. Templates:
   variables, preview, fallback, manual override, duplicate detection.
5. Redirect Manager:
   source, destination, status, reason, auto-created, loop/conflict validation, slug history.
6. IndexationPolicy:
   curated landing pages vs noindex faceted combinations;
   pagination, search, compare, favorites, cart, account и RFQ.
7. Не создавай автоматически тысячи thin pages.
8. Next.js:
   `generateMetadata`, canonical, robots, Open Graph, sitemap splitting, JSON-LD, consistent 404/noindex, no localhost fallback.
9. Structured data:
   Organization, WebSite, BreadcrumbList, Product/ProductGroup where valid, Article, FAQ only for qualifying content.
10. RFQ-only product не получает fake price/availability.
11. Sitemaps строятся только из published/indexable entities.
12. Подготовь documented setup:
    Google Search Console, Yandex Webmaster, Bing/IndexNow, PageSpeed, Lighthouse CI, Screaming Frog, Ahrefs Webmaster Tools or equivalent.
13. Не используй Google Indexing API для обычных product pages.
14. SEO Admin:
    readiness checklist, preview, duplicate canonical/title, missing schema, sitemap status, redirect conflict, indexation reason.
15. Добавь audit/crawl scripts:
    broken links, duplicate canonical, title/description, robots conflicts, sitemap coverage, JSON-LD, orphan pages, status codes.
16. Tests:
    metadata, canonical, redirect/loop, indexation, sitemap, JSON-LD, RFQ, unpublished entity, filtered URL.

## SEO и динамические свойства

SEO templates и structured data могут использовать только:

- approved PropertyDefinitions;
- normalized effective values;
- canonical TechnologyConcept labels;
- published/reviewed sources.

Запрещено:

- выводить unmapped compatibility property как подтверждённую поддержку;
- создавать landing page для каждого произвольного property/value автоматически;
- индексировать thin generation/property combinations;
- помещать inherited conflict или unknown value в Product structured data.

Property Registry должен предоставлять флаги:

- usable_in_seo;
- usable_in_structured_data;
- usable_in_programmatic_landing;
- requires_manual_review.

## Stage-specific Definition of Done

- SEO централизовано в отдельном domain.
- Next.js выводит корректные metadata.
- Facets не создают crawl trap.
- Structured data основаны на реальных данных.
- Search operations документированы.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- crawl matrix;
- canonical/indexation tests;
- structured-data validation;
- sitemap/robots/redirect evidence.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
