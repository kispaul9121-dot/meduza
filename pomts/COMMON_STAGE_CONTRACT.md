# COMMON STAGE CONTRACT — общий контракт этапов 01–17

## Назначение

Этот файл обязателен для всех технических этапов `01–16`. Каждый stage prompt содержит только собственный scope, skills, Definition of Done и дополнительные evidence. При конфликте приоритет следующий:

1. явная инструкция пользователя;
2. текущий stage prompt;
3. проектные ADR и domain contracts;
4. этот общий контракт;
5. общие рекомендации внешних skills.

Этап `18_DESIGN_ANALYSIS_AND_CHANGE_PROPOSALS.md` использует собственный read-only контракт и запускается вручную.

## Режимы выполнения

### Manual review mode

Используй, когда `MANUAL_REVIEW_MODE=true` или оркестратор не запущен.

```text
этап
→ реализация и проверка
→ stage report
→ остановка
→ пользователь/ChatGPT проверяет отчёт
→ пользователь запускает следующий этап
```

В этом режиме не запускай следующий prompt самостоятельно.

### Orchestrator mode

Используй только когда `ORCHESTRATOR_MODE=true` и работа запущена через `00_MASTER_ORCHESTRATOR.md`.

```text
этап
→ реализация
→ self-review
→ независимый read-only review
→ исправление текущего этапа
→ повторная проверка
→ GO
→ commit
→ следующий этап
```

Отдельная загрузка каждого отчёта в ChatGPT не требуется до остановки оркестратора. Все отчёты всё равно создаются и сохраняются.

## Семантика gate

### `NEXT_STAGE_GATE: GO`

Stage scope реализован и проверен. Переход разрешён.

### `NEXT_STAGE_GATE: GO_WITH_CORRECTIONS`

Переход запрещён. Исправь текущий этап, повтори проверки и независимое review. Итоговый отчёт должен быть обновлён до `GO` либо `STOP`.

### `NEXT_STAGE_GATE: STOP`

Работа остановлена из-за внешнего blocker, риска потери данных, невозможности достоверной проверки или нарушения обязательного инварианта.

`GO_WITH_CORRECTIONS` никогда не означает «перенести исправления в следующий этап».

## Передача уточнений следующему этапу

После `GO` допускается отдельное поле:

```text
NEXT_STAGE_OVERRIDES:
- конкретный новый DTO/route/name;
- учтённое архитектурное решение;
- ограничение, которое должен прочитать следующий этап.
```

Если overrides отсутствуют, укажи `NONE`.

## Git и рабочее пространство

1. Не работай напрямую в `main`.
2. Перед изменениями проверь `git status`, текущую ветку и незакоммиченные изменения.
3. Используй отдельную ветку/рабочее дерево либо одну orchestrator-ветку с атомарным commit после каждого `GO`.
4. Не смешивай изменения разных этапов в одном commit.
5. Не переписывай чужие незакоммиченные изменения.
6. Не добавляй `node_modules`, `.next`, `.medusa`, `build`, `dist`, локальные БД, дампы, логи, архивы и секреты.

## Обязательный входной контроль

Перед stage work:

1. прочитай предыдущий stage report;
2. проверь его gate;
3. прочитай `NEXT_STAGE_OVERRIDES`;
4. прочитай `STAGE_OWNERSHIP_MAP.md`;
5. проверь текущие модели, migrations, API contracts и ADR вместо предположений;
6. зафиксируй baseline-команды и известные падения.

При отсутствии предыдущего отчёта:

- в Manual mode остановись;
- в Orchestrator mode восстанови отчёт из проверяемого состояния Git и текущих evidence либо остановись, если это невозможно.

## Политика skills

1. Загружай только skills, перечисленные в текущем stage prompt.
2. Skill помогает принять решение, но не заменяет доказательство.
3. `systematic-debugging` запускай при подтверждённой ошибке, неизвестном поведении или падении проверки.
4. `verification-before-completion` обязателен перед итоговым gate.
5. При отсутствии skill не устанавливай случайный одноимённый пакет. Зафиксируй отсутствие и используй первичную документацию/существующие project contracts.
6. Generic skill не может отменить server-domain инварианты проекта.

## Общие архитектурные инварианты

1. Medusa остаётся commerce foundation; расширение выполняется через modules, services, workflows, links, API routes, subscribers и Admin extensions.
2. Storefront не обращается напрямую к базе данных.
3. Все schema changes выполняются через migration; существующие данные сохраняются через backfill/adapter.
4. Generic core не содержит цепочек vendor-specific `if/else`.
5. Candidate pack определяет доступный пул, но не доказывает совместимость.
6. Compatibility Engine является единственным владельцем runtime-решения о совместимости.
7. Import работает через staging, validation, preview/dry-run и idempotent apply.
8. Raw source data хранится отдельно от normalized data.
9. Cart/RFQ/Order не доверяют цене и compatibility, присланным клиентом; сервер выполняет повторную проверку.
10. Published data имеет provenance/source evidence и контролируемое состояние публикации.
11. Не создавай фиктивные цены, остатки, документы, SEO-тексты и технические характеристики.
12. Не выполняй произвольный код из Admin/imported data.

## Design Freeze для этапов 01–17

Не выполняй самостоятельный редизайн. Сохраняй существующую визуальную концепцию, цвета, типографику и основные patterns. Разрешены:

- функционально необходимые UI changes;
- исправление blockers;
- loading/error/empty states;
- responsive fixes;
- accessibility fixes;
- компонентный рефакторинг без смены визуального направления.

Полный дизайн-анализ и предложения вынесены в ручной этап 18.

## Проверки

Выбирай проверки по затронутому scope, но перед `GO` обязательно выполни применимые:

- formatting/lint;
- TypeScript typecheck;
- backend unit tests;
- backend module/integration tests;
- storefront tests;
- migration generate/run/rollback or safe validation;
- production build;
- runtime smoke;
- API contract checks;
- critical manual scenarios;
- browser console/network checks для UI;
- security checks для trust boundaries.

Не объявляй stage завершённым по одному успешному build.

## Evidence

Отчёт должен содержать проверяемые evidence:

- точные команды;
- exit status;
- test names/counts;
- request/response examples;
- migration names;
- sample normalized records;
- screenshots/traces при UI scope;
- before/after metrics при performance scope;
- список непроверенного.

## Общий формат отчёта

Используй `STAGE_REPORT_TEMPLATE.md`. Каждый stage prompt добавляет собственные обязательные разделы.

## Финальные технические этапы

- Этап 17 — независимый read-only audit. Он не исправляет крупные findings и всегда останавливает автоматическую цепочку после создания отчёта.
- Готовность проекта отражается отдельным полем `PROJECT_READINESS`, а не gate.
- Этап 18 — ручной read-only дизайн-анализ. `GO` в этапе 17 не запускает его автоматически.
