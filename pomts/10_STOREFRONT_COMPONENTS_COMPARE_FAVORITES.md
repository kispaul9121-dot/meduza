# Этап 10. Storefront Catalog, Components, Compare and Favorites

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `10`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-09-report.md`
- `OUTPUT_REPORT`: `reports/stage-10-report.md`
- `NEXT_STAGE`: `11`


## Skills

- `building-storefronts` — Medusa SDK and storefront integration
- `storefront-best-practices` — catalog/product/compare/favorites commerce patterns
- `react-best-practices` — Next.js performance и data flow
- `composition-patterns` — reusable cards, filters and compare components
- `frontend-testing-debugging` — browser, responsive and state verification
- `verification-before-completion` — critical storefront flows

## Ownership

Владеет публичной реализацией catalog/product/components/compare/favorites поверх contracts этапов 02 и 09.

## Out of scope

- Cart/RFQ workflow.
- Ready-configuration persistence.
- Полный визуальный редизайн.

## Цель

Создать единые data-driven страницы для server models и components, а также рабочие compare/favorites.

## Работы

1. Server page:
   overview, configurator, ready configurations, specs, compatibility, documents, FAQ.
2. Убери DL360 hardcode из metadata, текста и UI.
3. Пользователь выбирает понятную StorageTopology; backend резолвит cage/backplane/cables/controller/conflicts.
4. Создай component catalog categories:
   CPU, memory, drives, RAID/HBA, network, GPU/accelerators, PSU, risers, boot storage, accessories.
5. Определи product identity:
   Component = technical option;
   Medusa Product/Variant = sellable item;
   не копируй один SKU по server models.
6. Specs и filters строятся по AttributeDefinition.
7. Compare:
   3–4 items, grouped normalized attributes, differences-only, shareable URL, refresh persistence, mobile layout, link to configurator.
8. Favorites:
   independent route, persistence, empty state, future account merge strategy.
9. Проведи inventory UI primitives:
   Medusa UI, Radix, Headless UI, existing custom, shadcn.
   Выбери canonical primitives; не смешивай системы бесконтрольно.
10. Добавь honest loading/error/empty states.
11. Tests:
    HPE и test Dell on same template, component categories, compare URL/differences, favorites persistence, topology selection, accessibility.

## Storefront для Storage Options и optional groups

На странице конфигуратора:

1. Сначала пользователь выбирает публичный storage option/chassis option.
2. Покажи:
   - total bays;
   - zones;
   - native form factors;
   - protocols;
   - возможность smaller form factor через adapter;
   - необходимые controller/cable kits.
3. После выбора storage option отображай только drive packs/options, разрешённые backend.
4. Не заставляй пользователя выбирать raw backplane part number, но покажи его в technical details.
5. Disabled drive option должна иметь понятную причину.

Optional sections используют единый UI:

- M.2 expansion: «Без платы» по умолчанию;
- GPU: «Без видеокарты» по умолчанию;
- rails: «Без рельсов» по умолчанию;
- другие groups согласно cardinality.

Не создавай отдельный frontend component для каждой категории, если поведение описывается `ConfiguratorOptionGroup`.

Поддержи child groups: выбор M.2 board открывает выбор M.2 drives.

## Динамическое отображение новых свойств

Storefront не должен требовать отдельный React-компонент для каждого нового свойства поколения.

Создай generic renderers по PropertyDefinition:

- scalar;
- boolean;
- enum/reference;
- quantity with unit;
- list;
- grouped object;
- relation/capability summary.

Показывай только approved/displayable properties.

Compare использует:

- comparable properties;
- normalized units;
- canonical TechnologyConcept labels;
- explicit `not supported`, `not specified`, `not applicable`;
- inherited effective values.

Unmapped property может отображаться, но не должна маркироваться как подтверждённая compatibility feature.

## Stage-specific Definition of Done

- Один шаблон работает для разных брендов.
- Compare функционален.
- Components имеют публичные страницы.
- UI строится из данных.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- route/viewport matrix;
- compare/favorites persistence;
- filter/back-forward tests;
- console/network evidence.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
