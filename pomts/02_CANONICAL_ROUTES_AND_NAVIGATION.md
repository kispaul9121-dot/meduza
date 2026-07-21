# Этап 2. Canonical Routes and Navigation

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `02`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-01-report.md`
- `OUTPUT_REPORT`: `reports/stage-02-report.md`
- `NEXT_STAGE`: `03`


## Skills

- `building-storefronts` — Next.js/Medusa route and Store API integration
- `storefront-best-practices` — navigation, URL state и commerce flow continuity
- `react-best-practices` — server/client boundary и navigation performance
- `site-architecture` — page hierarchy, canonical URL и internal navigation contracts
- `frontend-testing-debugging` — runtime route, redirect и browser-history проверки
- `verification-before-completion` — подтверждение отсутствия redirect loops и broken flows

## Ownership

Владеет URL strategy, redirects, middleware foundations, canonical product identity и route contracts.

## Out of scope

- Полная реализация compare, favorites, RFQ, components или knowledge pages.
- SEO module и programmatic page generation.
- Визуальный редизайн навигации.

## Цель

Зафиксировать одну canonical URL-архитектуру и route contracts до реализации новых каталогов и SEO, не создавая временные версии будущих функций.

## Работы

1. Создай полный route inventory: `/{countryCode}` routes, `/servers`, product handles, cart/account/checkout, query views, redirects и middleware exclusions.
2. Выбери одну canonical strategy:
   - B2B routes без country prefix;
   - либо внутри `/{countryCode}`.
3. Учти region/currency, cart cookies, checkout, localization, sitemap и будущие components/content.
4. Зафиксируй ADR `docs/architecture/route-strategy.md`.
5. Определи **route contracts**, но не реализуй будущие feature pages:
   - servers;
   - components/categories/details;
   - solutions;
   - knowledge;
   - compare;
   - favorites;
   - RFQ.
6. Для ещё не реализованных features определи owner stage, URL shape, params, canonical behavior и допустимое временное поведение. Не создавай фиктивные полноценные страницы.
7. Query `view` не должен заменять отдельную страницу.
8. Определи одну product identity и canonical URL для ServerModel/Medusa Product; исключи двойную индексируемую карточку.
9. Исправь только существующие header, breadcrumbs, search и configurator entry, если они нарушают выбранную стратегию.
10. Добавь redirects для реально существующих старых `?view=...`, `?component=...`, `?interface=...`, `?q=...`.
11. Проверь direct URL, refresh, Back/Forward, cart/region continuity, mobile menu, keyboard, 404 и redirect loops.
12. Создай route ownership table, чтобы этапы 08–12 реализовали функции без изменения canonical strategy.

## Stage-specific Definition of Done

- Одна URL-архитектура и ADR.
- Один canonical product URL.
- Существующие навигационные элементы функциональны.
- Старые ссылки сохраняют смысл через redirects.
- Cart и checkout не сломаны.
- Будущие routes описаны контрактами, но их функции не реализованы преждевременно.
- Для каждого будущего route указан owner stage.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- route inventory и ownership table;
- ADR;
- redirect matrix;
- результаты direct/refresh/back-forward/cart-continuity tests.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
