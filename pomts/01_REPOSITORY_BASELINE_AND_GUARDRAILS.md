# Этап 1. Repository Baseline and Guardrails

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `01`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `NONE`
- `OUTPUT_REPORT`: `reports/stage-01-report.md`
- `NEXT_STAGE`: `02`


## Skills

- `building-with-medusa` — проверка структуры Medusa, modules, workflows и project setup
- `supabase-postgres-best-practices` — проверка PostgreSQL schema, indexes, constraints и migration discipline
- `systematic-debugging` — только для подтверждённых baseline failures
- `verification-before-completion` — доказательство стабильного baseline

## Ownership

Владеет воспроизводимым baseline, командами проверки, конфигурацией монорепозитория, политикой migrations и guardrails.

## Out of scope

- Изменение server-domain модели.
- Редизайн storefront/Admin.
- Массовое исправление legacy-функций, не мешающих baseline.

## Цель

Создать безопасную основу для всех следующих изменений.

## Работы

1. Зафиксируй текущий commit, версии Node/npm/Medusa/Next.js, scripts, migrations, routes, Admin pages и runtime dependencies.
2. Проверь реальные backend/storefront build, typecheck, lint и tests. Не считай наличие test scripts доказательством покрытия.
3. Очисти Git tracking от `*.log`, `*.tsbuildinfo`, `.codex/`, локальных архивов и временных audit/build artifacts. Обнови `.gitignore`.
4. Сделай root package `private: true`.
5. Проверь публичную историю на secrets и hardcoded local paths. Секреты не цитируй; укажи необходимость rotation.
6. Верни обязательные проверки: убери `typescript.ignoreBuildErrors` и `eslint.ignoreDuringBuilds` после исправления ошибок.
7. Нормализуй scripts: typecheck, lint, unit, integration, build, smoke.
8. Создай минимальные реальные tests: backend unit, backend API/integration, storefront unit/component, Playwright smoke.
9. Добавь GitHub Actions: install from lockfile, typecheck, lint, tests, backend build, storefront build и smoke where feasible.
10. Создай:
    - `docs/architecture/current-state.md`;
    - `docs/architecture/stage-sequence.md`;
    - `docs/architecture/decision-log.md`.
11. Зафиксируй guardrails:
    - generic core vs vendor adapters;
    - packs do not equal compatibility;
    - raw vs normalized;
    - migrations only;
    - single product identity;
    - report gate between stages.

## Дополнительные архитектурные guardrails для будущих поколений

Зафиксируй в ADR:

1. В проекте существует один канонический реестр свойств. Нельзя параллельно создавать несвязанные `AttributeDefinition`, `PropertyDefinition` и произвольные JSON-схемы с одинаковым смыслом.
2. Новые названия, поколения, частоты, сокеты, форм-факторы и протоколы должны добавляться как данные.
3. Код и новый validator нужны только при появлении нового поведения, которое существующий engine не умеет рассчитывать.
4. Назначение pack поколению создаёт область кандидатов, но не доказывает совместимость.
5. Каждое property/relation, влияющее на совместимость, обязано иметь mapping и validator.
6. Несвязанные и unmapped свойства разрешены в draft, но не должны молча влиять на storefront или публикацию.
7. Все inherited values обязаны хранить provenance: откуда значение пришло и где было переопределено.

## Stage-specific Definition of Done

- Репозиторий очищен.
- Проверки не скрыты.
- CI и test harness реально работают.
- Исходное состояние задокументировано.
- Следующие этапы имеют стабильные команды контроля.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- baseline command matrix с exit status;
- список известных pre-existing failures;
- branch/CI/test policy;
- подтверждение отсутствия secrets/build artifacts в Git.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
