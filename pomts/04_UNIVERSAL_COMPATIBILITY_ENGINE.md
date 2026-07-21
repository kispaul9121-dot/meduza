# Этап 4. Universal Compatibility Engine

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `04`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-03-report.md`
- `OUTPUT_REPORT`: `reports/stage-04-report.md`
- `NEXT_STAGE`: `05`


## Skills

- `building-with-medusa` — module service, workflows и API implementation
- `domain-modeling` — исполнение domain contracts без их повторного создания
- `supabase-postgres-best-practices` — query plans, indexes и transaction boundaries
- `systematic-debugging` — root-cause analysis сложных rule failures
- `verification-before-completion` — determinism, side-effect-free modes и regression proof

## Ownership

Владеет candidate resolution, facts, relations, calculators, exception rules, validation modes и explainable result.

## Out of scope

- Admin Wizard implementation.
- Vendor import pipeline.
- Визуальная логика disabled options на storefront.
- Создание параллельных domain entities вместо contracts этапа 03.

## Цель

Перевести типовые проверки из HPE-specific условий в generic calculators.

## Работы

1. Создай validator registry:
   CPU, memory, storage, RAID/HBA, expansion, network, accelerator/GPU, boot storage, power, cooling.
2. Validator выбирается через type definition; не исполняй пользовательский JavaScript.
3. CPU:
   socket, generation, quantity, max sockets, TDP/cooling, qualification, multi-socket policy.
   Derived: DIMM slots, channels, memory limit, power, CPU-owned PCIe.
4. Memory:
   DDR generation, RDIMM/LRDIMM/3DS, mixing, quantity, slots by installed CPU, capacity, population, rank/load.
   Effective speed = min(server, CPU, module, population).
5. Storage:
   multiple zones/types, SFF/LFF, SAS/SATA/NVMe/M.2, topology, bays, cage/backplane/cables/controller, boot/data, conflicts.
   Не используй только первый drive/backplane.
6. RAID/HBA:
   slot, protocol, ports, max drives, RAID levels, cables, embedded/add-in.
7. Network:
   normalized `pcie_expansion` и `network_mezzanine`;
   exact HPE FlexibleLOM, Dell NDC, OCP 3.0 и vendor types.
8. GPU:
   PCIe, lanes, height, length, width, slots, quantity, TDP, auxiliary power, cables, cooling/fan kit, riser, CPU ownership, storage conflict.
   States: vendor_qualified, technically_compatible, unsupported.
9. Boot storage:
   M.2, BOSS, vendor boot controller, PCIe M.2; slot, RAID1, quantity и conflicts.
10. Исправь Rules Engine:
    model guard, component scope, require, auto-add, unknown actions, duplicate IDs/quantities, endpoint validation и trace/reason codes.
11. Generic options API возвращает available, disabled, reason codes, message, max quantity, effective specs, required bundles, conflicts, qualification, triggered rules.
12. Storefront не дублирует engine calculations.
13. Создай полноценную test matrix.

## Источники кандидатов конфигуратора

Compatibility Engine должен собирать options из нескольких источников:

1. assigned Component Packs;
2. direct `ServerModelComponentAssignment`;
3. active StorageTopology;
4. components/requirements из AssemblyBundle;
5. auto-added technical components;
6. explicit exception rules.

Для каждого option верни `source_type`:

- `pack`;
- `direct`;
- `topology`;
- `bundle`;
- `auto_added`;
- `built_in`.

Direct component проходит те же schema, applicability, resource и exception checks, что и pack item.

Поддержи `assignment_role`:

- optional choice показывается пользователю;
- required component проверяется при условии;
- default component выбирается по умолчанию;
- auto-added technical физически добавляется в configuration snapshot;
- enablement kit открывает новые options/resources;
- replacement option отключает/заменяет built-in resource.

Engine обязан предотвращать double inclusion, когда один component приходит одновременно из pack и direct assignment.

## Расчёт умной корзины

Engine должен рассчитывать storage capacity не только общим числом, но и по bay groups/zones.

Для каждого выбранного drive:

1. найти допустимую zone;
2. проверить native или accepted form factor;
3. проверить наличие adapter, если он требуется;
4. проверить protocol;
5. проверить backplane support и per-protocol bay limits;
6. проверить controller ports/lanes/cables;
7. занять конкретный bay resource;
8. проверить total и zone capacity;
9. вернуть placement trace.

Поддержи:

- один drive type в нескольких zones;
- mixed HDD/SSD;
- LFF bays с approved SFF adapters;
- частично NVMe-capable cage;
- rear/internal optional cages;
- несколько controllers;
- expander;
- replacement backplane.

Engine должен генерировать suggestion API для drive packs:

- compatible;
- compatible_with_adapter;
- technically_compatible;
- incompatible;
- reason codes.

## Семантика optional option groups

Engine должен обрабатывать `ConfiguratorOptionGroup`:

- `zero_or_one`: none или одна option;
- `exactly_one`: одна option обязательна;
- `zero_or_many`: none или несколько;
- `one_or_many`: минимум одна.

`none` является состоянием группы, а не component.

При выборе enablement component engine может:

- добавить resources;
- открыть child option group;
- изменить limits;
- потребовать bundle;
- скрыть конфликтующие options.

Configuration snapshot должен сохранять:

- explicit none для важных optional groups;
- выбранные components;
- auto-added technical components;
- source и validation trace.

## Разрешение свойств и наследования

До compatibility calculation создай deterministic resolver:

```text
global
→ TechnologyPlatform
→ VendorGenerationTemplate
→ ServerFamily
→ ServerModel
→ ChassisVariant / ServerStorageOption
```

Resolver возвращает для каждого property:

- effective value;
- source scope;
- inheritance chain;
- override/exclusion;
- schema version;
- conflict status.

При равном приоритете или противоречии не выбирай значение молча — возвращай blocker.

## Relation Graph Resolver

Engine должен обрабатывать только relation types со статусом `engine_mapped`.

Примеры:

- component `requires` socket;
- server `provides` socket;
- adapter `converts_to` bay resource;
- board `consumes` PCIe slot/lanes;
- board `provides` M.2 slots;
- kit `enables` GPU capability;
- component `conflicts_with` riser/topology.

Для каждой проверяемой связи верни trace:

- required relation;
- provider relation;
- quantities;
- conditions;
- validator;
- source documents;
- result/reason code.

Unmapped relation:

- может храниться и отображаться;
- не должна молча считаться compatibility evidence;
- если entity полагается на неё для публикации — blocker.

## Generation assignment semantics

Pack, назначенный TechnologyPlatform или VendorGenerationTemplate:

1. входит в candidate pool;
2. наследуется моделями;
3. может быть excluded/overridden;
4. не получает автоматический статус compatible.

После candidate resolution всегда проверяй:

- socket/platform;
- type/protocol/form factor;
- server limits;
- component-specific properties;
- qualification;
- resources/conflicts;
- exception rules.

## Dynamic Property Behavior

Для нового property:

- informational → только DTO/display;
- filterable/comparable → catalog/compare, но не engine;
- engine_mapped → участвует через fact mapping/validator;
- unmapped → warning или blocker в зависимости от `affects_compatibility`.

Никогда не интерпретируй неизвестное поле эвристически в production engine.

## Coverage validation API

Добавь API, которое возвращает:

- entity readiness;
- unresolved properties;
- unmapped relations;
- missing provider/consumer;
- unused concepts;
- inherited conflicts;
- validator gaps;
- affected configuration count.

Используй его в Admin Wizard, import review и Publishing Assistant.

## Контракт с Genius Wizard

Engine должен предоставлять Wizard incremental validation API.

Для любого draft шага возвращай:

- resolved properties;
- inherited provenance;
- missing definitions;
- missing values;
- missing concepts;
- missing relations;
- missing validators;
- unresolved conflicts;
- candidate packs;
- blockers/warnings;
- recommended next actions.

Поддержи partial draft mode:

- incomplete graph можно валидировать;
- неизвестные обязательные узлы возвращаются как `unresolved`, а не как runtime crash;
- partial draft никогда не считается compatible;
- production mode запрещает unresolved compatibility data.

## Property Assignment validation

Для каждого PropertyAssignment проверь:

1. definition существует;
2. scope разрешён;
3. value type/unit валидны;
4. concept value разрешён;
5. inheritance/override корректны;
6. compatibility mapping существует;
7. validator поддерживает fact;
8. required opposite relation/provider существует;
9. relation quantity/resources согласованы;
10. no contradiction with other effective properties.

Верни machine-readable repair suggestions для Wizard:

- create property definition;
- choose canonical concept;
- add alias;
- add relation;
- assign validator;
- change to informational;
- move assignment to platform/generation;
- exclude inherited pack;
- create exception rule.

Engine не должен автоматически выполнять repair.

## Side-effect-free validation для трёх режимов

Compatibility Engine и Readiness Service не должны создавать или изменять данные.

Поддержи режимы вызова:

- `guided_check`;
- `assisted_preview`;
- `bulk_dry_run`;
- `production_validation`.

### guided_check

Возвращает одну следующую проблему и понятные repair choices.

### assisted_preview

Возвращает suggestions, proposed mappings и predicted effects, но не записывает их.

### bulk_dry_run

Валидирует весь Creation Manifest:

- dependency order;
- duplicate identities;
- schema validity;
- relation validity;
- inheritance result;
- candidate packs;
- impact;
- expected blockers after apply;
- idempotency.

### production_validation

Проверяет уже сохранённые данные перед публикацией.

Любая recommendation должна быть отделена от deterministic result.

## Stage-specific Definition of Done

- Обычный новый SKU не требует кода.
- Vendor policy отсутствует в core.
- Multiple storage zones работают.
- GPU/M.2 полноценны.
- Каждая блокировка объяснима.
- Direct components, bundles и topology участвуют в общем candidate/resource resolution.
- Нет duplicate option при пересечении pack и direct assignment.
- Storage capacity рассчитывается по zones/bays/adapters/protocols, а не одной цифрой.
- Option groups корректно поддерживают «Без опции», количество и child groups.
- Inheritance resolver возвращает provenance и не скрывает конфликты.
- Typed relations проходят через mapped validators.
- Generation pack assignment остаётся candidate scope, а не доказательством совместимости.
- Unmapped compatibility property/relation блокирует публикацию.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- rule-resolution trace examples;
- determinism/idempotency tests;
- tests всех operators/scopes/actions;
- performance/query evidence;
- contracts `guided_check`, `assisted_preview`, `bulk_dry_run`, `production_validation`.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
