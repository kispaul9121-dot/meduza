# Инструкция: как вручную собирать конфигуратор сервера в Medusa backend

## Что сейчас уже есть

В проекте есть отдельный Medusa-модуль `server-configurator`. Он хранит:

- `server_model` - карточка серверной платформы: бренд, поколение, корзина, сокет, лимиты CPU/RAM/дисков.
- `component` - все выбираемые опции: CPU, RAM, drives, RAID, NIC, PSU, riser, backplane/media bay, rails, cable, cooling, service.
- `compatibility_rule` - правила совместимости: блокировки, лимиты, предупреждения, auto-add.
- `help_annotation` - подсказки в конфигураторе и каталоге.
- `configuration` и `configuration_item` - сохраненные конфигурации / КП.

Storefront берет данные не из статического JSON, а через Medusa Store API:

- `GET /store/server-configurator/models`
- `GET /store/server-configurator/models/:slug`
- `GET /store/server-configurator/models/:slug/options`
- `POST /store/server-configurator/validate`
- `POST /store/server-configurator/save`
- `POST /store/server-configurator/add-to-cart`

## Чего пока не хватает

Сейчас можно создавать Product в Medusa Admin, но полноценной админ-страницы "Конфигуратор сервера" с кнопками "добавить CPU / RAID / Media Bay / правило" еще нет. Поэтому вручную конфигуратор собирается через backend-данные: seed/import/API/DB. Если нужен именно путь "зайти в админку и нажимать", нужно следующим этапом сделать Medusa Admin extension для `server_model`, `component`, `compatibility_rule` и `help_annotation`.

Нужно добавить:

- CRUD-страницу в Medusa Admin для серверных моделей.
- CRUD-страницу компонентов с типами и `specs_json`.
- UI для привязки компонентов к конкретной модели или семейству.
- UI для правил совместимости.
- Импорт из CSV/XLSX, чтобы не забивать 200 опций руками.
- Хранилище ссылок на документацию и версий правил.

## Как собрать новый сервер вручную

1. Открой документацию конкретного сервера.

   Не копируй логику от HPE в Dell или наоборот. У каждой модели свои корзины, riser, контроллеры, NIC, PSU, cooling. Для примера Dell R640 используй официальные источники:

   - Dell PowerEdge R640 Technical Guide: https://i.dell.com/sites/csdocuments/shared-content_data-sheets_documents/en/us/poweredge-r640-technical-guide.pdf
   - Dell PowerEdge R640 Spec Sheet: https://i.dell.com/sites/csdocuments/product_docs/en/poweredge-r640-spec-sheet.pdf
   - Dell R640 Installation and Service Manual, expansion card guidelines: https://www.dell.com/support/manuals/en-us/oth-r640/per640_ism_pub/expansion-card-installation-guidelines

2. Создай товар в Medusa Admin.

   Открой Medusa Admin -> Products -> Create product.

   Заполни:

   - Title: `Dell PowerEdge R640 10SFF`
   - Handle: `dell-poweredge-r640-10sff`
   - Description: кратко, без длинного SEO-текста в карточке.
   - Thumbnail/images: фото или временный placeholder.
   - Variant: базовая цена, SKU, inventory.

   После сохранения возьми `medusa_product_id` и `medusa_variant_id`. Они нужны для связи с `server_model`.

3. Создай `server_model`.

   Для Dell R640 лучше делать отдельную модель на каждый chassis/storage variant:

   - `dell-poweredge-r640-8sff`
   - `dell-poweredge-r640-10sff`
   - `dell-poweredge-r640-4lff`

   Пример полей:

   ```json
   {
     "brand": "Dell",
     "family": "PowerEdge R640",
     "generation": "14G",
     "model": "R640",
     "public_name": "Dell PowerEdge R640 10SFF",
     "slug": "dell-poweredge-r640-10sff",
     "form_factor": "1U",
     "chassis_type": "10SFF",
     "drive_bays_front": 10,
     "drive_bays_rear": 0,
     "drive_form_factor": "2.5",
     "supported_drive_interfaces": ["SAS", "SATA", "NVMe"],
     "front_option_type": null,
     "backplane_type": "SAS/SATA/NVMe",
     "cpu_socket": "Intel LGA3647",
     "max_cpu": 2,
     "ram_slots_total": 24,
     "ram_slots_per_cpu": 12,
     "max_ram_capacity": "7.68 TB",
     "supported_ram_types": ["DDR4 RDIMM ECC", "DDR4 LRDIMM ECC"],
     "supported_ram_speeds": ["2400", "2666", "2933"],
     "psu_type": "Dell hot-plug redundant",
     "cooling_profile": "Standard / High Performance by CPU and storage",
     "source_doc_reference": "Dell PowerEdge R640 Technical Guide + Spec Sheet"
   }
   ```

4. Добавь процессоры.

   Тип компонента: `cpu`.

   Для каждого CPU обязательно заполняй:

   ```json
   {
     "type": "cpu",
     "brand": "Intel",
     "model": "Xeon Gold 6130",
     "public_name": "Intel Xeon Gold 6130",
     "short_name": "Gold 6130",
     "specs_json": {
       "generation": "1st",
       "socket": "LGA3647",
       "cores": 16,
       "threads": 32,
       "base_clock": "2.1GHz",
       "tdp": 125,
       "max_memory_speed": 2666
     }
   }
   ```

   Эти поля нужны для фильтров "1st Gen / 2nd Gen", RAM speed и cooling.

5. Добавь память.

   Тип компонента: `ram`.

   Минимальный `specs_json`:

   ```json
   {
     "capacity_gb": 32,
     "type": "DDR4 RDIMM ECC",
     "speed": 2666
   }
   ```

   Логика уже работает так: выбранный CPU задает максимум частоты. Память с частотой выше CPU скрывается/не выбирается.

6. Добавь корзину / backplane.

   Для Dell R640 нет HPE Media Bay. Поэтому не добавляй `media_bay: true`, если документация Dell этого не описывает. Делай отдельные chassis variants:

   - 8 x 2.5 SAS/SATA
   - 10 x 2.5 SAS/SATA/NVMe
   - 4 x 3.5 SAS/SATA

   Пример:

   ```json
   {
     "type": "backplane",
     "brand": "Dell",
     "model": "R640 10x2.5 backplane",
     "public_name": "Dell R640 10x2.5 SAS/SATA/NVMe backplane",
     "short_name": "10x2.5 backplane",
     "specs_json": {
       "interfaces": ["SAS", "SATA", "NVMe"],
       "bay_count": 10,
       "form_factor": "2.5",
       "media_bay": false
     }
   }
   ```

7. Добавь накопители.

   Тип компонента: `drive`.

   Для Dell R640 4LFF учитывай, что 3.5 LFF корзина может принимать LFF HDD, а 2.5 SSD возможны только если документация/kit допускает adapter path. Не показывай NVMe, если backplane не NVMe.

   Минимальный `specs_json`:

   ```json
   {
     "capacity": "1.92TB",
     "interface": "SAS",
     "form_factor": "2.5",
     "drive_kind": "SSD"
   }
   ```

8. Добавь RAID / storage controllers.

   Для Dell используй Dell PERC/BOSS, а не HPE Smart Array:

   - Software RAID: `S140`
   - Internal PERC: `H330`, `H730P`, `H740P`, `H750`
   - HBA: `HBA330`, `HBA350i`
   - Boot: `BOSS` 2 x M.2

   Пример:

   ```json
   {
     "type": "raid",
     "brand": "Dell",
     "model": "PERC H740P",
     "public_name": "Dell PERC H740P RAID Controller",
     "short_name": "PERC H740P",
     "specs_json": {
       "controller_family": "PERC",
       "interface": "SAS/SATA",
       "cache": "8GB",
       "battery": true
     }
   }
   ```

9. Добавь сетевые карты.

   Для Dell R640 не используй HPE FlexibleLOM. У Dell другая схема: Network Daughter Card и PCIe riser cards.

   Раздели NIC по `slot_type`:

   - `NDC` - Network Daughter Card, не занимает обычный PCIe slot.
   - `PCIe` - standup карта, занимает riser slot.
   - `OCP` - только если конкретная Dell-модель это поддерживает.

   Пример:

   ```json
   {
     "type": "nic",
     "brand": "Broadcom",
     "model": "57414 25Gb 2-port SFP28 NDC",
     "public_name": "Broadcom 57414 25Gb 2-port SFP28 Network Daughter Card",
     "short_name": "Broadcom 57414 NDC",
     "specs_json": {
       "vendor": "Broadcom",
       "ports": 2,
       "speed": "25GbE",
       "connector": "SFP28",
       "slot_type": "NDC",
       "max_quantity": 1
     }
   }
   ```

   Для PCIe NIC заполняй `height`: `low_profile`, `full_height` или `low_profile_or_full_height`. Потом правило совместимости должно смотреть выбранный riser.

10. Добавь riser.

   Для Dell R640 riser-конфигурации берутся из Installation and Service Manual. Пример полей:

   ```json
   {
     "type": "riser",
     "brand": "Dell",
     "model": "R640 Riser 1A",
     "public_name": "Dell R640 Riser 1A - 2 x Low Profile PCIe",
     "short_name": "Riser 1A",
     "specs_json": {
       "slots": [
         { "slot": 1, "height": "low_profile", "width": "x16", "cpu": 1 },
         { "slot": 2, "height": "low_profile", "width": "x16", "cpu": 1 }
       ]
     }
   }
   ```

11. Добавь cooling.

   Cooling должен быть комплектом, а не отдельно fan и heatsink:

   ```json
   {
     "type": "cooling",
     "brand": "Dell",
     "model": "Standard fan and heatsink kit",
     "public_name": "Standard cooling bundle",
     "short_name": "Standard cooling",
     "specs_json": {
       "cooling_tier": "standard",
       "max_cpu_tdp": 125
     }
   }
   ```

   Второй вариант:

   ```json
   {
     "cooling_tier": "performance",
     "min_cpu_tdp": 150
   }
   ```

12. Добавь PSU, rails, cables, service.

   PSU не пиши как `2 x 750W` в названии. Название должно быть одного блока, количество выбирается кнопками:

   ```json
   {
     "type": "psu",
     "brand": "Dell",
     "model": "750W Platinum Hot Plug PSU",
     "public_name": "750W Platinum Hot Plug PSU",
     "short_name": "750W PSU",
     "specs_json": {
       "wattage": 750,
       "efficiency": "Platinum",
       "hot_plug": true
     }
   }
   ```

13. Добавь правила совместимости.

   Минимальные правила для каждого нового сервера:

   - CPU quantity не больше `server_model.max_cpu`.
   - При 1 CPU доступно только `ram_slots_per_cpu` модулей.
   - RAM speed не выше `cpu.max_memory_speed`.
   - Cooling performance обязателен для CPU с TDP от 150W.
   - Drive quantity не больше количества отсеков выбранного backplane.
   - NVMe drive требует NVMe backplane / NVMe chassis.
   - NDC/FlexibleLOM максимум 1.
   - PCIe NIC не больше доступных riser slots.
   - Full-height NIC требует full-height riser slot.
   - BOSS/M.2 занимает свой boot path и не должен считаться как front drive bay.

14. Добавь подсказки.

   На каждый сложный блок добавь `help_annotation`:

   - `cpu`
   - `ram`
   - `drive`
   - `raid`
   - `nic`
   - `riser`
   - `backplane`
   - `psu`
   - `cooling`

   В подсказке пиши не маркетинг, а практическое объяснение: что это, зачем нужно, какие ограничения.

15. Проверь endpoints.

   Открой:

   - `GET /store/server-configurator/models/dell-poweredge-r640-10sff`
   - `GET /store/server-configurator/models/dell-poweredge-r640-10sff/options`

   Проверь, что:

   - в Dell нет HPE Media Bay;
   - RAID показывает Dell PERC/HBA/BOSS, а не Smart Array;
   - NIC показывает Dell NDC/PCIe, а не HPE FlexibleLOM;
   - Storage не показывает NVMe для не-NVMe корзины;
   - количество дисков режется по backplane.

16. Проверь frontend.

   Открой `/servers/dell-poweredge-r640-10sff`.

   Проверь вручную:

   - CPU фильтруется по поколению.
   - RAM фильтруется по частоте CPU.
   - Cooling меняется после выбора CPU с высоким TDP.
   - Storage меняется по backplane.
   - RAID список соответствует Dell.
   - NIC можно выбрать несколько только в пределах NDC/PCIe/riser.
   - Summary и кнопка КП получают backend validation result.

## Как это применить к текущему HPE DL360 Gen10

Для HPE DL360 Gen10 источником является HPE QuickSpecs: https://www.hpe.com/us/en/collaterals/collateral.a00008159enw.html

По этой документации:

- 8SFF базовый товар имеет 8 SFF SAS/SATA.
- 8SFF может иметь front Media Bay: +2 SFF SAS/SATA, +2 SFF NVMe, Dual uFF/M.2 или blank/ports.
- 10SFF NVMe Premium должен быть отдельной карточкой товара, не кнопкой внутри 8SFF.
- 4LFF должен быть отдельной карточкой товара.
- FlexibleLOM слот один.
- PCIe standup сетевые карты идут через riser; базово есть 2 PCIe слота: 1 x16 full-height и 1 x8 low-profile.
- NIC в текущем конфигураторе нужно держать как реальные Intel/Broadcom/HPE OEM позиции с понятным chipset/part number, а не `Generic NIC`.

## Главное правило

Не начинай с фронта. Правильный порядок такой:

1. Документация.
2. `server_model`.
3. `component`.
4. `compatibility_rule`.
5. `help_annotation`.
6. Проверка Store API.
7. Проверка frontend.
8. Только потом правка дизайна и текстов.

Если начинать с карточек и кнопок на frontend, получится красивая оболочка без нормального backend-конфигуратора.
