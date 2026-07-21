# Этап 11. Ready Configurations and Canonical Technical Snapshots

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `11`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-10-report.md`
- `OUTPUT_REPORT`: `reports/stage-11-report.md`
- `NEXT_STAGE`: `12`


## Skills

- `building-with-medusa` — configuration module/workflows
- `building-storefronts` — save/open/clone storefront flow
- `storefront-best-practices` — configuration UX
- `domain-modeling` — immutable version/snapshot semantics
- `react-best-practices` — state and data-fetching boundaries
- `verification-before-completion` — versioning/staleness/compatibility evidence

## Ownership

Владеет ReadyConfiguration, versions и каноническим immutable technical snapshot.

## Out of scope

- Cart/Order-specific alternative technical schema.
- RFQ processing.
- Visual redesign.

## Цель

Отделить пользовательский configuration snapshot от публикуемой ReadyConfiguration.

## Работы

1. Создай ReadyConfiguration:
   server model, topology, name/slug/description/use case, selected component snapshot, pack/version references, effective specs, engine version, price mode/currency/base/components, featured/published/order, media, SEO hooks, source/review.
2. Перед publish:
   run engine, check price/availability completeness, save trace, block invalid.
3. При изменении pack/component выставляй stale state и предлагай revalidate.
4. Admin:
   create from simulator/user configuration, duplicate, compare, validate, publish/unpublish, reorder, preview.
5. Storefront:
   cards, use cases, composition, effective specs, price/RFQ, add to cart, edit in configurator.
6. Определи snapshot policy:
   links vs frozen values, removed component, price changes, versions, archive.
7. Tests:
   valid/invalid publish, stale, revalidate, copy to configurator, cart, removed component, price update.

## Версии knowledge graph

ReadyConfiguration snapshot сохраняет:

- PropertyDefinition schema versions;
- effective inherited property values;
- TechnologyConcept IDs;
- relation graph version/hash;
- pack assignment provenance;
- validator/engine version.

При изменении property mapping, relation или generation inheritance связанная ReadyConfiguration получает `stale` и требует revalidation.

## Stage-specific Definition of Done

- ReadyConfiguration отдельна от user Configuration.
- Invalid нельзя публиковать.
- Version/stale status понятны.
- Storefront flow работает.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- snapshot schema/version examples;
- clone/update/stale configuration tests;
- compatibility revalidation;
- ownership contract для этапа 13.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
