# MASTER ORCHESTRATOR — этапы 01–17

## Назначение

Автоматически выполнить техническую цепочку проекта `kispaul9121-dot/meduza`. Этап 18 не входит в автоматический запуск.

## Обязательные документы

Прочитай `README_EXECUTION_ORDER.md`, `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md`, `STAGE_REPORT_TEMPLATE.md`, `SKILLS_MATRIX.md` и текущий prompt.

## Режим

```text
ORCHESTRATOR_MODE=true
MANUAL_REVIEW_MODE=false
```

## Последовательность

```text
01 Baseline
02 Canonical Routes and Contracts
03 Domain Model
04 Compatibility Engine
05 Admin Knowledge Base and Builders
06 Core Server Creation Wizard
07 Genius Bootstrap Wizard and Modes
08 Import Pipeline
09 Backend Catalog
10 Storefront / Compare / Favorites
11 Ready Configurations
12 Cart / Pricing / RFQ / B2B
13 Content / Knowledge / Documents
14 Multibrand Proof
15 Functional UX / Performance / Publishing
16 SEO Module
17 Final Independent Read-Only Audit
STOP
```

`18_DESIGN_ANALYSIS_AND_CHANGE_PROPOSALS.md` запускается только вручную.

## State

Веди `reports/orchestrator-state.json` с `current_stage`, `last_completed_stage`, `status`, `stage_reports`, `commits`, `next_stage_overrides`, `project_readiness` и `external_blockers`.

## Stage cycle 01–16

1. Прочитай previous report и overrides.
2. Проверь Git baseline.
3. Загрузить только stage skills.
4. Реализуй только stage ownership.
5. Выполни self-review, tests и runtime checks.
6. Запусти независимое read-only review.
7. `GO_WITH_CORRECTIONS` исправляй в текущем этапе.
8. После `GO` создай report, атомарный commit и перейди дальше.
9. При настоящем внешнем `STOP` остановись.

## Stage 17 special handling

Этап 17 — read-only audit:

- не исправлять findings;
- не создавать remediation commits;
- создать `PROJECT_READINESS`;
- `GO` означает только завершение аудита;
- после отчёта остановить оркестратор независимо от readiness;
- не запускать этап 18.

## Completion

Автоматическая цель завершена, когда этапы 01–16 получили `GO`, этап 17 создал независимый audit/readiness report, а оркестратор остановился.
