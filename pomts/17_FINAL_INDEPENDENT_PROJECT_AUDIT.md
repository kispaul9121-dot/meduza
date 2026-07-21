# Этап 17. Final Independent Project Audit

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `17`
- `MODE`: `READ_ONLY_AUDIT`
- `INPUT_REPORTS`: `reports/stage-16-report.md`
- `OUTPUT_REPORT`: `reports/stage-17-report.md`
- `NEXT_STAGE`: STOP_AFTER_REPORT

## Mandatory stop

После создания отчёта остановись. Даже `NEXT_STAGE_GATE: GO` означает только «аудит завершён».

## Skills

- `building-with-medusa` — audit Medusa architecture and extensions
- `building-admin-dashboard-customizations` — audit Admin implementation
- `building-storefronts` — audit Store API/storefront integration
- `storefront-best-practices` — audit critical commerce flows
- `react-best-practices` — audit performance and rendering
- `supabase-postgres-best-practices` — audit schema/query/data safety
- `domain-modeling` — audit invariants and ownership
- `site-architecture` — audit routes/content/SEO ownership
- `frontend-testing-debugging` — runtime read-only verification
- `verification-before-completion` — audit completeness

## Ownership

Владеет только независимой оценкой, findings, readiness classification и remediation roadmap.

## Out of scope

- Автоматическое исправление findings.
- Новые migrations/features.
- Редизайн.
- Запуск этапа 18.

## Роль

Выступи независимым аудитором. Не продолжай разработку и не доверяй предыдущим заявлениям без evidence.

## Работы

1. Прочитай все `reports/stage-01-report.md` … `reports/stage-16-report.md`, ADR, migrations, CI, schemas, validators, adapters, Admin и storefront.
2. Повтори с нуля:
   install, typecheck, lint, unit, integration, backend build, storefront build, Playwright critical flows, migration on clean DB, seed/runtime, crawl и performance.
3. Проверь user journeys:
   - создать server model;
   - создать CPU pack;
   - создать CPU внутри pack;
   - назначить pack;
   - создать topology;
   - настроить CPU/RAM/storage/NIC/GPU/M.2;
   - получить explainable validation;
   - создать ReadyConfiguration;
   - добавить в cart;
   - отправить RFQ;
   - Dell import dry-run/review/apply;
   - пройти Publishing Assistant;
   - опубликовать;
   - найти в catalog/search;
   - compare;
   - metadata/sitemap/redirect.
4. Architecture audit:
   vendor hardcode, duplicate SKU/product identity, assignments, raw/normalized, unknown attributes, rules layer, multiple storage zones, GPU, boot storage, money/currency, ownership/security, transaction/rollback, N+1/performance.
5. Для каждого этапа составь:
   заявлено, подтверждено, не подтверждено, регрессировало, осталось.
6. Оцени отдельно:
   backend, Admin, compatibility mechanism, data/rule coverage, import, catalog, storefront UX, cart/RFQ, content, multi-brand, SEO, tests/CI, security, launch readiness, scale readiness.
7. Составь P0/P1/P2/P3 roadmap с evidence, impact, dependency и acceptance criteria.
8. Создай:
   - `reports/FINAL_PROJECT_AUDIT.md`;
   - `reports/FINAL_PROJECT_AUDIT.json`;
   - `reports/FINAL_REMEDIATION_ROADMAP.md`.
9. JSON должен содержать severity, evidence paths, affected stages и status.
10. Финальное решение:
    - `READY_FOR_CONTROLLED_BETA`;
    - `READY_FOR_INTERNAL_USE_ONLY`;
    - `NOT_READY_BLOCKERS_REMAIN`.
11. Не исправляй крупные проблемы без отдельного согласования.

## Аудит Property/Technology Knowledge Base

Обязательно проверь:

- существует один канонический Property Registry;
- нет параллельных дублирующих attribute/property schemas;
- можно создать новое property без code change;
- можно создать новый socket/form factor/protocol concept;
- aliases разрешаются в canonical concept;
- Relationship Builder ограничивает недопустимые source/target;
- engine игнорирует unmapped relation как compatibility evidence;
- compatibility property без validator блокирует publish;
- inheritance работает platform → generation → model → chassis;
- provenance отображается;
- generation pack assignment не обходит engine;
- Coverage Dashboard находит unused/unmapped/conflicting records;
- Impact Analysis показывает affected configurations;
- изменение relation помечает ReadyConfiguration stale.

## Аудит Server Creation Wizard

С нуля без Codex создай test draft:

1. TechnologyPlatform.
2. VendorGenerationTemplate.
3. New ServerModel.
4. Socket/property relations.
5. CPU/RAM pack inheritance.
6. Storage option.
7. Direct optional component.
8. Configurator option group.
9. Medusa Product link.
10. Simulation.
11. Publication readiness.

Зафиксируй, какие действия всё ещё требуют ручного JSON, SQL или изменения кода. Они являются findings.

## Независимый аудит Genius Wizard

Проверь сценарии:

### A. Полностью пустая платформа

- отсутствуют platform/generation/socket/property/pack;
- Wizard строит dependency graph;
- создаёт nested entities;
- возвращается в исходный шаг;
- не теряет draft.

### B. Новое свойство

- создать informational property;
- назначить model;
- отобразить без validator;
- создать compatibility property;
- оставить unmapped;
- убедиться в publication blocker;
- добавить relation/mapping/validator;
- получить READY.

### C. Прерывание

- закрыть Wizard в середине;
- resume;
- cancel;
- проверить orphan cleanup;
- проверить audit trail.

### D. Дубликаты

- ввести alias существующего socket;
- Wizard предлагает canonical concept;
- duplicate не создаётся.

### E. Наследование

- property на platform;
- override на model;
- disable on chassis;
- provenance и conflict detection.

### F. No-code boundary

Зафиксируй каждый шаг, где потребовались:

- SQL;
- raw JSON;
- direct DB edit;
- code change;
- Codex.

Любой такой шаг для обычного добавления существующего принципа является finding.

## Аудит контроля пользователя

Докажи:

1. Guided Manual ничего не создаёт без отдельного подтверждения.
2. Assisted Draft не смешивает suggestion и saved data.
3. Bulk dry-run не имеет side effects.
4. Bulk Apply применяет только approved manifest items.
5. Переключение режима не применяет предложения.
6. Публикация всегда требует отдельного подтверждения.
7. Compatibility mapping не создаётся AI автоматически.
8. Изменение published relation требует enhanced confirmation.
9. Audit log показывает пользователя, режим и каждое подтверждённое действие.
10. Пользователь может остановиться и сохранить draft на любом шаге.

## Read-only policy

1. Не исправляй P0/P1 автоматически.
2. Не создавай remediation commits.
3. При обнаружении проблемы дай reproduction, severity, affected scope и recommended remediation stage.
4. Технический `NEXT_STAGE_GATE` показывает только завершённость аудита.
5. Готовность проекта укажи отдельно:

```text
PROJECT_READINESS: READY_FOR_CONTROLLED_BETA
```

или:

```text
PROJECT_READINESS: READY_FOR_INTERNAL_USE_ONLY
```

или:

```text
PROJECT_READINESS: NOT_READY_BLOCKERS_REMAIN
```

После отчёта автоматический оркестратор обязан остановиться при любом `PROJECT_READINESS`.

## Stage-specific Definition of Done

- Аудит выполнен независимым read-only проходом.
- Проверены architecture, data safety, compatibility, import, Admin, storefront, cart/RFQ, content и SEO.
- Повторены ключевые proof-сценарии этапа 14 как независимая проверка.
- Все findings имеют severity, reproduction и evidence.
- Исходный код не изменён.
- Создан remediation roadmap без реализации.
- Указан `PROJECT_READINESS`.
- Автоматическая цепочка завершена и не запускает этап 18.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- independent reproduction matrix;
- severity P0–P3;
- changed-files proof (`git diff` должен показывать только reports/test artifacts);
- `PROJECT_READINESS`;
- remediation roadmap grouped by owner stage.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
