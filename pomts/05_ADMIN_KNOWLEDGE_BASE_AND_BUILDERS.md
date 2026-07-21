# Этап 5. Admin Knowledge Base and Specialized Builders

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `05`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-04-report.md`
- `OUTPUT_REPORT`: `reports/stage-05-report.md`
- `NEXT_STAGE`: `06`


## Skills

- `building-with-medusa` — Admin/API integration с custom modules
- `building-admin-dashboard-customizations` — Medusa Admin pages, forms, tables и permissions
- `react-best-practices` — data fetching, state и rendering performance
- `composition-patterns` — разделение builders на устойчивые compound components
- `frontend-testing-debugging` — runtime Admin scenarios и console/network checks
- `verification-before-completion` — end-to-end evidence для CRUD/builders

## Ownership

Владеет Admin registries, CRUD, component/pack/storage/option builders и локальным Create-and-Return.

## Out of scope

- Полный Server Creation Wizard и его режимы.
- Параллельный compatibility evaluator.
- Bulk import/apply engine.
- Визуальный редизайн Medusa Admin.

## Цель

Создать рабочую Admin Knowledge Base и специализированные builders для управления server-domain данными. Все compatibility previews должны использовать API этапа 04, а не собственную логику.

## Полноценный Smart Component & Pack Wizard

Создай единый мастер, доступный из:

- `Pack Library → Create`;
- `Server Model → Packs → Create`;
- `Server Model → Direct Components → Add`;
- `Server Model → Chassis & Storage → Add topology/bundle`;
- результата импорта с неизвестным объектом.

Мастер не должен сразу заставлять пользователя выбирать техническую сущность. Сначала он задаёт понятные вопросы и сам предлагает правильный вариант.

### Шаг 1. Что пользователь добавляет

Варианты:

- список взаимозаменяемых компонентов;
- один уникальный компонент конкретного сервера;
- комплект деталей, устанавливаемых вместе;
- новая дисковая/физическая конфигурация;
- новый тип компонента;
- импорт списка компонентов.

Покажи примеры:

- «Все Xeon Scalable 2nd Gen» → pack;
- «Уникальная expander board для R740xd» → direct component;
- «GPU enablement kit: riser + cable + fan kit» → assembly bundle;
- «12 LFF front + 4 LFF internal» → StorageTopology.

### Шаг 2. Умная рекомендация сущности

На основании ответов предложи:

- `ComponentPack`;
- `ServerModelComponentAssignment`;
- `AssemblyBundle`;
- `StorageTopology`;
- `ComponentTypeDefinition`.

Покажи объяснение, почему выбран этот тип. Пользователь может изменить решение, но мастер предупреждает о последствиях.

Эвристики:

- используется только одним server model → предлагать direct assignment;
- используется 2–3 моделями одного family → предложить direct assignment сейчас и возможность преобразовать в pack позже;
- много альтернатив одного type/platform → pack;
- несколько обязательных деталей → bundle;
- добавляет bays/slots/zones → topology;
- неизвестный физический класс → новый type definition.

### Шаг 3. Контекст сервера

Если мастер открыт из Server Model, автоматически подставь:

- server model;
- vendor/generation/family;
- chassis variant;
- capability profile;
- доступные slot classes;
- storage zones;
- existing assignments;
- source context.

Не заставляй повторно вводить уже известные данные.

### Шаг 4. Выбор или создание ComponentTypeDefinition

Покажи существующие types и их validators.

Если type отсутствует:

1. создать draft ComponentTypeDefinition;
2. описать fields schema;
3. отметить каждое поле как informational/filterable/engine-mapped/unmapped;
4. назначить fact paths;
5. выбрать существующий validator либо зафиксировать `validator_missing`;
6. запретить production publication, если type влияет на compatibility, но validator отсутствует.

Не разрешай использовать произвольный JSON как единственную форму создания.

### Шаг 5. Общие данные объекта

Для pack:

- name/slug;
- pack kind;
- manufacturer/platform/generation/socket/interface;
- defaults;
- qualification scope;
- source reference;
- version.

Для direct component:

- name/SKU/part number;
- component type;
- assignment role;
- selection mode;
- default/min/max quantity;
- storefront group/order;
- source;
- reusable candidate flag.

Для bundle:

- public/technical name;
- bundle items;
- required/optional quantities;
- auto-add policy;
- visibility;
- price behavior;
- rollback behavior.

Для topology:

- zones;
- location;
- bays;
- form factor;
- protocols;
- required cage/backplane/cables/controller;
- conflicts;
- public display name.

### Шаг 6. Создание или выбор компонентов

Поддержи:

- выбрать существующий component;
- создать один component;
- создать несколько строк вручную;
- CSV/JSON preview import;
- duplicate detection по SKU/part number/vendor identity;
- copy from similar component;
- inherit pack defaults;
- individual overrides.

После сохранения новый component сразу валидируется схемой.

### Шаг 7. Compatibility mapping

Для каждого поля покажи:

- normalized key;
- value/unit;
- source;
- fact path;
- используется ли validator;
- что именно оно ограничивает или предоставляет.

Примеры:

- `max_memory_speed` → влияет на RAM effective speed;
- `pcie_lanes_required` → потребляет PCIe lanes;
- `provides_sas_ports` → предоставляет ports;
- `adds_internal_lff_bays` → изменяет topology;
- `requires_fan_kit` → создаёт requirement;
- `conflicts_with_riser_2` → конфликтует с resource.

Если compatibility field unmapped, показывай блокирующее предупреждение:

`Параметр сохранится, но сейчас не влияет на конфигуратор`.

### Шаг 8. Requirements / Provides / Consumes / Conflicts

Сделай визуальный builder без arbitrary JavaScript.

Поддержи выбор фактов и ресурсов:

- requires slot/type/protocol/capability/component/bundle;
- provides slots/bays/ports/capability;
- consumes slots/lanes/power/bays/ports;
- conflicts with component, bundle, topology, slot or resource;
- quantity formulas;
- conditional requirements.

Показывай generated human-readable summary.

### Шаг 9. Где показывать компонент

Для direct и pack items настрой:

- configurator section;
- visible/advanced/hidden technical;
- order;
- default selection;
- user-removable;
- auto-added;
- price-visible;
- explanation/help text.

Hidden technical component всё равно должен быть виден в Admin trace и configuration snapshot.

### Шаг 10. Назначение

Для pack:

- назначить текущему server;
- выбрать дополнительные servers;
- сохранить без назначения.

Для direct component:

- назначить текущему server;
- optionally copy assignment to sibling chassis variants;
- предложить преобразование в pack при повторном использовании.

Для bundle/topology:

- связать с trigger component/topology/server;
- определить auto-add и conflicts.

### Шаг 11. Live validation и simulation

До сохранения запусти:

- schema validation;
- duplicate check;
- missing validator check;
- resource matching;
- sample Compatibility Engine run;
- conflict detection;
- publication readiness check.

Покажи:

- passed;
- warnings;
- blockers;
- exact reason;
- affected server/options;
- preview configurator section.

### Шаг 12. Сохранение и возврат

После создания из Server Model:

1. сохранить сущность;
2. создать assignment;
3. вернуть пользователя в тот же server/tab;
4. подсветить созданный объект;
5. показать validation result;
6. предложить открыть Simulator.

При частичной ошибке не оставляй orphan records. Используй transaction/workflow compensation.

## Direct Components UI

Добавь в Server Model отдельную вкладку или секцию `Direct Components`.

Группируй:

- optional choices;
- required/auto-added;
- enablement kits;
- replacements;
- hidden technical.

Для каждого показывай:

- почему он назначен напрямую;
- type/role;
- visibility;
- requirements/provides/consumes;
- validation;
- source;
- действие `Convert to Pack`, если компонент стал использоваться многими серверами.

## Умные предупреждения

Мастер должен предупреждать:

- «Этот компонент уже используется в 4 моделях — лучше создать pack»;
- «Компонент добавляет bays — возможно, нужна StorageTopology»;
- «Вы создали bundle из одного элемента»;
- «Поле влияет на совместимость, но validator отсутствует»;
- «Компонент скрыт от пользователя, но имеет цену»;
- «Auto-added component не имеет rollback/quantity policy»;
- «Прямое назначение дублирует существующий pack»;
- «Part number уже существует».

## Draft и восстановление

- autosave draft;
- resume later;
- dirty state protection;
- validation state persisted;
- no production visibility until approved.

## Smart Storage Cage Builder

Добавь в `Server Model → Chassis & Storage` отдельный мастер `Create Storage Option`.

Он создаёт не заранее прошитый пример, а произвольную корзину/комбинацию корзин.

### Шаг 1. Основная информация

- публичное и техническое название;
- server model/chassis variant;
- location: front/rear/internal/mid;
- base или optional;
- источник документации;
- part number/kit number, если есть.

### Шаг 2. Группы отсеков

Пользователь может добавить любое количество bay groups.

Для каждой:

- количество;
- native form factor;
- accepted smaller form factors;
- требуется ли adapter;
- какой adapter/bundle;
- нумерация bays;
- hot-swap;
- отдельная zone или общая;
- max populated count.

Покажи суммарное количество drives, но не теряй структуру групп.

### Шаг 3. Backplane

- выбрать существующий BackplaneVariant;
- создать новый;
- клонировать похожий и изменить.

Поля:

- SAS/SATA/NVMe;
- сколько bays каждого protocol;
- direct attach/expander;
- connectors;
- PCIe lanes;
- required controller;
- cable kits;
- max throughput/limits, если известны;
- conflicts.

Если пользователь меняет backplane так, что меняются protocols, lanes, controller или cables, мастер создаёт отдельный `ServerStorageOption`, даже когда физическое число bays такое же.

### Шаг 4. Adapters и переходники

Пользователь задаёт:

- LFF → SFF adapter support;
- допустимые adapter component/bundle;
- quantity;
- qualification;
- влияет ли adapter на hot-swap/protocol/clearance.

Не считать, что любой SFF drive автоматически подходит в любой LFF bay.

### Шаг 5. Автоматический подбор drive packs

Backend анализирует option и показывает:

- recommended compatible packs;
- technically compatible packs;
- incompatible packs;
- причину для каждого.

Пользователь может:

- подтвердить suggested pack;
- отказаться;
- выбрать другой pack;
- создать новый drive pack через Smart Wizard.

Проверки выполняются по form factor, protocol, adapters, backplane, controller, zones и qualification.

### Шаг 6. Controller и connection requirements

- embedded controller;
- RAID/HBA;
- NVMe direct lanes;
- expander;
- required ports;
- required cable bundle;
- max drive count per controller;
- optional/replacement controller.

### Шаг 7. Conflicts и resources

Настрой:

- riser conflicts;
- GPU clearance conflicts;
- rear/internal cage conflicts;
- PCIe lane consumption;
- power/cooling impact;
- controller slot consumption.

### Шаг 8. Preview

Покажи:

- визуальный список zones;
- total bays;
- bays per form factor/protocol;
- supported drive categories;
- required adapters;
- required controller/cables;
- suggested packs;
- conflicts;
- storefront label.

### Шаг 9. Simulation

Создай sample selections:

- maximum native drives;
- mixed LFF/SFF через adapters;
- SAS/SATA mix;
- NVMe zone;
- over-capacity;
- unsupported drive.

Не сохраняй option как valid, если capacity/protocol/resource calculations противоречат друг другу.

### Шаг 10. Save

Сохрани StorageCageDefinition, BackplaneVariant, ServerStorageOption и assignments транзакционно. При ошибке не оставляй orphan records.

## Smart Configurator Option Group Builder

Добавь мастер для optional-категорий.

### Создание группы

Пользователь задаёт:

- title;
- component type;
- source: pack/direct/bundle;
- cardinality;
- allow none;
- default state;
- min/max quantity;
- storefront order;
- advanced mode;
- help text.

### Стандартные сценарии

#### M.2 expansion board

- `allow_none = true`;
- default: «Без платы M.2»;
- compatible direct components или pack;
- выбор платы может открыть дочернюю группу M.2 drives;
- плата consumes PCIe slot/lanes и provides M.2 slots.

#### GPU

- `allow_none = true`;
- default: «Без видеокарты»;
- список только совместимых GPU;
- max quantity из engine;
- requirements for riser, power, fan kit и CPU.

#### Rails

- `allow_none = true`;
- default: «Без рельсов»;
- варианты берутся из данных конкретной модели:
  fixed/static, sliding/dynamic и другие documented options;
- Cable Management Arm не смешивать с rails, если в документации это отдельная опция;
- сохранять exact part number.

#### Уникальная плата

- direct assignment;
- optional group «Без платы / выбранная плата»;
- при выборе могут открываться новые дочерние options;
- component остаётся полноценной строкой configuration snapshot.

### Preview и validation

Покажи UI configurator до публикации:

- none option;
- options;
- disabled reasons;
- dependencies;
- child groups;
- price visibility;
- configuration snapshot.

Не создавай fake Component «Без GPU», «Без платы» или «Без рельсов».

## Technology & Property Knowledge Base

Добавь разделы:

- `Property Registry`;
- `Technology Concepts`;
- `Relationships`;
- `Technology Platforms`;
- `Vendor Generations`;
- `Coverage & Unmapped`;
- `Usage & Impact`.

## Property Definition Wizard

Шаги:

1. Название, stable key и описание.
2. Тип значения и unit.
3. Entity scopes.
4. Allowed values или reference concept type.
5. Display/filter/compare/search settings.
6. Inheritance behavior.
7. Влияет ли property на compatibility.
8. Fact mapping и существующий validator.
9. Source/review policy.
10. Usage preview и validation.

Если пользователь создаёт compatibility property без mapping:

- сохранить как draft/unmapped;
- показать, что она не влияет на configurator;
- запретить production publication сущностей, которые полагаются на неё.

## Technology Concept Wizard

Шаги:

1. Выбрать или создать concept type.
2. Создать canonical concept.
3. Добавить aliases.
4. Заполнить normalized properties.
5. Разрешённые relations.
6. Source/reference.
7. Найти duplicate/near-duplicate concepts.
8. Preview usage.

## Relationship Builder

Пользователь выбирает:

- source;
- relation type;
- target;
- quantity/unit;
- conditions;
- source document.

Builder показывает человеческое объяснение:

```text
Xeon Gold 6248R требует FCLGA3647.
Server model предоставляет 2 FCLGA3647.
CPU становится кандидатом, но будут дополнительно проверены generation, TDP и qualification.
```

Проверки:

- разрешены ли source/target types;
- mapped ли relation;
- существует ли inverse side;
- не создаётся ли contradiction/cycle;
- какие published entities затронет изменение.

## Technology Platform Builder

Позволяет создать платформу без кода:

- socket/concepts;
- processor families/generations;
- memory technology/module type;
- interconnect/PCIe;
- shared CPU/RAM/NIC packs;
- default properties;
- validators coverage.

## Vendor Generation Template Builder

Поля и действия:

- vendor/generation/architecture;
- parent TechnologyPlatform;
- inherited properties;
- default shared packs;
- vendor-specific packs;
- default option groups;
- exceptions;
- source/version.

Покажи inheritance preview:

```text
CPU Pack — inherited from Intel Platform
RAM Pack — inherited from Intel Platform
RAID Pack — assigned by Dell 16G
Rails template — assigned by Dell 16G
```

Не заставляй копировать pack на каждую server model.

## Stage-specific Definition of Done

- Admin имеет отдельные понятные разделы для Property Registry, Technology Concepts, relations, platforms и generation templates.
- Smart Component/Pack Wizard создаёт только явно подтверждённые сущности.
- Direct Components UI не заставляет упаковывать уникальные детали в reusable packs.
- Storage Cage, Backplane и Option Group builders используют канонические модели этапа 03.
- Compatibility preview и simulation вызывают side-effect-free API этапа 04.
- Create-and-Return для локальных builders не создаёт скрытые записи.
- Все формы имеют loading/error/empty/validation states.
- Нет ручного JSON там, где существует типизированная форма.
- Изменения проходят permissions и audit trail.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- screen/route inventory Admin Knowledge Base;
- permission matrix;
- Create-and-Return scenarios;
- screenshots ключевых forms/states;
- доказательство использования validation API этапа 04.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
