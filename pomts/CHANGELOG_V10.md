# CHANGELOG V10

## Additional split

Старый единый Server Creation Wizard дополнительно разделён:

- `06_CORE_SERVER_CREATION_WIZARD.md`;
- `07_GENIUS_BOOTSTRAP_WIZARD_AND_MODES.md`.

Core flow теперь обязан быть доказан до Genius automation, mode switching и Bulk Apply.

## Renumbering

Import и все последующие этапы сдвинуты на один номер. Финальный audit — этап 17, ручной design analysis — этап 18.

## Boundaries

- Stage 07 владеет manifest/confirmation.
- Stage 08 владеет transactional apply/retry/rollback.
- Parallel bulk engine запрещён.
