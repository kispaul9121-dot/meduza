# STAGE REPORT TEMPLATE

Создай `reports/stage-XX-report.md`.

## 1. Executive summary

- цель этапа;
- фактически выполненный scope;
- итог.

## 2. Input control

- прочитанный предыдущий отчёт;
- входной gate;
- учтённые `NEXT_STAGE_OVERRIDES`;
- baseline state.

## 3. Skills

- загруженные skills;
- отсутствующие skills;
- где рекомендации skill были применены или отклонены.

## 4. Changed files

Сгруппируй по backend, Admin, storefront, tests, migrations и docs.

## 5. Architecture and contracts

- новые/изменённые модели;
- API/DTO changes;
- ownership boundaries;
- ADR;
- backward compatibility.

## 6. Data safety

- migrations;
- backfill;
- idempotency;
- rollback/recovery;
- риск потери данных.

## 7. Verification

Для каждой команды укажи command, result и краткий вывод.

## 8. Runtime/manual scenarios

Перечисли реальные сценарии и evidence.

## 9. Security and permissions

Укажи применимые trust boundaries, роли и результаты проверки.

## 10. Unfinished and unverified

Ничего не скрывай.

## 11. Risks and technical debt

Отделяй текущий blocker от будущего улучшения.

## 12. Stage-specific evidence

Заполни требования текущего prompt.

## 13. Definition of Done

Таблица: критерий / статус / evidence.

## 14. Gate

```text
NEXT_STAGE_GATE: GO | GO_WITH_CORRECTIONS | STOP
```

## 15. Next-stage overrides

```text
NEXT_STAGE_OVERRIDES:
- ...
```

Либо `NONE`.

## 16. Handoff summary

Краткий текст для следующего агента или для проверки пользователем/ChatGPT.
