# Этап 9. Backend Catalog, Filters and Facets

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `09`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-08-report.md`
- `OUTPUT_REPORT`: `reports/stage-09-report.md`
- `NEXT_STAGE`: `10`


## Skills

- `building-with-medusa` — Store API, query и module integration
- `building-storefronts` — контракт storefront data fetching
- `react-best-practices` — request waterfalls и cache boundaries
- `supabase-postgres-best-practices` — facet queries, indexes и N+1 prevention
- `frontend-testing-debugging` — API/browser filter integration
- `verification-before-completion` — counts/facets correctness and performance

## Ownership

Владеет backend catalog query, dynamic facets, counts, pagination и filter API contracts.

## Out of scope

- Визуальный редизайн каталога.
- Compare/favorites UX.
- SEO-generated filter pages.

## Цель

Убрать client-side загрузку и фильтрацию всех server models.

## Работы

1. Создай catalog API с:
   category, q, page, limit, sort, brand, family, generation, form factor, chassis, socket, CPU generation, RAM, storage, bay ranges, price, availability, condition и dynamic typed attributes.
2. Ответ:
   items, total, pagination, facets/counts, active filters, applied sort и query metadata.
3. Удали synthetic facet values: fake stock, condition, warranty, delivery, GPU support, CPU family и другие.
4. Facets строятся только из реальных models/attributes/inventory/prices.
5. Поддержи enum, boolean, range, text и multi-select filters.
6. Definitions приходят из AttributeDefinition/category config, а не hardcoded frontend arrays.
7. Search/filter/sort/page сохраняются в URL.
8. Refresh, Back/Forward и shareable link воспроизводят выдачу.
9. Сохрани UX 10–12 основных фильтров + «Все фильтры», но counts только с backend.
10. Добавь indexes, deterministic pagination, safe limits, no N+1, query timing и cache policy.
11. Storefront:
    debounced search, request cancellation, loading/error/empty, mobile drawer, no silent empty fallback.
12. Tests:
    combined filters, ranges, facets under active filters, invalid filters, high page, empty, seeded-volume query timing.

## Интеграция с Property Registry

Filter/facet definitions должны строиться из канонического `PropertyDefinition`.

Правила:

- только `filterable=true` properties попадают в catalog filter schema;
- enum/reference values используют TechnologyConcept labels/aliases;
- units нормализуются backend;
- inherited effective values могут участвовать в фильтрах;
- provenance не обязана показываться покупателю, но доступна в debug/Admin;
- unmapped property может быть filterable и при этом не участвовать в Compatibility Engine;
- deprecated property не создаёт новый публичный filter;
- изменение property definition запускает index/backfill validation.

Добавь endpoint/schema version, чтобы storefront обнаруживал изменение динамических фильтров.

## Stage-specific Definition of Done

- Browser не получает все models.
- Facets отражают реальные данные.
- URL полностью сохраняет состояние.
- Query layer масштабируется.
- Backend errors не маскируются.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- query plans/latency;
- facet/count correctness tests;
- URL/API contract examples;
- zero-results and large-dataset evidence.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
