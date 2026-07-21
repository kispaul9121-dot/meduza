# Этап 14. Multibrand and Future-Generation Proof

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `14`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-13-report.md`
- `OUTPUT_REPORT`: `reports/stage-14-report.md`
- `NEXT_STAGE`: `15`


## Skills

- `building-with-medusa` — cross-module proof and workflows
- `domain-modeling` — vendor-neutral invariants
- `supabase-postgres-best-practices` — data isolation/query behavior
- `systematic-debugging` — cross-vendor regressions
- `verification-before-completion` — independent proof scenarios
- `frontend-testing-debugging` — end-to-end Admin/storefront proof

## Ownership

Владеет доказательством, что architecture работает для HPE, Dell и неизвестного будущего поколения без vendor-specific core.

## Out of scope

- Новые vendor-specific branches в generic engine.
- Полный import production rollout.
- Visual redesign.

## Цель

Доказать, что архитектура работает для Dell без копирования HPE engine.

## Работы

1. Реализуй/проверь inheritance:
   `global → vendor → generation/platform → model → chassis variant`.
2. HPE DL360 Gen10 и Dell R640 используют общие:
   - Xeon Scalable 1st Gen;
   - Xeon Scalable 2nd Gen;
   - DDR4 packs;
   - common SAS/SATA/NVMe drives;
   - common PCIe NIC;
   - часть GPU.
3. Не создавай копии одного CPU/RAM/drive/NIC SKU.
4. Dell-specific:
   NDC, PERC, BOSS/boot, risers, PSU/cooling, StorageTopology, bundles/cables, exceptions.
5. HPE-specific:
   FlexibleLOM, Smart Array, Media Bay, risers, topologies, boot options.
6. Удали HPE policy из generic endpoints.
7. GPU proof:
   минимум один vendor-qualified и один technically-compatible 1U scenario там, где данные это позволяют.
8. Storage proof:
   SFF, hybrid NVMe, LFF, optional/internal cage.
9. Одна shared test suite:
   CPU, memory, storage, RAID, mezzanine, PCIe NIC, GPU, boot, cart.
10. Создай `docs/onboarding/new-server-brand.md` для Lenovo, Supermicro, Inspur и Huawei.
11. Зафиксируй no-code boundary:
    новые экземпляры известных types добавляются через Admin/import;
    код меняется только для нового физического class/validator.

## Проверка platform/generation inheritance

На реальных проверяемых данных докажи:

1. Общий TechnologyPlatform назначает shared CPU/RAM packs.
2. Dell и HPE VendorGenerationTemplate наследуют общую платформу.
3. Vendor-specific packs назначаются на generation, family или model.
4. Chassis/storage packs не распространяются на неподходящие варианты.
5. Admin показывает provenance каждого pack/property.

## Future-generation test fixture

Создай только непубликуемый test fixture, а не фиктивный коммерческий товар.

Через Admin/API без правки core кода проверь:

- создание нового VendorGenerationTemplate;
- создание нового socket concept;
- создание новой memory speed;
- создание нового drive form factor;
- создание informational future property;
- создание compatibility property без mapping;
- назначение shared pack поколению;
- наследование новой server model.

Ожидаемые результаты:

- новые значения существующих concept types работают как data;
- informational property отображается;
- compatibility property без mapping создаёт blocker;
- pack поколения появляется как candidate;
- точная несовместимость всё равно блокируется engine;
- provenance показывает platform/generation/model.

## Property/Relation coverage test

Добавь тесты:

- property unused warning;
- property missing validator blocker;
- relation missing provider;
- duplicate alias resolution;
- inherited conflict;
- model override;
- pack exclusion;
- revalidation after relation change.

## End-to-end Bootstrap Wizard proof

Создай непубликуемый test scenario, где отсутствуют:

- generation;
- platform;
- socket concept;
- one compatibility property;
- CPU pack;
- memory pack;
- one storage concept.

Пройди полный Genius Wizard без ручного SQL/JSON:

1. discovery;
2. dependency plan;
3. nested property creation;
4. concept creation;
5. relation creation;
6. platform;
7. generation;
8. packs;
9. server;
10. storage;
11. option groups;
12. product link;
13. simulation;
14. publication blocker for intentionally unmapped property;
15. repair mapping;
16. successful readiness.

Докажи:

- draft survives nested wizard navigation;
- no orphan records;
- provenance preserved;
- duplicate concept avoided;
- unresolved property blocks publish;
- after repair readiness changes deterministically;
- reusable template is offered at completion.

## Проверка трёх режимов Wizard

Прогони один и тот же bootstrap scenario:

### Guided Manual

- каждое создание требует отдельной кнопки;
- Wizard объясняет следующий шаг;
- без подтверждения никаких записей нет.

### Assisted Draft

- формы предварительно заполнены;
- suggestions имеют статусы;
- rejected proposal не применяется;
- confirmed proposal сохраняется только после действия пользователя.

### Bulk Apply

- создаётся manifest;
- dry-run не изменяет БД;
- применяются только approved groups;
- повторное применение идемпотентно;
- публикация не выполняется.

Проверь переключения между всеми режимами без потери draft и контекста.

## Stage-specific Definition of Done

- Dell работает на том же generic core.
- Shared packs реально общие.
- Vendor-specific находится в data/adapters/exceptions.
- Runbook создан.
- Platform/generation inheritance доказано на shared packs.
- Новая generation и новые concept values создаются без core changes.
- Unmapped compatibility property корректно блокируется.
- Future-generation fixture не публикует выдуманные коммерческие данные.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- HPE and Dell equivalent scenarios;
- unknown future generation;
- inheritance/override/provenance evidence;
- Wizard and storefront proof.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
