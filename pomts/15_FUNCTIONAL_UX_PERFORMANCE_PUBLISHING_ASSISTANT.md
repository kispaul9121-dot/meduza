# Этап 15. Functional UX, Performance and Publishing Assistant

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `15`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-14-report.md`
- `OUTPUT_REPORT`: `reports/stage-15-report.md`
- `NEXT_STAGE`: `16`


## Skills

- `building-with-medusa` — Publishing Assistant/workflows
- `building-admin-dashboard-customizations` — functional Admin UX
- `building-storefronts` — functional storefront fixes
- `react-best-practices` — performance and rendering
- `composition-patterns` — component consistency without redesign
- `frontend-testing-debugging` — screenshots, traces and runtime QA
- `verification-before-completion` — before/after evidence

## Ownership

Владеет подтверждёнными functional UX blockers, component consistency, performance и publication readiness.

## Out of scope

- Новая визуальная концепция, palette или typography.
- Design-system proposal — этап 18.
- SEO module — этап 16.

## Цель

Сначала доказательно проанализировать функциональный UX и скорость, затем устранить подтверждённые проблемы без изменения визуальной концепции и создать мастер публикации сервера. Полный визуальный дизайн-аудит и предложения выполняются только на ручном этапе 18.

## Фаза A. Аудит до изменений

Создай `reports/stage-13-prechange-audit.md`.

Проверь desktop/mobile:

- navigation/home;
- server catalog;
- filters;
- server page;
- configurator;
- component catalog;
- compare;
- favorites;
- cart;
- RFQ;
- Admin Server Model;
- Pack Library;
- import/review.

Используй screenshots, console, network, accessibility tree, Playwright и Chrome DevTools trace.

Зафиксируй functional usability, consistency, accessibility, mobile behavior, loading/error/empty states, interaction bugs, Core Web Vitals/lab metrics, JS bundle, API payload, images и waterfalls. Не оценивай новый визуальный стиль и не формируй редизайн.

## Фаза B. Functional component consistency без редизайна

Проведи inventory уже существующих компонентов и primitives.

Зафиксируй:

- какие Button/Input/Dialog/Table/Card/Tabs/Badge/Toast/Skeleton уже используются;
- где одинаковые действия реализованы разными компонентами;
- где состояния loading/error/empty/disabled расходятся функционально;
- где компоненты дублируют логику;
- где нужны composition/refactor для надёжности;
- где нарушено responsive или keyboard behavior.

Выбери canonical primitives только из уже установленного набора Medusa UI, Radix, Headless UI и существующих custom components. Не добавляй UI-библиотеки, новые design tokens, палитру, типографику, radii, shadows или новую визуальную систему.

## Фаза C. UX improvements

Приоритет:

- catalog;
- filters;
- server detail;
- configurator;
- compare;
- cart/RFQ.

Корзина должна стать компактным B2B summary с группами, effective specs, warnings и редактированием сборки.

Compare должен иметь differences-only, grouped specs, shareable URL и mobile layout.

## Фаза D. Performance budgets

После baseline установи budgets:

- LCP;
- INP;
- CLS;
- initial JS;
- route chunks;
- image weight;
- requests;
- API payload;
- catalog query time.

Добавь regression checks в CI, где возможно.

## Фаза E. Server Publishing Assistant

Создай Admin wizard/readiness engine:

1. basic model;
2. capability;
3. chassis;
4. storage topologies;
5. packs;
6. vendor components;
7. exceptions;
8. price/inventory;
9. media/documents;
10. content;
11. simulator;
12. storefront preview;
13. publication.

Статусы:

- complete;
- warning;
- blocking error;
- optional improvement.

Публикацию разрешает только deterministic readiness engine.

AI layer может объяснять ошибки, предлагать pack/mapping/content, но не подтверждает compatibility и не публикует сам.

## Фаза F. Проверка после изменений

Повтори screenshots, traces, Playwright и metrics. Сравни before/after.

## Проверки Publishing Assistant для прямых компонентов

Мастер публикации обязан проверять:

- direct component имеет type definition;
- compatibility attributes mapped;
- validator существует либо компонент informational;
- assignment role и visibility указаны;
- hidden technical component не потерян в snapshot/pricing;
- auto-added component имеет trigger, quantity и rollback policy;
- enablement kit действительно предоставляет заявленную capability;
- нет дублирования с assigned pack;
- component, добавляющий bays/slots, корректно связан с topology;
- direct component, используемый многими servers, помечен рекомендацией `convert to pack`.

Publishing Assistant должен давать прямую ссылку на Smart Wizard для исправления проблемы.

## Publishing readiness для корзин и option groups

Перед публикацией server model проверь:

- существует хотя бы один valid ServerStorageOption;
- sum bay groups совпадает с declared total;
- accepted form factors имеют adapter policy;
- backplane protocols и per-protocol limits заданы;
- controller/cable requirements разрешимы;
- suggested drive packs reviewed;
- нет pack, который engine считает incompatible;
- topology conflicts проверены;
- optional GPU/M.2/rails groups имеют cardinality и default state;
- `allow_none` используется как state, а не fake SKU;
- child option groups корректно открываются;
- hidden technical items входят в snapshot/pricing;
- rails/CMA не смешаны, если это разные documented options.

Assistant должен вести пользователя напрямую в Smart Storage Cage Builder или Option Group Builder для исправления.

## Publishing Assistant: свойства, связи и наследование

Перед публикацией мастер проходит:

1. Все required PropertyDefinitions имеют effective values.
2. Value types/units/enum references валидны.
3. Inherited values не имеют unresolved conflicts.
4. Compatibility properties имеют fact mapping и validator.
5. Engine-mapped relation types поддерживаются resolver.
6. Required relations имеют providers.
7. Consumed resources доступны в нужном количестве.
8. Concepts/aliases не дублируются.
9. Packs имеют понятный scope и provenance.
10. Generation assignments не используются как единственное доказательство совместимости.
11. Deprecated properties не используются без migration.
12. Изменения knowledge graph не оставили stale ready configurations.

Статусы:

- informational unused → warning;
- property unused and invisible → warning;
- compatibility property unmapped → blocker;
- relation unmapped but informational → warning;
- inherited contradiction → blocker;
- no provider for required concept → blocker;
- new validator required → blocker.

Assistant даёт прямые переходы:

- Property Mapping Wizard;
- Relationship Builder;
- Technology Concept;
- Generation Template;
- Pack Assignment;
- Impact Analysis.

## Интеграция с Genius Server Creation Wizard

Publishing Assistant и Genius Wizard используют один Readiness Service.

Для каждого finding Assistant возвращает:

- severity;
- affected entity;
- property/concept/relation;
- inherited source;
- explanation;
- exact repair action;
- deep link into Wizard step;
- whether revalidation is required.

Assistant должен уметь открыть существующую CreationWizardSession либо создать repair session, сохранив контекст server model.

После исправления:

1. выполнить incremental validation;
2. обновить finding;
3. revalidate affected ReadyConfigurations;
4. показать before/after;
5. не публиковать автоматически без явного действия пользователя.

## UX и permissions для режимов Wizard

Проверь:

- Guided Manual выбран по умолчанию;
- активный режим всегда виден;
- смена режима объясняется;
- suggestions визуально отличаются от saved records;
- Bulk Apply доступен только по permission;
- enhanced confirmation требуется для published-impact actions;
- publication остаётся отдельной кнопкой;
- пользователь видит pending decisions;
- keyboard и screen-reader labels корректны;
- destructive/mass actions имеют impact summary.

Publishing Assistant не применяет repair автоматически. Он открывает нужный шаг Wizard и ожидает подтверждения пользователя.

## Stage-specific Definition of Done

- Есть prechange audit.
- UI использует согласованные существующие primitives без смены визуальной концепции.
- Cart и compare улучшены.
- Performance имеет budgets и не регрессировала.
- Publishing Assistant блокирует incomplete/invalid server models.
- Assistant проверяет property/relation coverage и inheritance conflicts.
- Несвязанные compatibility properties не могут попасть в published configurator.
- Пользователь получает прямой путь исправления через Registry/Wizards.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- before/after runtime evidence;
- performance budgets;
- accessibility/responsive blockers;
- Publishing Assistant readiness matrix.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
