# Этап 7. Genius Bootstrap Wizard, Modes and Confirmation

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `07`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-06-report.md`
- `OUTPUT_REPORT`: `reports/stage-07-report.md`
- `NEXT_STAGE`: `08`


## Skills

- `building-with-medusa` — dependency workflows, manifest and apply adapter contracts
- `building-admin-dashboard-customizations` — Genius Wizard and Confirmation Center
- `react-best-practices` — large multi-mode state and async operations
- `composition-patterns` — dependency tree, previews, confirmation and recovery components
- `frontend-testing-debugging` — mode switching, interruption and recovery tests
- `systematic-debugging` — complex dependency/state failures
- `verification-before-completion` — bootstrap, manifest and hidden-write proof

## Ownership

Владеет Genius dependency planning, recursive Create-and-Return, три режима, Action Preview, Confirmation Center, recovery/rollback и Creation Manifest.

## Out of scope

- Базовый core Wizard — этап 06.
- Собственный bulk/import engine: apply принадлежит этапу 08.
- Параллельный Compatibility Engine.
- Автоматическая публикация без отдельного подтверждения.
- Визуальный редизайн Admin.

## Цель

Расширить доказанный core Wizard этапа 06 интеллектуальным bootstrap-процессом. Автоматизация предлагает и планирует, но пользователь видит manifest и подтверждает записи. Bulk Apply использует единый adapter contract будущего Import Pipeline этапа 08.

## Граница с Import Pipeline

- Этап 07 создаёт канонический `CreationManifest`, preview и typed apply interface.
- До этапа 08 `Bulk Apply` работает только через безопасный feature flag/dry-run adapter.
- Этап 08 реализует staging, transactional apply, retry и rollback.
- Запрещено создавать отдельный bulk engine внутри Wizard.

## Genius Bootstrap Server Creation Wizard

Текущий Server Creation Wizard расширь до единого orchestration-инструмента, который способен создать сервер, даже если в базе пока не существует:

- vendor;
- поколения;
- TechnologyPlatform;
- socket;
- memory technology;
- property definition;
- concept type;
- technology concept;
- relation type/mapping;
- component type;
- components;
- packs;
- storage cages/backplanes;
- option groups;
- Medusa Product.

Пользователь не должен вручную выходить из Wizard и искать другой раздел.

### Режимы запуска

1. `Quick from existing platform`
2. `New model in existing generation`
3. `Bootstrap new vendor generation`
4. `Bootstrap completely new technology platform`
5. `Clone similar server`
6. `Import documentation and review`
7. `Resume draft`

### Фаза 0. Discovery Scan

До создания данных Wizard сканирует реестр и показывает:

- найденные vendors/generations/platforms;
- похожие server models;
- подходящие sockets;
- CPU/RAM packs;
- aliases;
- возможные дубли;
- reusable storage/options;
- properties, которые можно унаследовать;
- missing entities;
- unmapped properties;
- validator gaps.

Результат:

```text
Существует:
✓ Vendor Dell
✓ DDR5
✓ OCP 3.0

Отсутствует:
✕ Dell 18G Template
✕ Новая CPU Platform
✕ Новый socket
✕ CPU pack
⚠ Новое property без mapping
```

### Фаза 1. Dependency Planner

Wizard строит граф создания:

```text
Property/Concept Types
→ Technology Concepts
→ Relations and mappings
→ Technology Platform
→ Vendor Generation Template
→ Shared Packs
→ Server Model
→ Chassis/Storage
→ Option Groups
→ Product
→ Validation
```

Для каждого узла:

- обязательный/необязательный;
- существует/создать/связать/подтвердить;
- источник;
- confidence;
- blocker/warning;
- можно ли отложить;
- какой nested wizard решает проблему.

До применения покажи `Creation Manifest Preview`.

### Фаза 2. Рекурсивные Create-and-Return мастера

Из любого поля доступно:

- `Choose existing`;
- `Create new`;
- `Create from template`;
- `Import`;
- `Mark unresolved draft`.

После вложенного создания:

1. сохранить объект;
2. вернуться в исходный Wizard;
3. восстановить текущий шаг и scroll/context;
4. автоматически выбрать созданный объект;
5. запустить revalidation;
6. обновить dependency graph.

Пример цепочки:

```text
Server Wizard
→ CPU Platform missing
→ Create Platform
→ Socket missing
→ Create Socket Concept
→ CPU Pack missing
→ Create Pack
→ CPU component missing
→ Create Component
→ return to Pack
→ return to Platform
→ return to Server
```

### Фаза 3. Создание и назначение свойств

На каждом уровне Wizard должен позволять:

- выбрать существующее PropertyDefinition;
- создать новое property;
- назначить значение;
- унаследовать;
- переопределить;
- явно указать `not supported`;
- связать с TechnologyConcept;
- создать relation;
- назначить mapping/validator;
- оставить draft с предупреждением.

#### Property Assignment Wizard

Шаги:

1. Где назначается property:
   platform/generation/family/model/chassis/storage/component/pack.
2. Выбрать/создать PropertyDefinition.
3. Ввести normalized value и unit.
4. Выбрать inheritance behavior.
5. Определить usage:
   display/filter/compare/compatibility.
6. Если compatibility:
   - relation role;
   - fact path;
   - concept;
   - validator;
   - provider/consumer side.
7. Проверить конфликт с inherited value.
8. Preview affected entities.
9. Save assignment.
10. Recalculate coverage.

Пример:

```text
Property: cpu_socket
Scope: Dell 18G Platform
Value: LGAxxxx
Behavior: provides
Validator: CPU platform validator
```

Или:

```text
Property: new_memory_mode
Scope: Dell 18G
Status: affects compatibility
Mapping: missing
Result: draft saved, publication blocked
```

### Фаза 4. Умная классификация нового понятия

Если пользователь вводит неизвестное слово/свойство, Wizard спрашивает:

```text
Что это?

○ Новое значение известного понятия
○ Новое свойство
○ Новый физический ресурс
○ Новый компонент
○ Новый тип компонента
○ Новая связь
○ Не знаю — сохранить для классификации
```

Wizard не создаёт автоматически случайную сущность.

### Фаза 5. Автоматическое создание TechnologyPlatform

Если платформа отсутствует, Wizard проводит по:

- CPU vendor/architecture;
- socket concepts;
- processor generation/family;
- memory technology/module type;
- PCIe/interconnect;
- shared properties;
- CPU/RAM/NIC packs;
- validators coverage;
- source documents.

Если нужного property/concept/pack нет — nested create-and-return.

### Фаза 6. Автоматическое создание VendorGenerationTemplate

Wizard создаёт поколение:

- vendor;
- generation label;
- architecture variant;
- parent platform;
- inherited properties;
- default shared packs;
- vendor-specific packs;
- management;
- RAID/boot/rails templates;
- default option groups;
- exceptions;
- source/version.

После создания показывает:

```text
Inherited from platform:
CPU socket
CPU packs
DDR generation
RAM packs
PCIe generation

Assigned by generation:
RAID packs
Rails
Management
Boot options
```

### Фаза 7. Создание Server Model

Wizard спрашивает только отличия конкретной модели:

- sockets count;
- DIMM slots/channels;
- TDP/cooling limits;
- risers/slots;
- PSU/power budget;
- chassis variants;
- storage options;
- unique direct components;
- model-specific exceptions.

Все inherited values видны и объяснимы.

### Фаза 8. Smart property completeness assistant

На каждом шаге Wizard анализирует свойства:

- отсутствует обязательное;
- property создано, но значение не назначено;
- значение назначено, но concept отсутствует;
- concept есть, но relation не создана;
- relation есть, но validator не понимает её;
- property нигде не используется;
- property дублирует существующую;
- inherited и direct values конфликтуют.

Показывай точный путь исправления:

```text
Property max_memory_speed
→ значение есть
→ unit есть
→ fact mapping есть
→ validator есть
✓ готово
```

```text
Property supports_new_memory_mode
→ значение есть
→ affects compatibility
→ validator отсутствует
✕ публикация заблокирована
[Создать mapping] [Назначить validator] [Сделать informational]
```

### Фаза 9. Smart recommendations

Wizard может предложить:

- использовать существующий concept вместо дубля;
- добавить alias;
- назначить pack на platform/generation, а не на model;
- преобразовать повторяющиеся direct assignments в pack;
- создать reusable property template;
- вынести повторяющиеся свойства в VendorGenerationTemplate;
- создать новый validator task;
- клонировать storage option;
- создать child option group.

Рекомендации не применяются без подтверждения.

### Фаза 10. Source and confidence

Для каждого созданного объекта:

- source type;
- document/page/reference;
- extracted manually/AI/imported;
- confidence;
- reviewed by;
- review status.

Низкая confidence для compatibility property создаёт blocker или warning согласно policy.

### Фаза 11. Autosave, recovery и rollback

Обязательно:

- autosave после каждого шага;
- resume from draft;
- parent/child wizard sessions;
- no orphan records;
- transactional finalization;
- workflow compensation;
- cancel with cleanup preview;
- recover interrupted session;
- immutable audit trail.

### Фаза 12. Creation Manifest

Перед финальным сохранением покажи:

- что будет создано;
- что будет изменено;
- что будет унаследовано;
- какие packs назначены;
- какие properties unresolved;
- какие validators missing;
- какие Medusa Product/Variants будут созданы;
- какие objects останутся drafts.

### Фаза 13. Final simulation

Автоматически построить representative matrix:

- minimum CPU/RAM;
- maximum CPU/RAM;
- lower-speed RAM with faster/slower CPUs;
- each storage option;
- mixed drive/adapters;
- RAID/HBA/NVMe;
- NIC/OCP;
- GPU;
- M.2 board;
- rails;
- power/cooling;
- cart/RFQ snapshot.

### Фаза 14. Publication decision

Результат:

- `READY`;
- `READY_WITH_WARNINGS`;
- `BLOCKED`;
- `DRAFT_INCOMPLETE`.

Публикация блокируется, если:

- compatibility property unmapped;
- missing validator;
- unresolved inherited conflict;
- missing provider relation;
- invalid storage/resource graph;
- missing product identity;
- critical source unreviewed.

### Фаза 15. Reusability extraction

После успешного создания Wizard спрашивает:

- сохранить platform template;
- сохранить generation template;
- создать shared packs;
- вынести repeated properties наверх;
- использовать server as clone template;
- создать onboarding recipe для следующей модели.

Цель: следующий сервер того же поколения создаётся значительно быстрее.

## UX требования Genius Wizard

- progress map;
- dependency graph;
- current blockers count;
- inherited/direct/unresolved badges;
- searchable dropdowns;
- inline creation;
- contextual explanations;
- preview before save;
- undo where safe;
- no raw JSON in normal flow;
- advanced JSON only for expert/debug mode;
- desktop-first Admin, но responsive;
- keyboard navigation;
- clear loading/error/retry states.

## Три переключаемых режима Genius Wizard

В верхней части Wizard добавь постоянный переключатель режима:

```text
Guided Manual | Assisted Draft | Bulk Apply
```

Режим отображается на всех шагах и сохраняется в `CreationWizardSession`.

По умолчанию всегда используется `Guided Manual`.

### Общий принцип

Wizard является навигатором, объясняющим помощником и валидатором. Он не принимает бизнес- и технические решения вместо пользователя.

На каждом шаге он обязан показать:

1. что сейчас создаётся;
2. чего не хватает;
3. зачем это необходимо;
4. какие действия доступны;
5. какие данные нужно заполнить;
6. что будет создано или изменено;
7. что произойдёт после подтверждения;
8. можно ли продолжать;
9. какие предупреждения останутся.

## Режим 1. Guided Manual

Основной безопасный режим.

Wizard:

- показывает только один логический шаг за раз;
- объясняет, что нажать;
- открывает нужный nested wizard;
- предлагает существующие значения;
- показывает примеры;
- проверяет введённые данные;
- возвращает пользователя обратно;
- сообщает следующий шаг.

Без отдельного подтверждения пользователя запрещено:

- создавать PropertyDefinition;
- создавать TechnologyConcept;
- создавать TechnologyRelation;
- назначать PropertyAssignment;
- создавать TechnologyPlatform;
- создавать VendorGenerationTemplate;
- создавать Component/Pack/Bundle;
- назначать pack scope;
- создавать Storage Option;
- создавать Medusa Product/Variant;
- изменять published entity;
- публиковать сервер.

Пример:

```text
Шаг: CPU socket

Для продолжения платформе нужен socket.

[Выбрать существующий]
[Создать новый]
[Сохранить и продолжить позже]
```

После создания:

```text
Socket создан.

Следующий рекомендуемый шаг:
создать связь Platform PROVIDES Socket.

[Открыть Relationship Builder]
[Пропустить и оставить blocker]
```

Wizard не создаёт relation автоматически.

## Режим 2. Assisted Draft

Режим ускоренного ручного заполнения.

Wizard может:

- анализировать документацию;
- предварительно заполнять формы;
- находить похожие платформы;
- предлагать aliases;
- предлагать properties;
- предлагать relations;
- подбирать существующие packs;
- формировать draft storage option;
- предлагать generation inheritance.

Все предложения должны иметь визуальный статус:

- `Suggested`;
- `Confirmed`;
- `Edited`;
- `Rejected`;
- `Unresolved`.

До подтверждения данные не считаются сохранёнными production records.

На каждом шаге доступны:

```text
[Принять выбранные предложения]
[Изменить]
[Отклонить]
[Перейти к ручному режиму]
```

Даже в Assisted Draft отдельно подтверждаются:

- смысл нового свойства;
- compatibility impact;
- relation type;
- validator mapping;
- pack assignment scope;
- product creation;
- publication.

## Режим 3. Bulk Apply

Предназначен для проверенной массовой загрузки.

Wizard:

1. собирает все подтверждённые предложения;
2. строит Creation Manifest;
3. группирует изменения;
4. показывает dependency order;
5. показывает diff;
6. запускает dry-run;
7. показывает blockers/warnings;
8. предлагает применить только approved actions.

Manifest группируется:

- concepts and aliases;
- property definitions;
- property assignments;
- relations;
- platform;
- generation;
- components;
- packs;
- storage options;
- server model;
- product links;
- revalidation tasks.

Кнопки:

```text
[Dry Run]
[Approve group]
[Reject group]
[Edit item]
[Apply approved manifest]
```

Применение должно быть:

- транзакционным там, где возможно;
- с workflow compensation;
- с audit trail;
- с idempotency key;
- без публикации по умолчанию.

Даже после Bulk Apply сервер остаётся `draft/review`, пока пользователь отдельно не подтвердит публикацию.

## Переключение режимов

Пользователь может менять режим в любое время.

### Guided Manual → Assisted Draft

- существующие значения сохраняются;
- Wizard начинает показывать предложения;
- уже подтверждённые данные не меняются.

### Assisted Draft → Guided Manual

- accepted data сохраняются;
- неподтверждённые suggestions остаются отдельными draft proposals;
- ничего не применяется автоматически.

### Assisted Draft → Bulk Apply

- только confirmed proposals попадают в manifest;
- suggested/unresolved элементы не включаются автоматически.

### Bulk Apply → Guided Manual

- неприменённый manifest сохраняется;
- пользователь может продолжить по одному шагу;
- применённые действия отображаются как completed.

Перед переключением показывай:

```text
Что изменится в поведении Wizard
Что сохранится
Что останется неподтверждённым
Какие действия не будут выполнены
```

## Confirmation Center

Добавь постоянную панель:

- pending decisions;
- confirmed actions;
- rejected suggestions;
- unresolved blockers;
- ready for manifest;
- applied actions.

Пользователь должен иметь возможность открыть любое решение и изменить его до финального применения, если оно ещё не стало зависимостью подтверждённой записи.

## Action Preview

Перед каждым сохранением показывай краткий preview:

```text
Будет создано:
TechnologyConcept: LGAxxxx

Будет связано:
ничего

Будет затронуто:
только текущая draft platform

Не будет выполнено:
relation creation
pack assignment
publication
```

Для relation:

```text
Будет создана связь:
Dell 18G Platform PROVIDES 2 × LGAxxxx

Результат:
CPU packs с matching socket смогут стать кандидатами.

Это не гарантирует полную совместимость.
```

## Уровни подтверждения

### Обычное подтверждение

Для новой draft сущности.

### Усиленное подтверждение

Для:

- изменения published data;
- массового назначения поколению;
- изменения compatibility mapping;
- удаления или disable;
- изменения relation, затрагивающей готовые конфигурации.

### Отдельное подтверждение публикации

Никакой режим не публикует server/product автоматически.

## Assistant text

Wizard должен формулировать инструкции как действия пользователя:

```text
1. Нажмите «Создать socket».
2. Укажите canonical name.
3. Добавьте aliases из документации.
4. Сохраните socket.
5. Вернитесь к этому шагу.
6. Создайте связь PROVIDES.
```

Не формулировать основной flow как:

```text
Система автоматически создаст socket, pack и platform.
```

Допустимая формулировка:

```text
Wizard подготовил предложение.
Проверьте данные и подтвердите создание.
```

## Настройки режима

В Wizard settings:

- default mode;
- remember last mode per user;
- require enhanced confirmation for published data;
- allow Bulk Apply role;
- maximum bulk item count;
- require reviewer for compatibility mapping;
- require reviewer for publication;
- enable/disable AI suggestions;
- show advanced technical explanations.

`Bulk Apply` должен быть доступен только пользователям с отдельным permission.

## Stage-specific Definition of Done

- Genius Bootstrap может начать с пустой platform/generation context.
- Dependency Planner строит детерминированный граф.
- Recursive Create-and-Return возвращает пользователя в исходный шаг.
- Guided Manual, Assisted Draft и Bulk Apply используют один canonical manifest.
- Переключение режимов не создаёт и не удаляет данные.
- Все planned writes видны в Action Preview и Confirmation Center.
- Публикация подтверждается отдельно.
- Session/recovery/rollback не затрагивает ранее существующие сущности.
- Duplicate detection предотвращает повторное создание concepts/properties/packs.
- Bulk Apply не содержит собственного apply engine и готов к подключению этапа 08.
- Нет hidden writes во всех режимах.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- empty-platform bootstrap scenario;
- mode-switch matrix;
- interruption/recovery/rollback;
- duplicate prevention;
- Creation Manifest examples;
- network/database proof of no hidden writes;
- typed apply adapter contract for stage 08.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
