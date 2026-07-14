# Dell PowerEdge R640 8SFF: создание образцового сервера

Эта инструкция описывает, как добавить новый сервер в существующий Medusa + Server Configurator проект. Пример: `Dell PowerEdge R640 8SFF`.

## Главное различие

`Products` в Medusa и `Server Models` в Server Configurator - это разные сущности.

- Medusa Product/Variant нужен для каталога, публикации, sales channel, cart и связи с товаром.
- Server Model нужен для конфигуратора: slug страницы, шасси, ограничения, совместимость и наборы компонентов.
- Inventory Items не создают сервер в конфигураторе. Это только складские остатки для product variant.

Если продукт `Dell PowerEdge R640 8SFF` уже создан в `Products`, он сам не появится в `Server Configurator -> Server Models`. Нужно создать отдельный Server Model и связать его с product/variant ID.

## 1. Найти Product ID и Variant ID

Открой:

`Admin -> Products -> Dell PowerEdge R640 8SFF -> Variant`

Из текущего URL видно:

- `medusa_product_id`: `prod_01KXDW1R6AT9XB6H98YD9D21T3`
- `medusa_variant_id`: `variant_01KXDW1R8HCB8EAH29EG4TEJB4`

Эти ID нужно вставить в форму Server Model вручную.

## 2. Создать Server Model

Открой:

`Admin -> Server Configurator -> Server Models`

Нажми `New`, затем заполни форму.

Рекомендуемые значения для Dell R640 8SFF:

| Поле | Значение |
| --- | --- |
| `medusa_product_id` | `prod_01KXDW1R6AT9XB6H98YD9D21T3` |
| `medusa_variant_id` | `variant_01KXDW1R8HCB8EAH29EG4TEJB4` |
| `brand` | `Dell` |
| `family` | `PowerEdge R640` |
| `generation` | `14G` |
| `model` | `R640` |
| `public_name` | `Dell PowerEdge R640 8SFF` |
| `slug` | `dell-poweredge-r640-8sff` |
| `form_factor` | `1U` |
| `chassis_type` | `8SFF` |
| `drive_bays_front` | `8` |
| `drive_bays_rear` | `0` |
| `drive_form_factor` | `2.5` |
| `supported_drive_interfaces` | `SAS, SATA` |
| `front_option_type` | оставить пустым, если нет front option |
| `backplane_type` | `8SFF SAS/SATA` |
| `cpu_socket` | `FCLGA3647` |
| `max_cpu` | `2` |
| `ram_slots_total` | `24` |
| `ram_slots_per_cpu` | `12` |
| `max_ram_capacity` | `3 TB` |
| `supported_ram_types` | `DDR4 RDIMM ECC, DDR4 LRDIMM ECC` |
| `supported_ram_speeds` | `2666, 2933` |
| `psu_type` | `Dell hot-plug redundant` |
| `cooling_profile` | `standard` |
| `seo_title` | `Dell PowerEdge R640 8SFF` |
| `seo_description` | `Dell PowerEdge R640 8SFF 1U server configurator` |
| `source_doc_reference` | `Dell PowerEdge R640 Technical Guide` |

## 3. Что обязательно заполнить

Backend требует эти поля:

- `brand`
- `family`
- `generation`
- `model`
- `public_name`
- `slug`
- `form_factor`
- `chassis_type`
- `drive_bays_front`
- `drive_form_factor`
- `backplane_type`
- `cpu_socket`
- `max_cpu`
- `ram_slots_total`
- `ram_slots_per_cpu`
- `max_ram_capacity`
- `psu_type`
- `cooling_profile`
- `seo_title`
- `seo_description`
- `source_doc_reference`

`medusa_product_id` и `medusa_variant_id` технически могут быть пустыми, но для нормальной связи с Medusa product/cart их нужно заполнить.

Списки в форме вводятся через запятую, например:

`SAS, SATA`

## 4. Как должна работать кнопка Save Server Model

После нажатия `Save Server Model`:

1. Admin UI отправляет `POST /admin/server-configurator/models`.
2. Если все обязательные поля заполнены корректно, появляется toast `Server model saved`.
3. Таблица `Server Models` обновляется.
4. В таблице появляется строка `Dell PowerEdge R640 8SFF`.
5. Кнопки `Store API` и `Frontend` начинают вести на этот сервер.

Если обязательное поле пустое, запись не создается. Например, если пустые `model`, `public_name`, `slug`, `seo_title`, `seo_description` или `source_doc_reference`, Save должен завершиться ошибкой валидации.

## 5. Проверка после сохранения

В таблице `Server Models` найди строку:

`Dell PowerEdge R640 8SFF`

Проверь:

- `Store API` открывает `/store/server-configurator/models/dell-poweredge-r640-8sff`
- `Frontend` открывает `/servers/dell-poweredge-r640-8sff`
- В `Medusa Product Link` внутри формы виден правильный product handle/title

Если Server Model создан, но на frontend нет нормальных опций, это не ошибка Product. Это означает, что к серверу еще не применены компоненты и component packs.

## 6. Добавить совместимые компоненты

Server Model - это только корпус и правила верхнего уровня. Чтобы конфигуратор стал рабочим, нужно применить к нему компоненты:

- CPU
- RAM
- Storage
- RAID
- NIC
- PSU
- Cooling
- Backplane / Media Bay, если используется

Для Dell R640 нельзя слепо применять HPE-specific packs:

- не использовать HPE Smart Array как Dell RAID
- не использовать HPE FlexibleLOM как Dell NIC
- не использовать HPE DL360 media bay/backplane для Dell

CPU можно взять из общих Intel Xeon Scalable 1st/2nd Gen packs, но лучше создать Dell-scoped pack:

`Intel Xeon Scalable 1st/2nd Gen for Dell 14G R640`

Пример scope для такого pack:

- `brands`: `Dell`
- `families`: `PowerEdge R640`
- `generations`: `14G`
- `server_model_slugs`: `dell-poweredge-r640-8sff`

После применения packs проверь frontend страницу и Store API options.

## 7. Куда не нужно добавлять R640

Не нужно добавлять R640 через:

`Products -> Variant -> Inventory items`

Inventory item нужен для складского учета конкретного product variant. Он не создает Server Model, не добавляет совместимость и не наполняет конфигуратор опциями.

## 8. Короткий порядок действий

1. Создать Medusa Product `Dell PowerEdge R640 8SFF`.
2. Создать хотя бы один Variant.
3. Скопировать product ID и variant ID.
4. Перейти в `Server Configurator -> Server Models`.
5. Создать Server Model с полями из этой инструкции.
6. Нажать `Save Server Model`.
7. Убедиться, что Dell появился в таблице Server Models.
8. Проверить `Store API` и `Frontend`.
9. Создать или применить component packs для Dell R640.
10. Проверить сборку на frontend: опции, совместимость, cart.
