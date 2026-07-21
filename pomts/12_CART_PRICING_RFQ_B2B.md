# Этап 12. Cart, Pricing, RFQ and B2B Checkout

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md` и `STAGE_REPORT_TEMPLATE.md`.

## Stage metadata

- `STAGE_ID`: `12`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-11-report.md`
- `OUTPUT_REPORT`: `reports/stage-12-report.md`
- `NEXT_STAGE`: `13`


## Skills

- `building-with-medusa` — Cart, Pricing, Order, workflow integration
- `building-storefronts` — checkout/storefront implementation
- `storefront-best-practices` — cart/checkout trust and usability
- `react-best-practices` — client/server state and performance
- `composition-patterns` — configured cart and B2B forms
- `frontend-testing-debugging` — full browser purchase/RFQ flows
- `systematic-debugging` — pricing/cart state failures
- `verification-before-completion` — server-side price/compatibility proof

## Ownership

Владеет commerce-safe immutable copy/reference технического snapshot, pricing, cart, RFQ и B2B checkout.

## Out of scope

- Изменение canonical technical snapshot schema этапа 11.
- Российский регламентированный бухгалтерский учёт.
- Visual redesign.

## Цель

Оставить одну Medusa cart, включить base server price и отделить purchase от RFQ.

## Работы

1. Удали/redirect duplicate cart UI.
2. Standard cart отображает:
   server model, topology, grouped components, quantities, effective specs, warnings, configuration ID/hash, price mode.
3. Pricing:
   `base server/chassis + components + bundles + services + adjustments`.
4. Используй currency-aware money types, не бесконтекстный float.
5. Calculated purchase:
   valid price, inventory, normal checkout.
6. RFQ:
   отдельная action, company/contact, quantity, comments, status;
   не fake price 0 как обычная покупка.
7. Configuration lifecycle:
   draft, valid, invalid, in_cart, quote_requested, quoted, ordered, expired, archived.
8. Свяжи configuration с customer/cart/order.
9. Перед действием перепроверь:
   component enabled, stock/reservability, supplier availability, price freshness, base variant.
10. API security:
    Zod, ownership, server-side compatibility/price, cost protection, metadata limits.
11. Проверь workflow compensation.
12. Исправь только критические usability blockers корзины, необходимые для корректного commerce flow. Общий functional UX/performance cleanup принадлежит этапу 15, а полный визуальный redesign — только ручному этапу 18. Этап 13 владеет content/knowledge/documents и не должен получать cart redesign scope.
13. Tests:
    purchase, RFQ, base price, invalid config, price changed, unavailable stock, persistence, order lifecycle, rollback.

## Отображение storage и optional choices в cart/RFQ

Cart snapshot должен содержать:

- выбранный ServerStorageOption;
- zones и фактически размещённые drives;
- adapters;
- auto-added backplane/controller/cables/bundles;
- optional groups с explicit none или выбранной option;
- hidden technical components;
- validation trace/version.

Покупателю показывай понятное представление:

- выбранная корзина;
- количество и типы дисков;
- M.2 board: отсутствует/выбрана;
- GPU: отсутствует/выбраны модели и количество;
- rails: отсутствуют/выбран kit.

Технические auto-added items не скрывай из расчёта цены и audit trail, даже если они свернуты в UI.

## Stage-specific Definition of Done

- Одна cart.
- Base price включена.
- RFQ отдельный процесс.
- Lifecycle и повторная server validation работают.

## Stage-specific report evidence

В дополнение к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

- end-to-end configurator→cart→RFQ/order;
- server-side tampering tests;
- partial availability/pricing cases;
- immutable order snapshot evidence.

## Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- После `GO` укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
