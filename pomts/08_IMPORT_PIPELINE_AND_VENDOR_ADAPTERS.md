# Этап 8. Import Pipeline and Vendor Adapters

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `08`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-07-report.md`
- `OUTPUT_REPORT`: `reports/stage-08-report.md`
- `NEXT_STAGE`: `09`


## Skills

- `building-with-medusa` — staging/apply workflows и Admin/API integration
- `domain-modeling` — normalization к каноническим entities
- `supabase-postgres-best-practices` — batch tables, constraints, indexes и transactions
- `systematic-debugging` — import mismatch/root-cause analysis
- `verification-before-completion` — idempotency, rollback и duplicate proof

## Ownership

Владеет vendor adapters, raw/staging/normalized layers, ImportBatch, review и transactional apply.

## Out of scope

- Runtime compatibility policy.
- Параллельный Wizard bulk engine.
- Автоматическая публикация непроверенных данных.

## Цель

Создать умный reviewable import pipeline для server models, components, packs, assignments, capability profiles и topologies.

## Работы

1. Добавь `ImportBatch`:
   source/adapter, file/hash, dry-run, status, counts, warnings/errors, reviewer, applied time, rollback reference, schema versions.
2. Реализуй pipeline:
   `Extract → raw preservation → normalize → schema validate → attribute mapping → deduplicate → preview → human review → transactional apply → post-validation`.
3. Создай общий vendor adapter interface.
4. Mappings:
   - HPE: FlexibleLOM, Smart Array, Media Bay, iLO;
   - Dell: NDC, PERC, BOSS, iDRAC, risers/topologies;
   - Supermicro: AOC, BPN, expander, IPMI.
5. Adapter переводит терминологию в общую модель, но не содержит отдельный compatibility engine.
6. Используй штатный Medusa product/variant import только для коммерческих данных: SKU, price, inventory, category, images. Технические данные проходят custom pipeline.
7. Unknown attribute:
   сохранить raw, предложить mapping, создать AttributeDefinition, выбрать informational/filterable/engine-mapped, блокировать critical unmapped при публикации.
8. Pack logic:
   reuse existing, suggest new, CPU packs by CPU generation, add components, assign after review, preserve item overrides.
9. Cage/backplane/cable layouts импортируй как StorageTopology/AssemblyBundle.
10. Обеспечь idempotency:
    stable keys, create/update/unchanged, no duplicate SKU, commercial field protection, archive removed, transaction, rollback, diff preview.
11. Удали arbitrary code execution для untrusted imports; legacy local importer изолируй как trusted-only.
12. Post-import:
    schema validation, pack validation, assignment validation, compatibility sample matrix, unmapped report, publication blockers.
13. Tests:
    repeated import, changed/removed item, unknown field, new pack, topology, vendor mapping, failed transaction.

## Классификация импортируемого объекта

Перед созданием pack pipeline должен классифицировать найденную опцию:

- reusable alternative list → ComponentPack;
- model-specific single part → ServerModelComponentAssignment;
- required multi-part kit → AssemblyBundle;
- bays/slots/storage layout → StorageTopology;
- unknown physical class → draft ComponentTypeDefinition.

AI/heuristic classification создаёт только предложение. Review экран показывает evidence и позволяет изменить тип до apply.

Импорт не должен автоматически создавать одноэлементный pack для каждой proprietary платы.

При повторном обнаружении одного direct component у нескольких server models pipeline должен предложить:

- сохранить direct assignments;
- либо мигрировать их в общий pack без дублирования Component.

## Импорт корзин и backplane variants

Vendor adapter должен уметь извлекать draft structures:

- physical cage/bay groups;
- location;
- native/accepted form factors;
- adapters;
- backplane variants;
- protocol distribution;
- direct attach/expander;
- controllers/cables;
- optional internal/rear cage;
- conflicts.

Не объединяй варианты только потому, что у них одинаковое количество bays.

Пример: две опции `16 LFF` с разным backplane или controller path должны оставаться отдельными `ServerStorageOption`.

После нормализации pipeline запускает drive-pack suggestion и показывает reviewer:

- какие packs предлагаются;
- почему;
- какие adapters нужны;
- какие поля не подтверждены источником.

Импорт optional GPU/M.2/rails должен предлагать `ConfiguratorOptionGroup`, а не создавать frontend hardcode.

## Импорт Property/Technology Knowledge Base

Pipeline должен уметь создать draft:

- PropertyDefinition;
- PropertyValue;
- TechnologyConceptType;
- TechnologyConcept;
- ConceptAlias;
- TechnologyRelation;
- TechnologyPlatform;
- VendorGenerationTemplate;
- scoped pack assignment.

Порядок:

1. Сопоставить aliases с canonical concepts.
2. Найти existing property by stable key/semantics.
3. Не создавать дубль только из-за другого vendor wording.
4. Новое property сохранить как draft.
5. Определить предполагаемый usage status.
6. Если compatibility-related — предложить fact mapping/validator.
7. Создать relation suggestions с evidence.
8. Предложить platform/generation inheritance.
9. Показать impact/diff.
10. Применить только после human review.

## Generation-level import

При импорте документации поколения pipeline может предложить:

- TechnologyPlatform;
- VendorGenerationTemplate;
- shared CPU/RAM/NIC packs;
- vendor RAID/rails/management packs;
- default properties;
- default option-group templates.

Но нельзя автоматически распространять непроверенный pack на все модели поколения.

## Unknown future technologies

Если встречено новое значение существующего понятия:

- новый socket;
- новая memory speed;
- новый form factor;
- новый protocol label;

создай/предложи data record без изменения кода.

Если встречено новое поведение:

- новая модель распределения ресурсов;
- новый вид memory expansion;
- неизвестный conversion mechanism;

создай `validator_missing` finding и не публикуй техническую совместимость до реализации validator.

## Codex boundary

Codex/AI используется для:

- extraction;
- alias suggestions;
- draft mappings;
- relation suggestions;
- review summaries.

Обычное добавление и исправление должно выполняться через Admin Registry/Wizards без обязательного Codex.

## Bootstrap Import Plan для Wizard

При запуске импорта из Server Creation Wizard pipeline возвращает не только записи, а `BootstrapProposal`:

- existing entities to reuse;
- new concepts;
- aliases;
- new properties;
- property assignments;
- relations;
- platform proposal;
- generation template proposal;
- pack proposals;
- storage proposals;
- missing validator tasks;
- confidence and source evidence;
- dependency order.

Пользователь подтверждает каждый класс изменений.

Import должен уметь продолжить существующую CreationWizardSession и после apply вернуть созданные IDs в исходные поля Wizard.

Нельзя:

- автоматически публиковать platform/generation;
- создавать compatibility mapping без review;
- создавать дубли concepts/properties;
- считать AI suggestion фактом без source/review.

## Поведение импорта в разных режимах Wizard

### Guided Manual

Import только:

- извлекает данные;
- показывает evidence;
- предлагает следующий объект для ручного создания.

### Assisted Draft

Import:

- предварительно заполняет формы;
- создаёт unsaved proposals;
- позволяет подтвердить предложения по одному или группой.

### Bulk Apply

Import:

- формирует Creation Manifest;
- выполняет dry-run;
- применяет только confirmed manifest groups после явного действия пользователя.

Ни один импорт не должен:

- автоматически назначать новый property compatibility meaning;
- автоматически выбирать validator;
- автоматически распространять pack на поколение;
- автоматически публиковать server/product.

## Stage-specific Definition of Done

- Import не публикует ошибки молча.
- Новый SKU существующего типа не требует кода.
- Unknown data не теряется.
- Dry-run/review обязательны.
- Pipeline идемпотентен.
- Уникальные server-specific parts импортируются как direct assignments, а не искусственные packs.
- Классификация pack/direct/bundle/topology проходит human review.
- Cage/backplane variants не схлопываются по одному количеству bays.
- Import может подготовить option groups для GPU, M.2 и rails.
- Import создаёт draft properties/concepts/relations и generation templates.
- Aliases предотвращают дубли vendor terminology.
- Новое значение существующего принципа добавляется без кода.
- Новое поведение создаёт validator gap и publication blocker.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- sample imports минимум двух vendors;
- dry-run/apply/retry evidence;
- duplicate and rollback tests;
- shared Creation Manifest integration с этапом 07.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
