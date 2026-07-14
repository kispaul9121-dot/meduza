# Medusa / Payloud Server Store Report

Дата: 2026-07-10  
Проект: `D:\Meduza site`

## 1. Статус

Создан новый ecommerce-проект на Medusa v2 с Next.js storefront для конфигуратора серверов HPE ProLiant DL360 Gen10. Старый проект `pauloud 2` использован как источник UI/UX, навигации, карточек, фильтров, подсказок и визуальных паттернов. Payload-логика из старого проекта не переносилась.

## 2. Версия Medusa

Medusa: `2.17.2`  
Пакеты backend `@medusajs/*` закреплены на `2.17.2`.

## 3. MCP

Medusa MCP подключить не удалось: в доступных MCP/tools Medusa-сервер не был найден. Использовались локальные skills и официальная документация Medusa:

- `create-medusa-app`: https://docs.medusajs.com/resources/create-medusa-app
- Installation: https://docs.medusajs.com/learn/installation

## 4. Skills

Skills удалось использовать:

- `building-with-medusa` для backend module, models, migrations, API routes.
- `building-storefronts` для Medusa SDK integration через `sdk.client.fetch()`.
- `storefront-best-practices` для ecommerce UI, навигации, фильтров, карточек, доступности.
- `building-admin-dashboard-customizations` для Medusa Admin route shell.
- `pdf` для чтения HPE PDF/QuickSpecs.

## 5. Структура проекта

```text
D:\Meduza site
├─ apps
│  ├─ backend
│  │  ├─ src\api\admin\server-configurator
│  │  ├─ src\api\store\server-configurator
│  │  ├─ src\admin\routes\server-configurator
│  │  ├─ src\modules\server-configurator
│  │  └─ src\migration-scripts\initial-data-seed.ts
│  └─ storefront
│     ├─ src\app\servers
│     ├─ src\lib\server-configurator
│     ├─ src\modules\server-configurator
│     └─ src\styles\globals.css
└─ PROJECT_REPORT.md
```

## 6. Основные созданные файлы

Backend:

- `apps/backend/src/modules/server-configurator/models/server-model.ts`
- `apps/backend/src/modules/server-configurator/models/component.ts`
- `apps/backend/src/modules/server-configurator/models/compatibility-rule.ts`
- `apps/backend/src/modules/server-configurator/models/configuration.ts`
- `apps/backend/src/modules/server-configurator/models/configuration-item.ts`
- `apps/backend/src/modules/server-configurator/models/rule-preset.ts`
- `apps/backend/src/modules/server-configurator/models/help-annotation.ts`
- `apps/backend/src/modules/server-configurator/service.ts`
- `apps/backend/src/modules/server-configurator/migrations/Migration20260710134720.ts`
- `apps/backend/src/modules/server-configurator/migrations/Migration20260710143632.ts`

Storefront:

- `apps/storefront/src/app/servers/page.tsx`
- `apps/storefront/src/app/servers/[slug]/page.tsx`
- `apps/storefront/src/lib/server-configurator/data.ts`
- `apps/storefront/src/lib/server-configurator/format.ts`
- `apps/storefront/src/modules/server-configurator/server-header.tsx`
- `apps/storefront/src/modules/server-configurator/catalog-client.tsx`
- `apps/storefront/src/modules/server-configurator/product-card.tsx`
- `apps/storefront/src/modules/server-configurator/configurator-client.tsx`
- `apps/storefront/src/modules/server-configurator/configurator-overview.tsx`
- `apps/storefront/src/modules/server-configurator/help-popover.tsx`
- `apps/storefront/src/modules/server-configurator/server-illustration.tsx`

## 7. Store API routes

- `GET /store/server-configurator/models`
- `GET /store/server-configurator/models/:slug`
- `GET /store/server-configurator/models/:slug/options`
- `GET /store/server-configurator/help-annotations`
- `POST /store/server-configurator/validate`
- `POST /store/server-configurator/price`
- `POST /store/server-configurator/save`
- `POST /store/server-configurator/add-to-cart`

## 8. Admin API routes

- `GET/POST /admin/server-configurator/models`
- `GET/POST/DELETE /admin/server-configurator/models/:id`
- `GET/POST /admin/server-configurator/components`
- `GET/POST/DELETE /admin/server-configurator/components/:id`
- `GET/POST /admin/server-configurator/rules`
- `GET/POST/DELETE /admin/server-configurator/rules/:id`
- `GET/POST /admin/server-configurator/rule-presets`
- `GET/POST /admin/server-configurator/help-annotations`
- `GET/POST/DELETE /admin/server-configurator/help-annotations/:id`
- `POST /admin/server-configurator/simulate`
- `POST /admin/server-configurator/import/hpe-docs`
- `POST /admin/server-configurator/import/csv`
- `GET /admin/server-configurator/export/csv`

## 9. Admin UI routes

- `/app/server-configurator`
- `/app/server-configurator/models`
- `/app/server-configurator/components`
- `/app/server-configurator/rules`
- `/app/server-configurator/rule-presets`
- `/app/server-configurator/simulator`
- `/app/server-configurator/import-export`
- `/app/server-configurator/source-docs`

## 10. Созданные товары

В Medusa созданы 4 товара:

1. `HPE ProLiant DL360 Gen10 8SFF`  
   Handle: `hpe-proliant-dl360-gen10-8sff`
2. `HPE ProLiant DL360 Gen10 8SFF + Front Drive Option`  
   Handle: `hpe-proliant-dl360-gen10-8sff-front-drive-option`
3. `HPE ProLiant DL360 Gen10 10SFF NVMe Premium`  
   Handle: `hpe-proliant-dl360-gen10-10sff-nvme-premium`
4. `HPE ProLiant DL360 Gen10 4LFF`  
   Handle: `hpe-proliant-dl360-gen10-4lff`

Каждый товар связан с записью `server_model` через `medusa_product_id` и `medusa_variant_id`.

## 11. Configuration snapshot

Configuration snapshot сохраняется через custom module:

- `configuration` хранит серверную модель, статус, цену, snapshot JSON, customer/email/cart/order references.
- `configuration_item` хранит выбранные компоненты, количество, unit price и snapshot компонента.
- `POST /store/server-configurator/save` валидирует выбранные компоненты и сохраняет snapshot.
- `POST /store/server-configurator/add-to-cart` сейчас валидирует и возвращает payload для cart line item с `configuration_id` и snapshot metadata.

Ограничение: полноценная Medusa cart mutation еще не завершена. Следующий этап: подключить реальный cart workflow и order snapshot persistence.

## 12. Rules Engine

Rules Engine находится в `apps/backend/src/modules/server-configurator/service.ts`.

Работа:

- Собирает facts из `server_model` и выбранных `component`.
- Загружает enabled `compatibility_rule`.
- Фильтрует правила по scope: `global`, `brand`, `generation`, `family`, `server_model`, `chassis_variant`.
- Поддерживает условия `and/or`, `equals`, `not_equals`, `greater_than`, `less_than`, `includes`, `exists`.
- Поддерживает эффекты `block`, `warning`, `require`, `auto_add`, `set_limit`, `set_effective_value`, `add_price`, `multiply_price`.
- Возвращает `valid`, `errors`, `warnings`, `effective_specs`, `total_price`, `triggered_rules`.

Проверенный пример: при 1 CPU и 16 RAM modules backend возвращает ошибку “При одном процессоре доступно максимум 12 модулей памяти.”

## 13. Навигация из `pauloud 2`

Перенесено:

- Topbar: “Поставка серверов под проекты / Москва и регионы / support@payloud.ru”.
- Header main: brand `Payloud`, кнопка `Меню`, search, compare/favorite/cart, `Получить КП`.
- Main nav row: `Главная`, `Каталог`, `Конфигуратор`, `Готовые решения`, `Комплектующие`, `СХД`, `Сервис и SLA`.
- Mega menu style из `HeaderCatalogDropdown.jsx`.
- Иконки через `lucide-react`.
- Подсказка меню берется из backend `help_annotation`.

Отличие: пункты mega menu привязаны к текущим данным Medusa (`server_model`) и текущим разделам storefront. Полный старый каталог Payloud еще не перенесен как отдельные Medusa product/category entities.

## 14. Карточки из `pauloud 2`

Перенесено:

- Серверная иллюстрация/rack placeholder.
- Карточка с status, price, title, description, specs.
- Quick actions: favorite, compare.
- CTA `Сконфигурировать`.
- Cart icon button “Добавить в корзину”.
- Payloud blue/button style and 8px radius.

Отличие: сейчас карточки показывают 4 HPE DL360 модели из Medusa backend. Старые Dell/HPE/Storage карточки из Payloud пока не заведены как товары в Medusa.

## 15. Фильтры из `pauloud 2`

Перенесено:

- Sidebar `Подбор параметров`.
- Кнопка `Все фильтры` с иконкой и счетчиком.
- Reset button.
- Active filter chips.
- Modal “Все фильтры”.
- Facets строятся из backend данных `server_model`: бренд, поколение, форм-фактор, корзина, отсеки, интерфейсы, CPU socket, RAM, PSU.
- Подсказка фильтров берется из backend `help_annotation`.

Ограничение: фильтры пока client-side поверх списка моделей. Следующий этап: backend filtering/pagination endpoint для большого каталога.

## 16. Подсказки / аннотации

Создана таблица `help_annotation`, 11 записей в текущей БД:

- `configurator.storage_scenario`
- `configurator.cpu`
- `configurator.ram`
- `configurator.drive`
- `configurator.raid`
- `configurator.nic`
- `configurator.psu`
- `configurator.backplane`
- `configurator.summary_health`
- `catalog.filters`
- `header.catalog_menu`

Storefront получает их через:

- `GET /store/server-configurator/help-annotations?page=configurator&slug=...`
- `GET /store/server-configurator/help-annotations?page=catalog`

UI использует `HelpPopover`, поэтому подсказки работают через backend/DB, а не только из JSX.

## 17. Сравнение с `pauloud 2`

Что уже близко:

- Визуальная шапка, topbar, nav row, меню-каталог.
- Карточки серверов и кнопки действий.
- Фильтры, все фильтры, active chips.
- Overview блока конфигуратора.
- Подсказки у этапов конфигурации.
- Summary health popover.
- Сценарии корзины для DL360 chassis variants.
- Шрифты Inter + Onest и Payloud color tokens.

Что в `pauloud 2` было умнее:

- Больше моделей и товарных групп: Dell, HPE DL380, Tower, storage, network.
- Более глубокие diagnostic popovers на уровне каждой опции.
- Более сложные storage/media bay сценарии.
- Более богатая логика фильтров и старые catalog groups.
- Более полный cart/quote flow.

Что в Medusa лучше подготовлено:

- Есть нормальная БД PostgreSQL.
- Есть custom module для серверных моделей, компонентов, правил и snapshots.
- Есть API routes для storefront/admin.
- Есть seedable schema и migrations.
- Rules Engine уже живет на backend, а не только в UI.

## 18. Что осталось на следующий этап

1. Перенести полный каталог Payloud: Dell, DL380, Tower, storage, network, components.
2. Сделать backend filtering/pagination для `/store/server-configurator/models`.
3. Завести все старые Payloud annotations/diagnostics как `help_annotation` или rule diagnostics.
4. Доработать option-level diagnostic popovers: disabled/recommended/required states.
5. Реализовать полноценный Medusa cart workflow для configured server.
6. Сохранять configuration snapshot в order line metadata после checkout.
7. Расширить Admin UI: visual rule builder без JSON-полей.
8. Довести CSV/HPE PDF import routes до реального импорта.
9. Добавить B2B price lists/customer groups/tiered pricing.
10. Привести валюту/формат цен к RUB, если магазин должен работать в рублях.

## 19. Проверки

Выполнено:

- `npx medusa db:generate serverConfigurator`
- `npx medusa db:migrate`
- `npx tsc --noEmit` в backend
- `npx tsc --noEmit` в storefront
- `npm run build` в backend
- `npm run build` в storefront
- HTTP `200` для `/servers`
- HTTP `200` для `/servers/hpe-proliant-dl360-gen10-8sff`
- Store API подсказок возвращает данные из БД.

Предупреждения:

- Medusa build пишет `redisUrl not found`, используется fake Redis. Для production нужен Redis.
- Medusa CLI пишет, что lint skipped, несмотря на установленный eslint в workspace. Сборка и TypeScript проходят.
- Есть npm audit warnings в starter dependencies.
