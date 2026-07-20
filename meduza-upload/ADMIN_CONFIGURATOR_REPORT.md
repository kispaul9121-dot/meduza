# Server Configurator Admin Report

Дата: 2026-07-13
Проект: `D:\Meduza site`

## Итог

Сделан backend-driven Admin раздел `Server Configurator` для управления серверными моделями, комплектующими, applicability, rules, rule presets, help annotations и Rule Simulator. Storefront не переписывался и остается потребителем Store API.

## Версия Medusa

Medusa: `2.17.2`

## MCP и skills

Medusa MCP: добавлен после основной реализации.

- Codex config: `C:\Users\kampo\.codex\config.toml`
- VS Code config: `.vscode/mcp.json`
- MCP URL: `https://docs.medusajs.com/mcp`

Текущий Codex session не подхватил новый MCP без перезапуска/refresh, поэтому callable Medusa MCP tools в этом session еще не появились. По официальной документации Medusa MCP требует Medusa Cloud OAuth или Personal Access Key. Детали подключения и проверки вынесены в `MEDUSA_MCP_CONNECTION_REPORT.md`.

Fallback: использованы локальные Codex skills и официальная документация Medusa:

- Admin UI Routes: https://docs.medusajs.com/learn/fundamentals/admin/ui-routes
- Admin routing customizations: https://docs.medusajs.com/learn/fundamentals/admin/routing
- API routes: https://docs.medusajs.com/learn/fundamentals/api-routes

Skills использованы:

- `building-with-medusa`
- `building-admin-dashboard-customizations`
- `building-storefronts`
- `storefront-best-practices`

Skill `medusa-dev` в текущем списке skills отсутствовал.

## Структура проекта

- `apps/backend`: Medusa backend, custom module `server-configurator`, Admin API, Store API, Admin UI routes.
- `apps/backend/src/modules/server-configurator`: domain data models and Rules Engine service.
- `apps/backend/src/api/admin/server-configurator`: Admin API для CRUD и review/simulator workflows.
- `apps/backend/src/api/store/server-configurator`: публичный Store API для storefront.
- `apps/backend/src/admin/routes/server-configurator`: Medusa Admin UI pages.
- `apps/storefront`: Next storefront. В этой задаче storefront runtime не переписывался.

## Созданные файлы

- `apps/backend/src/modules/server-configurator/applicability.ts`
- `apps/backend/src/api/admin/server-configurator/applicability/route.ts`
- `apps/backend/src/api/admin/server-configurator/models/[id]/duplicate/route.ts`
- `apps/backend/src/api/admin/server-configurator/components/[id]/duplicate/route.ts`
- `apps/backend/src/api/admin/server-configurator/components/[id]/applicability/route.ts`
- `apps/backend/src/api/admin/server-configurator/rules/[id]/duplicate/route.ts`
- `apps/backend/src/api/admin/server-configurator/rule-presets/[id]/route.ts`
- `apps/backend/src/api/admin/server-configurator/rule-presets/[id]/duplicate/route.ts`
- `apps/backend/src/api/admin/server-configurator/rule-presets/[id]/create-rule/route.ts`
- `apps/backend/src/admin/routes/server-configurator/_shared/types.ts`
- `apps/backend/src/admin/routes/server-configurator/_shared/api.ts`
- `apps/backend/src/admin/routes/server-configurator/_shared/form.tsx`
- `apps/backend/src/admin/routes/server-configurator/components/specs-editor.tsx`
- `apps/backend/src/admin/routes/server-configurator/applicability/page.tsx`
- `apps/backend/src/admin/routes/server-configurator/help-annotations/page.tsx`
- `ADMIN_CONFIGURATOR_REPORT.md`

## Доработанные файлы

- `apps/backend/src/modules/server-configurator/service.ts`
- `apps/backend/src/api/store/server-configurator/models/[slug]/options/route.ts`
- `apps/backend/src/api/admin/server-configurator/models/route.ts`
- `apps/backend/src/api/admin/server-configurator/components/route.ts`
- `apps/backend/src/api/admin/server-configurator/rules/route.ts`
- `apps/backend/src/api/admin/server-configurator/rule-presets/route.ts`
- `apps/backend/src/api/admin/server-configurator/help-annotations/route.ts`
- `apps/backend/src/api/admin/server-configurator/help-annotations/[id]/route.ts`
- `apps/backend/src/admin/routes/server-configurator/page.tsx`
- `apps/backend/src/admin/routes/server-configurator/models/page.tsx`
- `apps/backend/src/admin/routes/server-configurator/components/page.tsx`
- `apps/backend/src/admin/routes/server-configurator/rules/page.tsx`
- `apps/backend/src/admin/routes/server-configurator/rule-presets/page.tsx`
- `apps/backend/src/admin/routes/server-configurator/simulator/page.tsx`

## Admin API routes

Существующие и добавленные routes:

- `GET/POST /admin/server-configurator/models`
- `GET/POST/DELETE /admin/server-configurator/models/:id`
- `POST /admin/server-configurator/models/:id/duplicate`
- `GET/POST /admin/server-configurator/components`
- `GET/POST/DELETE /admin/server-configurator/components/:id`
- `POST /admin/server-configurator/components/:id/duplicate`
- `POST /admin/server-configurator/components/:id/applicability`
- `GET /admin/server-configurator/applicability`
- `GET/POST /admin/server-configurator/rules`
- `GET/POST/DELETE /admin/server-configurator/rules/:id`
- `POST /admin/server-configurator/rules/:id/duplicate`
- `POST /admin/server-configurator/rules/:id/review`
- `POST /admin/server-configurator/rules/:id/enable-with-confirmation`
- `GET/POST /admin/server-configurator/rule-presets`
- `GET/POST/DELETE /admin/server-configurator/rule-presets/:id`
- `POST /admin/server-configurator/rule-presets/:id/duplicate`
- `POST /admin/server-configurator/rule-presets/:id/create-rule`
- `GET/POST /admin/server-configurator/help-annotations`
- `GET/POST/DELETE /admin/server-configurator/help-annotations/:id`
- `POST /admin/server-configurator/simulate`
- `GET /admin/server-configurator/source-of-truth`
- import-review/export/import routes from previous stage remain available.

Medusa convention uses `POST` for mutations. Therefore requested `PUT/PATCH` operations are implemented as Medusa-style `POST` mutation endpoints.

## Admin UI routes

- `/app/server-configurator`
- `/app/server-configurator/models`
- `/app/server-configurator/components`
- `/app/server-configurator/applicability`
- `/app/server-configurator/rules`
- `/app/server-configurator/rule-presets`
- `/app/server-configurator/help-annotations`
- `/app/server-configurator/simulator`
- `/app/server-configurator/source-of-truth`
- `/app/server-configurator/import-review`

Existing routes also remain:

- `/app/server-configurator/import-export`
- `/app/server-configurator/source-docs`

## Список 4 созданных товаров / server models

В Medusa DB сейчас 4 server models, связанные с Medusa product/variant:

1. `HPE ProLiant DL360 Gen10 10SFF NVMe Premium`
   - slug: `hpe-proliant-dl360-gen10-10sff-nvme-premium`
2. `HPE ProLiant DL360 Gen10 4LFF`
   - slug: `hpe-proliant-dl360-gen10-4lff`
3. `HPE ProLiant DL360 Gen10 8SFF`
   - slug: `hpe-proliant-dl360-gen10-8sff`
4. `HPE ProLiant DL360 Gen10 8SFF + Front Drive Option`
   - slug: `hpe-proliant-dl360-gen10-8sff-front-drive-option`

Текущие counts:

- server models: 4
- components: 98
- help annotations: 49
- enabled rules: 10
- disabled/draft rules: 26
- rule presets: 19

## Configuration snapshot

Configuration snapshot в этой задаче не трогался по ограничению пользователя: `Не трогай cart/add-to-cart/order snapshot`.

Существующая модель `configuration` продолжает хранить:

- `server_model_id`
- `medusa_cart_id`
- `medusa_line_item_id`
- `status`
- `total_price`
- `effective_specs_json`
- `warnings_json`
- `errors_json`
- `snapshot_json`
- `hash`

## Rules Engine

Rules Engine находится в `apps/backend/src/modules/server-configurator/service.ts`.

Как работает:

1. Принимает `server_model_slug` или `server_model_id` и `selected_components`.
2. Загружает server model и выбранные components из Medusa DB.
3. Собирает facts:
   - `cpu_qty`
   - `cpu_tdp`
   - `cpu_max_memory_speed`
   - `ram_speed`
   - `ram_modules`
   - `selected_drive_interface`
   - `backplane_interfaces`
   - `drive_qty`
   - `nic_qty`
   - `nic_flexiblelom_qty`
   - `nic_pcie_qty`
   - `total_estimated_power`
4. Применяет built-in storage/NIC validation.
5. Применяет enabled compatibility rules по scope:
   - global
   - brand
   - generation
   - family
   - server_model
   - chassis_variant
6. Возвращает:
   - `valid`
   - `errors`
   - `warnings`
   - `effective_specs`
   - `required_components`
   - `auto_added_components`
   - `total_price`
   - `triggered_rules`
   - `facts`

## Навигация из Payloud 2

Навигация Payloud 2 была перенесена на storefront ранее. В этой задаче storefront navigation не менялась, чтобы не сломать публичные страницы.

Admin navigation теперь содержит отдельный Medusa Admin раздел `Server Configurator` с маршрутами для моделей, комплектующих, правил, подсказок, simulator и source-of-truth.

## Карточки из Payloud 2

Карточки storefront из Payloud 2 в этой задаче не переписывались. Backend продолжает отдавать модели и компоненты через Store API, а текущие cards остаются потребителями данных.

Новая Admin UI часть использует Medusa UI tables/forms, а не Payloud cards, потому что это внутренний admin workflow.

## Фильтры из Payloud 2

Storefront catalog filters остались backend-owned через `/store/server-configurator/catalog-facets`.

В Admin добавлены фильтры:

- models: `brand`, `family`, `generation`, `model`, `chassis_type`, `form_factor`, `enabled`, search.
- components: `type`, `brand`, `enabled`, `source_doc_reference`, `logical_group`, `vendor_platform`, `slot_type`, `interface`, `form_factor`, search.
- rules: `enabled`, `draft`, `category`, `rule_type`, `scope_type`.
- help annotations: `page`, `key`, `severity`, `source_doc_reference`, search.
- rule presets: `category`.

## Applicability

Applicability реализован безопасно через `specs_json.applicability`, без новой migration:

```json
{
  "applicability": {
    "brands": ["HPE"],
    "families": ["DL360"],
    "generations": ["Gen10"],
    "server_model_slugs": ["hpe-proliant-dl360-gen10-8sff"],
    "chassis_types": ["8SFF"],
    "exclude_server_model_slugs": []
  }
}
```

Store API `/options` теперь учитывает:

- `enabled = true`
- include applicability
- exclude applicability
- legacy source slug fields
- текущие specs/rules filters

## Dell R640 readiness

Текущая схема уже поддерживает:

- Dell PERC/HBA/BOSS как `type=raid` с `specs_json.vendor`, `controller_family`, `placement`, `vendor_platform`.
- Dell NDC/PCIe NIC через `type=nic` и `specs_json.slot_type = NDC | PCIe`.
- PCIe risers через `type=riser`.
- Dell backplane variants через `type=backplane`.
- отсутствие HPE Media Bay через applicability exclude/include.
- BOSS/M.2 boot path через RAID specs `placement=boss` и drive/backplane specs.

Recommended schema changes before Dell R640:

- Добавить first-class relation/table `component_model_applicability`.
- Добавить отдельный normalized `source_doc_reference` для components, а не только через `specs_json`.
- Добавить typed fact registry для Dell facts: `ndc_qty`, `boss_present`, `riser_profile`, `backplane_protocol`.
- Добавить migration только после утверждения Dell scope.

## Проверка

Build:

- `npx tsc --noEmit --pretty false` в `apps/backend`: passed.
- `npm --workspace @dtc/backend run build`: passed.
- `npm --workspace @dtc/storefront run build`: passed. Во время SSG были warnings `fetch failed / EACCES`, но команда завершилась успешно.

Runtime:

- Backend запущен: `http://localhost:9000/app`
- Storefront запущен: `http://localhost:8000`

Store API:

- `GET /store/server-configurator/models`: 200
- `GET /store/server-configurator/models/:slug`: 200
- `GET /store/server-configurator/models/:slug/options`: 200, `source=db`
- `GET /store/server-configurator/catalog-facets`: 200
- `POST /store/server-configurator/validate`: 200

Storefront:

- `/servers`: 200
- `/servers/hpe-proliant-dl360-gen10-8sff`: 200
- `/servers/hpe-proliant-dl360-gen10-10sff-nvme-premium`: 200
- `/servers/hpe-proliant-dl360-gen10-4lff`: 200

HPE DL360 checks:

- `1 CPU + 13 RAM modules`: blocked.
- `base 8SFF + NVMe`: blocked.
- `NVMe Media Bay + 2 NVMe drives`: valid.
- `NVMe Media Bay + 3 NVMe drives`: blocked.
- `SAS/SATA Media Bay + 10 SAS/SATA drives`: valid.
- `FlexibleLOM qty 2`: blocked.
- `PCIe NIC qty 3`: blocked.
- `total NIC qty 4`: blocked.

## Что осталось на следующий этап

1. Сделать first-class applicability table `component_model_applicability`.
2. Добавить workflows для мутаций Admin API по строгому Medusa pattern Module -> Workflow -> API.
3. Добавить route-level Zod validation middleware.
4. Расширить Rule Builder до nested AND/OR groups.
5. Добавить нормальный large dataset picker для Medusa product/variant link.
6. Добавить полноценный Dell R640 import после утверждения schema changes.
7. Добавить automated integration tests для Admin API и Rules Engine.
8. Установить/настроить ESLint в backend project, чтобы `medusa lint` не пропускался.
