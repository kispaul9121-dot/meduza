# Этап 3. Data Dictionary, Packs and Capabilities

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `03`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-02-report.md`
- `OUTPUT_REPORT`: `reports/stage-03-report.md`
- `NEXT_STAGE`: `04`


## Skills

- `building-with-medusa` — custom module models, services и API boundaries
- `domain-modeling` — границы сущностей, инварианты и ubiquitous language
- `supabase-postgres-best-practices` — constraints, indexes, normalization и migrations
- `verification-before-completion` — migration/backfill и invariant verification

## Ownership

Владеет канонической server-domain моделью, schema, provenance, inheritance и data contracts.

## Out of scope

- Runtime Compatibility Engine.
- Admin Wizard UX и три режима работы.
- Vendor import execution.
- Storefront changes, кроме типов/DTO, необходимых для backward compatibility.

## Цель

Создать типизированную модель, чтобы существующие классы товаров добавлялись через Admin/import без постоянной правки кода.

## Работы

1. Добавь `ComponentTypeDefinition`/registry:
   CPU, RAM, drive, RAID, NIC, PSU, riser, backplane, drive cage, boot storage, accelerator, cooling, cable, rails, license, service.
2. Для accelerator поддержи GPU, FPGA, DPU и AI accelerator.
3. Definition хранит fields schema, UI schema, facts mapping, validator key, schema version и enabled.
4. Добавь `AttributeDefinition`:
   key, label, data type, unit, enum, required, displayable, filterable, comparable, affects compatibility, fact path, type scope.
5. Статусы attribute: informational, filterable, engine_mapped, unmapped.
6. Раздели Component data:
   normalized specs, raw specs, requirements, provides, consumes, applicability, source, schema version.
7. Сохрани текущий `specs_json` через migration/backfill adapter.
8. Расширь ComponentPack:
   - candidate_pool;
   - assembly_bundle;
   - platform_template.
9. CPU packs создавай по поколению CPU, а не по серверному бренду:
   Xeon Scalable 1st Gen и 2nd Gen.
10. Pack хранит общие defaults; каждый CPU — собственные TDP, cores, frequencies, cache, max memory speed, channels, UPI, PCIe и max socket count.
11. Добавь `ServerModelPackAssignment`, не перезаписывающий applicability каждого компонента.
12. Новый component в pack автоматически становится кандидатом назначенных server models.
13. Добавь строгий, версионируемый Capability Profile:
    platform, CPU, memory, storage, expansion, network, accelerator, boot storage, power, cooling, management.
14. Добавь `StorageTopology`:
    zones, location, bays, form factor, protocols, required cage/backplane/cables/controller, provides/consumes/conflicts.
15. `12 LFF front + 4 LFF internal` — topology, не обычный pack.
16. Создай безопасный backfill и отчёт unmapped legacy fields.

## Прямые компоненты конкретной серверной модели

Не всё должно оформляться как pack.

Добавь `ServerModelComponentAssignment` для единичных или редких компонентов, которые относятся к одной модели либо к очень небольшому числу моделей:

- proprietary expander board;
- уникальная daughterboard;
- GPU enablement board;
- vendor-specific expansion board;
- внутренний контроллер;
- специальный cable kit;
- fan/performance kit;
- нестандартная boot board;
- сервисная или лицензионная опция конкретной модели.

Минимальные поля:

- `server_model_id`;
- `component_id`;
- `assignment_role`;
- `selection_mode`;
- `default_quantity`;
- `min_quantity`;
- `max_quantity`;
- `enabled`;
- `sort_order`;
- `requirements_override_json`;
- `provides_override_json`;
- `consumes_override_json`;
- `conflicts_override_json`;
- `source_doc_reference`;
- `assignment_source`;
- `notes`.

Поддержи `assignment_role`:

- `optional_choice` — пользователь может выбрать;
- `required_component` — обязателен при определённом условии;
- `default_component` — выбран по умолчанию, но может быть заменён;
- `auto_added_technical` — добавляется backend и может быть скрыт от обычного пользователя;
- `enablement_kit` — открывает другую возможность;
- `replacement_option` — заменяет базовую встроенную деталь.

Поддержи `selection_mode`:

- `visible`;
- `advanced_only`;
- `hidden_technical`;
- `informational`.

Прямое назначение не обходит Compatibility Engine. Компонент всё равно обязан иметь:

- существующий ComponentTypeDefinition;
- валидные normalized attributes;
- requirements/provides/consumes;
- validator или явно информационный статус.

Если новый объект физически является новым классом оборудования, которого нет в registry, его нельзя маскировать типом `service` или `cable`. Создай новый ComponentTypeDefinition и validator либо заблокируй публикацию до их появления.

## Правило выбора между сущностями

Зафиксируй decision table:

- один и тот же список альтернатив используется многими серверами → `ComponentPack`;
- одна специфическая деталь доступна конкретному серверу → `ServerModelComponentAssignment`;
- несколько деталей всегда устанавливаются вместе → `AssemblyBundle`;
- деталь создаёт или изменяет физические bays/slots/zones → `StorageTopology` или связанный enablement bundle;
- редкое логическое исключение → `CompatibilityRule`;
- характеристика только описательная → informational AttributeDefinition.

Не создавай pack из одного компонента только ради того, чтобы показать его в configurator.

## Универсальная модель дисковой корзины

`StorageTopology` должна оставаться итоговой схемой хранения сервера, но пользователь создаёт её через отдельные понятные сущности и мастер.

Добавь:

### `StorageCageDefinition`

Физическая корзина или группа отсеков:

- `name`;
- `location`: front/rear/internal/mid;
- `bay_groups_json`;
- `hot_swap`;
- `max_total_drives`;
- `source_doc_reference`;
- `enabled`;
- `schema_version`.

Каждая группа bay содержит:

- `count`;
- `native_form_factor`: LFF/SFF/EDSFF/M.2/другой зарегистрированный тип;
- `accepted_form_factors`;
- `adapter_required_for_json`;
- `hot_swap`;
- `numbering_start/end`;
- `protocol_limit_override_json`;
- `notes`.

Пример: LFF bay может принимать LFF напрямую и SFF только через разрешённый adapter. SFF bay не должен автоматически принимать LFF.

### `BackplaneVariant`

Описывает способ подключения этой корзины:

- `name`;
- `supported_protocols`: SAS/SATA/NVMe;
- `connector_types`;
- `direct_attach_or_expander`;
- `max_protocol_bays_json`;
- `lane_requirements_json`;
- `required_controller_capabilities_json`;
- `required_cables_json`;
- `provides_json`;
- `consumes_json`;
- `conflicts_json`;
- `source_doc_reference`.

Если одна и та же физическая корзина комплектуется другим backplane и меняет набор протоколов, лимиты NVMe, cables или controller requirements, это отдельный `ServerStorageOption`.

### `ServerStorageOption`

Пользовательская опция конфигуратора, объединяющая:

- одну или несколько `StorageCageDefinition`;
- конкретные `BackplaneVariant`;
- optional adapters/expanders/cables;
- публичное название;
- общие и покомпонентные лимиты дисков;
- совместимые drive pack suggestions;
- required bundles;
- conflicts;
- base/default status.

Например, два варианта с одинаковыми 16 физическими bay, но разными backplane, считаются разными storage options.

Не своди все корзины к одной цифре `16 LFF`: храни location, bay groups, form factor acceptance, protocol distribution и способ подключения.

## Автоматическое предложение паков дисков

После создания `ServerStorageOption` backend должен вычислять совместимые candidate drive packs по:

- native/accepted form factor;
- наличию и совместимости adapter;
- SAS/SATA/NVMe protocol;
- bay count;
- ограничениям отдельных zones;
- controller/backplane capabilities;
- qualification/applicability.

Система только предлагает packs и показывает причину. Пользователь подтверждает их назначение.

Пример:

- LFF SAS/SATA bays → LFF SAS HDD, LFF SATA HDD;
- SFF через approved LFF-to-SFF adapter → допустимые SFF SAS/SATA HDD/SSD;
- SFF NVMe zone → SFF/U.2 NVMe pack;
- отсутствие NVMe lanes/backplane → NVMe pack не предлагается.

Не определяй совместимость только по размеру. Форм-фактор, protocol, adapter, backplane и controller проверяются вместе.

## Универсальные группы выбора конфигуратора

Добавь `ConfiguratorOptionGroup`, чтобы optional-категории не требовали отдельной frontend-логики.

Поля:

- `key`;
- `title`;
- `server_model_id` или template scope;
- `component_type`;
- `source_types_json`;
- `selection_cardinality`: zero_or_one/exactly_one/zero_or_many/one_or_many;
- `allow_none`;
- `none_label`;
- `none_selected_by_default`;
- `min_quantity`;
- `max_quantity`;
- `sort_order`;
- `advanced`;
- `help_text`;
- `visibility_rules_json`.

Через одну модель должны работать:

- M.2 expansion boards: «Без платы» по умолчанию или одна совместимая плата;
- GPU: «Без видеокарты» по умолчанию или допустимое количество совместимых GPU;
- rails: «Без рельсов» либо fixed/static/sliding options из документации конкретного сервера;
- optional NIC/mezzanine;
- internal boot boards;
- licenses/services;
- другие optional component groups.

Опция `none` — не Component и не fake SKU. Это явное состояние выбора группы, которое сохраняется в configuration snapshot.

## Канонический Property Registry

Создай один общий реестр свойств для:

- technology platform;
- vendor generation;
- server family;
- server model;
- chassis variant;
- storage option;
- component;
- component pack;
- bundle;
- configuration.

Используй `PropertyDefinition` как каноническое понятие. Существующий `AttributeDefinition`:

- либо мигрируй в `PropertyDefinition`;
- либо оставь его физическим именем таблицы, но не создавай второй параллельный реестр.

`PropertyDefinition` должен хранить:

- stable key;
- label/description;
- value type: text/number/boolean/enum/reference/list/object;
- unit and normalization rule;
- allowed values/reference concept type;
- entity scopes;
- required/default;
- displayable;
- filterable;
- comparable;
- searchable;
- inheritable;
- affects compatibility;
- fact path;
- validator key;
- schema version;
- lifecycle status;
- source/review policy.

Статусы использования:

- `informational`;
- `filterable`;
- `comparable`;
- `engine_mapped`;
- `unmapped`;
- `deprecated`.

Добавь `PropertyValue` с:

- owner entity type/id;
- property definition;
- normalized value;
- raw value;
- unit;
- source;
- confidence/review;
- inherited from;
- overridden flag;
- schema version.

Новая property может быть создана без кода. Если она помечена `affects_compatibility=true`, но не имеет fact mapping/validator, она получает блокирующий статус `unmapped_compatibility_property`.

## Technology Registry

Добавь универсальный справочник нормализованных понятий:

### `TechnologyConceptType`

Примеры:

- cpu_socket;
- processor_platform;
- memory_technology;
- memory_module_type;
- drive_form_factor;
- storage_protocol;
- connector_type;
- pcie_generation;
- slot_class;
- network_mezzanine_type;
- cooling_method;
- rail_type;
- management_generation;
- interconnect_capability.

Поля:

- key/name;
- schema;
- allowed relation types;
- validator/fact mapping;
- version;
- enabled.

### `TechnologyConcept`

Примеры:

- FCLGA3647;
- LGA4677;
- DDR5;
- RDIMM;
- SAS;
- SATA;
- NVMe;
- LFF;
- SFF;
- E3.S;
- OCP 3.0.

Поля:

- concept type;
- stable key;
- display name;
- vendor-neutral/vendor-specific;
- normalized attributes;
- source;
- lifecycle status.

### `ConceptAlias`

Нужен для импортов и разных обозначений:

- LGA3647;
- FCLGA3647;
- Socket P.

Alias не создаёт новый технический объект, а указывает на один canonical concept.

## Типизированные связи

Добавь:

### `RelationTypeDefinition`

Поддержи как минимум:

- `requires`;
- `provides`;
- `consumes`;
- `accepts`;
- `supports`;
- `converts_to`;
- `conflicts_with`;
- `qualified_for`;
- `enables`;
- `replaces`;
- `member_of`.

Для relation type храни:

- allowed source entity/concept types;
- allowed target entity/concept types;
- inverse relation;
- quantity support;
- conditional support;
- engine mapping;
- validator key;
- status: informational/engine_mapped/unmapped/deprecated.

### `TechnologyRelation`

Поля:

- source entity/concept;
- relation type;
- target entity/concept;
- quantity;
- unit;
- conditions;
- source reference;
- confidence/review;
- inherited from;
- enabled;
- schema version.

Примеры:

```text
CPU Xeon Gold 6248R
REQUIRES
Socket FCLGA3647
```

```text
Server Capability Profile
PROVIDES
2 × Socket FCLGA3647
```

```text
LFF-to-SFF Adapter
CONVERTS_TO
1 × LFF Bay → 1 × SFF Bay
```

Не связывай каждый CPU вручную с каждым server model. CPU и server должны ссылаться на общий canonical socket/platform concept.

## Technology Platform и Vendor Generation Template

Добавь:

### `TechnologyPlatform`

Vendor-neutral или architecture-level слой:

- Intel Xeon Scalable 2nd Gen platform;
- Intel Xeon Scalable 4th Gen platform;
- AMD EPYC platform;
- другая будущая платформа.

Хранит:

- supported sockets;
- processor generation/families;
- memory technologies/module types;
- PCIe/interconnect generation;
- общие properties;
- общие candidate packs.

### `VendorGenerationTemplate`

Примеры:

- Dell PowerEdge 14G Intel;
- Dell PowerEdge 16G Intel;
- HPE ProLiant Gen10 Intel;
- HPE ProLiant Gen11 Intel.

Поля:

- vendor;
- generation label;
- architecture variant;
- parent TechnologyPlatform;
- inherited properties;
- default pack assignments;
- vendor-specific pack assignments;
- default option-group templates;
- source/review/version.

Поколение не должно быть enum в коде.

## Иерархия наследования

Поддержи:

```text
global
→ TechnologyPlatform
→ VendorGenerationTemplate
→ ServerFamily
→ ServerModel
→ ChassisVariant / ServerStorageOption
```

Правила:

1. Нижний уровень может override/disable inherited property или assignment.
2. Каждое итоговое значение возвращает provenance.
3. Удаление inherited pack на модели оформляется explicit exclusion, а не копированием всех данных.
4. Один общий CPU/RAM pack может назначаться Dell и HPE через общий TechnologyPlatform.
5. Vendor-specific RAID, riser, rails или management pack может назначаться на VendorGenerationTemplate.
6. Storage-specific drive packs назначаются или предлагаются на уровне ServerStorageOption.

## Scoped Pack Assignment

Обобщи назначения pack так, чтобы scope мог быть:

- technology platform;
- vendor generation;
- server family;
- server model;
- chassis variant;
- storage option.

Assignment хранит:

- scope type/id;
- pack id;
- enabled;
- priority;
- inheritance behavior;
- exclusions;
- overrides;
- assignment source;
- source reference.

Pack, назначенный поколению, является массовым candidate source. Точная совместимость всё равно проверяется через properties, concepts, relations, Capability Profile и validators.

## Property and Relation Coverage

Подготовь backend service, который рассчитывает:

- properties without usage;
- compatibility properties without mapping;
- relation types without validator;
- concepts without consumers/providers;
- packs without compatible scope;
- scopes with unresolved inherited conflicts;
- duplicate concepts/aliases;
- deprecated properties still used in published entities.

Результаты должны быть доступны для Admin и Publishing Assistant.

## Контракты, необходимые будущим Admin Wizards

На этом этапе создай только устойчивые data contracts, а не поведение интерфейса.

### `CreationWizardSession`

Хранит идентификатор сессии, owner, current step, draft payload, mode hint, timestamps и status. Не реализуй UI transitions, confirmation text или автогенерацию данных.

### `DraftDependencyNode`

Хранит dependency graph незавершённых сущностей: node type, requested identity, parent node, resolution status, resolved entity id, error и provenance.

### `CreationManifest`

Опиши версионируемый контракт preview результата: planned creates, updates, links, assignments, warnings, blockers и publication actions. Сам apply workflow принадлежит этапам 06–07.

### `PropertyAssignment`

Поддерживает direct/inherited values, override, disable, provenance, confidence и unresolved draft state.

### `PropertyLinkRequirement`

Точно описывает, какой property/concept/relation/validator mapping отсутствует и почему entity нельзя публиковать.

Не определяй здесь:

- три режима Wizard;
- тексты подтверждений;
- переключение UI mode;
- Create-and-Return interaction;
- recovery UX;
- bulk apply behavior.

## Stage-specific Definition of Done

- Параметры имеют явный статус.
- Pack не считается совместимостью.
- Server имеет явные pack assignments.
- GPU и boot storage поддерживаются.
- StorageTopology отделена от pack.
- Корзины моделируются через `StorageCageDefinition`, `BackplaneVariant` и `ServerStorageOption`.
- Optional-категории используют реальное состояние «Без опции».
- Уникальные детали назначаются через `ServerModelComponentAssignment`.
- Legacy data сохранены migration/backfill adapter.
- Один Property Registry обслуживает server, component, generation и topology.
- TechnologyConcept и typed relations позволяют добавлять новые понятия как данные.
- VendorGenerationTemplate наследует свойства и candidate packs с provenance.
- Coverage Service обнаруживает unmapped compatibility properties.
- Созданы только data contracts для Wizard session/dependency graph/manifest; UI behavior не реализован.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- entity/relationship diagram;
- migration/backfill matrix;
- legacy-to-canonical mapping;
- invariant tests;
- примеры direct assignment, pack assignment, inheritance и unresolved property.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
