| URL | Существует | Статус HTTP | Шаблон | Источник данных | Индексация | Проблема |
| --- | ---------- | ----------: | ------ | --------------- | ---------- | -------- |
| `/` | Да | 200 | `app/[countryCode]/(main)/page.tsx` | Medusa Collections | Да | Нет специфичной B2B главной |
| `/servers` | Да | 200 | `app/servers/page.tsx` | `listServerModels` | Да | Захардкожены метаданные DL360 на общей странице |
| `/servers/[slug]` | Да | 200 | `app/servers/[slug]/page.tsx` | `retrieveServerModel` | Да | Всё отлично |
| `/servers?component=...` | Да (query) | 200 | `catalog-client.tsx` | Клиентский стейт | Возможна | Фиктивный URL для комплектующих. Плохо для SEO. |
| `/servers?view=compare` | Да (query) | 200 | `catalog-client.tsx` | LocalStorage | Нет | Фиктивный URL. Сравнение живет в query и LocalStorage. |
| `/servers?view=favorites` | Да (query) | 200 | `catalog-client.tsx` | LocalStorage | Нет | Фиктивный URL. Избранное живет в query. |
| `/servers?view=cart` | Да (query) | 200 | `cart-view.tsx` | Medusa Cart API | Нет | Есть еще `/cart` от Medusa - возможно дублирование. |
| `/cart` | Да | 200 | `app/[countryCode]/(main)/cart/page.tsx`| Medusa Cart API | Нет | Это стандартная корзина Medusa, может конфликтовать с конфигураторной. |
| `/components` | Нет | 404 | - | - | - | Отсутствует полноценный раздел |
| `/knowledge` | Нет | 404 | - | - | - | Отсутствует раздел |
| `/solutions` | Нет | 404 | - | - | - | Отсутствует раздел |
| `/about` | Нет | 404 | - | - | - | Отсутствует |
