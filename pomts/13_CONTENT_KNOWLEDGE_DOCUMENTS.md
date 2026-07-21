# Этап 13. Content, Knowledge and Documents

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `13`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-12-report.md`
- `OUTPUT_REPORT`: `reports/stage-13-report.md`
- `NEXT_STAGE`: `14`


## Skills

- `building-with-medusa` — content module/Admin/API
- `building-admin-dashboard-customizations` — content/document management UI
- `building-storefronts` — public knowledge/document pages
- `react-best-practices` — content rendering and fetching
- `site-architecture` — content hierarchy/internal linking
- `verification-before-completion` — publication and permissions evidence

## Ownership

Владеет content entities, documents, source evidence, knowledge pages и publication state.

## Out of scope

- SEO metadata/schema/indexation implementation — этап 16.
- Programmatic SEO generation.
- Visual redesign.

## Цель

Создать content domain, связанный с товарами и моделями. Полный SEO module не реализовывать до этапа 16.

## Работы

1. Content types:
   solution, industry, use case, article, buying guide, compatibility guide, FAQ, brand/generation landing, glossary, document/download.
2. Relations:
   ServerModel, Component, ComponentPack, ReadyConfiguration, category, brand, generation, StorageTopology.
3. Workflow:
   draft, review, published, author/reviewer, source/reference, revision/date.
4. Unreviewed extracted technical content не публикуется.
5. Storefront:
   solutions listing/detail, knowledge listing/detail, related products, breadcrumbs, documents, empty/404.
6. Подготовь clean SEO hooks:
   slug, canonical ownership, title/description override, index flag, modified date, related entity.
7. Не создавай здесь Redirect Manager, IndexationPolicy, Sitemap Manager или полный SeoEntry — это этап 16.
8. Tests:
   draft visibility, publish, relations, documents, source preservation, 404.

## Stage-specific Definition of Done

- Контент создаётся без изменения кода.
- Есть review workflow.
- Technical claims имеют source.
- SEO hooks готовы без дублирования будущего module.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- content→product/server relations;
- publication/permission tests;
- document/source evidence scenarios;
- internal-link ownership.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
