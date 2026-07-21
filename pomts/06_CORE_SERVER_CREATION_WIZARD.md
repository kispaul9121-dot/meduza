# Этап 6. Core Server Creation Wizard and Coverage Analysis

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `06`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-05-report.md`
- `OUTPUT_REPORT`: `reports/stage-06-report.md`
- `NEXT_STAGE`: `07`


## Skills

- `building-with-medusa` — Wizard workflows, services and validation integration
- `building-admin-dashboard-customizations` — многошаговый Medusa Admin Wizard
- `react-best-practices` — state boundaries, async steps and rendering
- `composition-patterns` — Wizard shell, steps and reusable panels
- `frontend-testing-debugging` — runtime steps, draft and validation tests
- `verification-before-completion` — полный core-Wizard scenario

## Ownership

Владеет основным пошаговым Server Creation Wizard, coverage/unmapped dashboard, impact analysis и подключением engine validation.

## Out of scope

- Genius Bootstrap dependency planner и автоматическая классификация — этап 07.
- Три переключаемых режима и Bulk Apply — этап 07.
- Vendor import pipeline — этап 08.
- Визуальный редизайн Admin.

## Цель

Создать устойчивый основной Server Creation Wizard поверх domain contracts этапа 03, Compatibility Engine этапа 04 и builders этапа 05. Сначала реализуй понятный контролируемый путь создания сервера; Genius automation добавляется только после доказательства core flow.

## Полный Server Creation Wizard

Это основной ежедневный инструмент создания сервера в Medusa Admin. Codex не должен быть обязателен.

### Шаг 1. Способ создания

- с нуля;
- из VendorGenerationTemplate;
- клонировать похожую модель;
- импортировать из документации;
- продолжить draft.

### Шаг 2. Идентификация

- vendor;
- family;
- model;
- public name;
- form factor;
- source document.

### Шаг 3. Platform and generation

- выбрать TechnologyPlatform;
- выбрать VendorGenerationTemplate;
- показать inherited properties/packs;
- разрешить explicit override/exclusion.

### Шаг 4. CPU capability

- socket concept;
- socket quantity;
- CPU ownership;
- TDP/cooling limits;
- qualification policy;
- suggested CPU packs.

Не вводить socket свободной строкой.

### Шаг 5. Memory capability

- memory technology;
- module types;
- slots/channels per CPU;
- capacity;
- population profiles;
- server speed limits;
- inherited/suggested memory packs.

### Шаг 6. Chassis and Storage

Запустить Smart Storage Cage Builder:

- chassis variants;
- cages/zones;
- backplane variants;
- adapters;
- protocols;
- controllers;
- suggested drive packs.

### Шаг 7. Expansion topology

Создать:

- riser profiles;
- physical slots;
- PCIe generation/lanes;
- height/length/width;
- CPU ownership;
- OCP/mezzanine slots;
- conflicts/resources.

### Шаг 8. Power and Cooling

- PSU options;
- power budget;
- fan/heatsink kits;
- air/performance/liquid cooling;
- thermal zones;
- GPU/CPU conditions.

### Шаг 9. Network, management and boot

- embedded network;
- OCP/mezzanine/PCIe NIC;
- management generation;
- boot storage groups;
- direct components and bundles.

### Шаг 10. Optional Configurator Groups

Создать/подключить:

- GPU;
- M.2 board;
- rails;
- licenses;
- services;
- other direct/pack groups.

### Шаг 11. Product strategy

Спросить:

- одна карточка с chassis options;
- отдельные catalog cards;
- отдельные Medusa products;
- shared technical ServerPlatform.

Wizard сам создаёт/связывает Medusa Product/Variant. Не требуй ручного копирования `prod_...` и `variant_...` как основной workflow.

### Шаг 12. Properties and coverage

Показать:

- inherited;
- direct;
- overridden;
- unmapped;
- missing required;
- unused;
- contradictory.

Новая property может быть создана inline через Property Wizard.

### Шаг 13. Simulation

Проверить:

- representative CPU/RAM;
- each storage option;
- controller;
- NIC;
- GPU;
- boot;
- rails;
- power/cooling;
- option groups;
- cart snapshot.

### Шаг 14. Draft, review and publish

- autosave;
- reviewer;
- readiness blockers;
- storefront preview;
- transactional product creation;
- publish only after deterministic validation.

## Coverage & Unmapped Dashboard

Покажи таблицы и counts:

- total properties;
- engine mapped;
- informational;
- unused;
- unmapped;
- blocking;
- missing validator;
- concepts without relations;
- relations without inverse/provider/consumer;
- inherited conflicts;
- packs with no effective compatible entities.

Действия:

- open mapping;
- create relation;
- assign validator;
- mark informational;
- deprecate;
- show impact;
- bulk review.

## Impact Analysis

Перед изменением concept/property/relation/pack assignment покажи:

- affected server models;
- affected components;
- affected ready configurations;
- potentially invalid carts/configurations;
- whether revalidation is required.

## Stage-specific Definition of Done

- Core Wizard проходит путь от способа создания до publication review.
- Platform/generation inheritance показывается до overrides.
- CPU, memory, storage, expansion, power/cooling, network и product strategy используют канонические entities.
- Storage step вызывает специализированные builders этапа 05.
- Simulation использует только engine этапа 04.
- Coverage Dashboard показывает unmapped properties/relations/validators.
- Impact Analysis показывает последствия изменения shared entities.
- Draft можно сохранить и продолжить без потери уже подтверждённых данных.
- Core Wizard не создаёт скрытые зависимости и не содержит Bulk Apply.
- Core flow подтверждён E2E до добавления Genius automation.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- E2E core Wizard scenario;
- step/state matrix;
- coverage and impact screenshots;
- draft save/continue evidence;
- proof that no Genius/Bulk behavior was implemented prematurely.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
