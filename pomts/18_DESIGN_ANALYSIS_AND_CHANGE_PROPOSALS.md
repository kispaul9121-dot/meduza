# Этап 18. Design Analysis and Change Proposals

## Stage metadata

- `STAGE_ID`: `18`
- `MODE`: `MANUAL_READ_ONLY_ANALYSIS`
- `INPUT_REPORTS`: `reports/stage-15-report.md`, `reports/stage-17-report.md`
- `OUTPUT_REPORT`: `reports/stage-18-design-analysis.md`
- `AUTO_RUN`: `false`

## Mandatory authorization

Запускай только по отдельной команде пользователя. `GO` этапа 17 не является разрешением на запуск или реализацию дизайна.

## Skills

- `frontend-design` — визуальное направление и отличимость без реализации.
- `web-design-guidelines` — аудит accessibility, forms, states и interaction consistency.
- `storefront-best-practices` — product/catalog/cart UX context.
- `building-storefronts` — понимание текущего storefront integration.
- `building-admin-dashboard-customizations` — понимание ограничений Medusa Admin.
- `react-best-practices` — отделение визуальной проблемы от performance/root cause.
- `composition-patterns` — component inventory и предложения архитектуры.
- `frontend-testing-debugging` — read-only runtime/screenshots при необходимости.
- `verification-before-completion` — доказательство полноты анализа.

## Hard restrictions

```text
ANALYSIS_ONLY = true
ALLOW_CODE_CHANGES = false
ALLOW_STYLE_CHANGES = false
ALLOW_COMPONENT_REPLACEMENT = false
ALLOW_DEPENDENCY_INSTALLATION = false
ALLOW_AUTOMATIC_IMPLEMENTATION = false
```

## Цель

Провести read-only визуальный и product-design анализ после завершения технического аудита. Не повторяй полный functional QA этапа 15, если его evidence актуальны.

## Evidence reuse and non-duplication

1. Сначала прочитай `reports/stage-15-report.md`, `reports/stage-17-report.md` и существующие screenshots/traces.
2. Повторно проверяй только:
   - страницы, изменённые после evidence этапа 15;
   - ключевые экраны без актуальных screenshots;
   - findings, где визуальный вывод невозможно сделать по существующим данным.
3. Не дублируй functional bug list. Ссылайся на stage-15/stage-17 finding ID.
4. Этот этап владеет визуальной иерархией, информационной плотностью, typography, color roles, page composition и направлениями будущего дизайна.
5. Этот этап не исправляет код.

## Принцип анализа

Не начинай с вопроса «как переделать дизайн».

Сначала установи:

1. задачу каждой страницы;
2. основного пользователя;
3. главное действие;
4. информацию, нужную для решения;
5. препятствия сравнению и покупке;
6. источники недоверия;
7. элементы временного прототипа;
8. сильные решения, которые нужно сохранить;
9. проблемы, требующие системного изменения;
10. проблемы, решаемые локально.

Всегда разделяй:

```text
VISUAL
UX
ACCESSIBILITY
RESPONSIVE
CONTENT
PERFORMANCE
ARCHITECTURE
DATA
FUNCTIONAL_BUG
CONSISTENCY
TRUST
```

Не называй функциональный баг плохим дизайном.

## Фаза A. Инвентаризация интерфейса

Минимально проверь storefront:

- главную;
- каталог серверов;
- страницу серверной модели;
- конфигуратор;
- каталог комплектующих;
- поиск;
- основные фильтры и «Все фильтры»;
- сравнение;
- избранное;
- корзину и configured cart line;
- checkout и RFQ;
- account;
- сохранённые конфигурации;
- 404, loading, empty и error states.

Минимально проверь Medusa Admin:

- Server Configurator overview;
- Server Models и detail;
- Components;
- Component Packs;
- Applicability;
- Rules и Rule Presets;
- Help Annotations;
- Rule Simulator;
- Source of Truth;
- Import Review;
- Server Creation Wizard;
- Publishing Assistant.

Для каждого экрана зафиксируй:

```text
route
назначение
основной пользователь
главное действие
вторичные действия
основные компоненты
состояние готовности
доступность данных
ограничения проверки
```

Создай `reports/stage-16-screen-inventory.md`.

## Фаза B. Runtime-проверка

Запусти backend, storefront и Admin по инструкциям проекта.

Зафиксируй:

- команды;
- порты;
- окружение;
- используемые данные;
- console errors;
- network errors;
- hydration errors;
- layout shifts;
- broken resources;
- неработающие действия.

Если экран не запускается, не исправляй его. Изучи код и пометь вывод `CODE_REVIEW_ONLY`.

## Фаза C. Viewport matrix и screenshots

Storefront:

```text
1440 × 1000
1280 × 800
768 × 1024
390 × 844
360 × 800
```

Medusa Admin:

```text
1440 × 1000
1280 × 800
768 × 1024
```

Для ключевых экранов собери состояния:

```text
default
loading
empty
error
opened filter
selected options
validation warning
validation error
long technical content
maximum realistic data density
```

Сохраняй материалы в:

```text
artifacts/design-audit/storefront/
artifacts/design-audit/admin/
artifacts/design-audit/responsive/
artifacts/design-audit/states/
```

## Фаза D. Информационная архитектура

Проверь:

- местоположение пользователя;
- соответствие URL содержимому;
- иерархию каталога;
- переходы между моделью, поколением, компонентом и конфигуратором;
- конкуренцию каталога, сравнения и конфигуратора;
- back/forward;
- сохранение фильтров и конфигурации;
- различие server model, chassis, product и ready configuration;
- отсутствие backend-терминологии в публичном UI.

Для проблемы указывай текущий путь, mental model, расхождение, последствие и рекомендацию.

## Фаза E. Каталог и фильтры

Проверь:

- плотность карточек;
- длину названий;
- порядок характеристик;
- цену и наличие;
- CTA, избранное и сравнение;
- число результатов;
- active filters и reset;
- mobile filters и «Все фильтры»;
- zero results;
- loading и API errors;
- keyboard;
- URL state и back/forward.

Определи оптимальный информационный минимум карточки без попытки показать все свойства.

## Фаза F. Страница сервера

Проверь первый экран, название, изображение, цену, наличие, базовую комплектацию, chassis, CTA конфигуратора, гарантию, поставку, документы, совместимые компоненты и mobile layout.

Ответь, понятно ли за пять секунд:

1. какой это сервер;
2. чем отличаются chassis;
3. можно ли его настроить;
4. что входит в базовую цену;
5. что доступно;
6. где полная спецификация.

## Фаза G. Конфигуратор

Проверь CPU, RAM, storage topology, RAID, NIC, PSU, riser, cage, backplane, Media Bay, optional groups, warnings, blockers, required/auto-added items, quantities, price, summary, save, cart и recovery.

Для каждой группы оцени:

```text
понятность названия
понятность вариантов
достаточность характеристик
перегрузка
порядок
default
empty
disabled
warning
error
selected
```

Проверь, не выглядит ли конфигуратор как длинная форма, случайный список деталей, HPE-only инструмент, игровой character builder или калькулятор без объяснения результата.

## Фаза H. Cart, RFQ и checkout

Проверь:

- группировку сборки;
- раскрытие спецификации;
- snapshot;
- цену сборки и компонентов;
- quantity/remove/save/edit;
- возврат в конфигуратор;
- RFQ;
- юридическое лицо;
- VAT;
- доставка и оплата;
- комментарий менеджеру;
- ошибки и recovery.

Определи, понимает ли пользователь, что покупает одну серверную сборку, а не случайный набор деталей.

## Фаза I. Medusa Admin

Оцени Admin как рабочий инструмент.

Проверь navigation, terminology, tables, forms, Wizard, Create-and-Return, confirmations, errors, import, simulation, source evidence, publication и необходимость ручного JSON.

Для режимов Wizard `Guided Manual`, `Assisted Draft`, `Bulk Apply` проверь назначение, manifest, dry-run, confirmations, cancel/back, recovery и отсутствие скрытых записей.

Не предлагай заменять Medusa UI без доказанной необходимости.

## Фаза J. Визуальная система

Проверь:

- contrast и state colors;
- light/dark consistency;
- type hierarchy и data typography;
- long SKU и technical names;
- vertical rhythm, grids и widths;
- cards, tables, forms, modals, drawers, tooltips, alerts, skeletons и empty states;
- единообразие названий и расположения одинаковых действий.

## Фаза K. Accessibility

Проверь вручную:

- semantic HTML и headings;
- labels и `aria-*`;
- keyboard и focus;
- modal focus trap;
- contrast;
- error association;
- touch targets;
- reduced motion;
- zoom 200%;
- horizontal scroll;
- currency/number formatting.

Минимальные сценарии: navigation, filters, product card, configurator, cart, checkout, Admin Wizard и Rule Builder.

## Фаза L. Performance UX

Не оптимизируя код, найди медленный first screen, waterfalls, layout shift, тяжёлые изображения, длинные client lists, repeated fetch/renders, блокирующие skeleton, медленные filters и тяжёлые Admin tables/modals.

Для finding укажи визуальное проявление, вероятную причину, evidence и рекомендуемую техническую проверку.

## Фаза M. B2B trust

Проверь понятность:

- состояния оборудования;
- new/refurbished;
- гарантии;
- поставщика и происхождения;
- сроков и наличия;
- НДС;
- оплаты и возврата;
- сборки, тестирования и burn-in;
- документов и серийных номеров;
- совместимости;
- консультации и коммерческого предложения.

Не выдумывай отсутствующие факты.

## Фаза N. KEEP

Создай отдельный список сильных решений:

```text
страница
компонент
почему работает
что нельзя потерять при будущем изменении
```

## Фаза O. Реестр findings

Для каждого finding используй:

```text
ID:
Название:
Область:
Страница:
Viewport:
Тип:
Серьёзность:
Доказательство:
Текущее поведение:
Ожидаемое поведение:
Влияние на пользователя:
Влияние на бизнес:
Предлагаемое изменение:
Риск изменения:
Оценка сложности:
Зависимости:
Затрагиваемые файлы:
Нужен ли макет:
Нужен ли usability test:
```

Серьёзность:

```text
P0 — блокирует покупку или работу
P1 — серьёзно мешает ключевому сценарию
P2 — заметно ухудшает использование
P3 — локальная или косметическая проблема
```

Не присваивай P0/P1 без evidence.

## Фаза P. Три направления изменений

### A. Conservative Improvement

Сохранить текущую концепцию, устранить главные UX-проблемы и унифицировать элементы с минимальным риском.

### B. Structured Evolution

Сохранить узнаваемую основу, но системно улучшить информационную архитектуру, каталог, страницу сервера, конфигуратор, cart/B2B flow и Admin patterns.

### C. Full Design Direction

Концептуально описать самостоятельный профессиональный визуальный язык B2B server store: brand character, typography, density, grid, palette, iconography, motion, cards, tables, configurator и Admin. Не реализовывать.

Для каждого направления укажи scope, преимущества, риски, сложность, зависимости и примерный объём миграции.

## Фаза Q. Design-system proposal

Только аналитически предложи роли цвета, typography, spacing, radius, shadow, borders, state colors, data typography, table density, button/form/card hierarchy, modal/drawer rules и breakpoints.

Сначала инвентаризируй существующие tokens. Не создавай значения ради заполнения отчёта.

## Фаза R. Component inventory

Для компонентов укажи:

```text
компонент
расположение
назначение
варианты
дубли
проблемы API
states
responsive
accessibility
рекомендация
```

Классификация:

```text
KEEP
FIX
MERGE
SPLIT
RENAME
DEPRECATE
CREATE
```

## Фаза S. Будущий план реализации

Не запускай реализацию. Подготовь волны:

1. Critical UX fixes.
2. Component consistency.
3. Catalog and product pages.
4. Configurator.
5. Cart, checkout and B2B.
6. Admin UX.
7. Full visual direction — только после отдельного согласования.

Для каждой волны укажи цель, scope, исключения, pages/components, dependencies, risks, tests и expected result.

## Фаза T. Итоговые приоритеты

Сформируй таблицу:

| Priority | Finding | User impact | Business impact | Effort | Risk | Recommended wave |
|---|---|---|---|---|---|---|

Выдели:

- Top 5 storefront problems;
- Top 5 configurator problems;
- Top 5 Admin problems;
- Top 5 quick wins;
- Top 5 KEEP elements.

## Фаза U. Проверка отсутствия изменений

Перед завершением выполни:

```text
git status
git diff --stat
git diff
```

Допустимы только:

```text
reports/stage-16-*.md
artifacts/design-audit/**
```

Случайные изменения исходного кода откати и зафиксируй происшествие в отчёте.

## Deliverables

Создай:

- `reports/stage-18-screen-inventory.md` — только новые/актуализированные экраны;
- `reports/stage-18-design-analysis.md`;
- `reports/stage-18-change-proposals.md`;
- `reports/stage-18-component-inventory.md`.

Допустимы screenshots в `artifacts/design-audit/**`, но не добавляй тяжёлые artifacts в Git без решения пользователя.

## Definition of Done

- Evidence этапов 15 и 17 использованы вместо слепого повторения QA.
- Проверены только необходимые актуальные screens/viewports.
- Отделены visual findings от functional bugs, data issues и performance issues.
- Сформирован раздел `KEEP`.
- Подготовлены Conservative Improvement, Structured Evolution и Full Design Direction.
- Создан будущий implementation roadmap без запуска.
- Исходный код и dependencies не изменены.
- Указано `DESIGN_IMPLEMENTATION_DECISION: AWAITING_USER_APPROVAL`.

## Gate

```text
NEXT_STAGE_GATE: GO | GO_WITH_CORRECTIONS | STOP
DESIGN_IMPLEMENTATION_DECISION: AWAITING_USER_APPROVAL
```

`GO` означает только завершённость анализа.
