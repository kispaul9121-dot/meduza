# Meduza sequential prompts — Version 10 Optimized

## Новая последовательность

```text
01 Baseline
02 Routes
03 Domain
04 Compatibility Engine
05 Admin Knowledge Base and Builders
06 Core Server Creation Wizard
07 Genius Bootstrap Wizard and Modes
08 Import Pipeline
09 Backend Catalog
10 Storefront
11 Ready Configurations
12 Cart / RFQ / B2B
13 Content / Documents
14 Multibrand Proof
15 Functional UX / Performance / Publishing
16 SEO
17 Final Read-Only Audit
STOP
18 Manual Design Analysis
```

## Почему Wizard разделён

- Этап 05 создаёт reusable Admin builders.
- Этап 06 доказывает контролируемый core Wizard.
- Этап 07 добавляет Genius automation и три режима.
- Этап 08 предоставляет единственный transactional bulk/import apply.

Это не позволяет автоматизации и bulk-логике появиться раньше устойчивой domain/engine/core-Wizard основы.

## Автоматический режим

Запусти `00_MASTER_ORCHESTRATOR.md`. Он выполнит 01–17 и остановится.

## Ручной режим

Перед каждым prompt прочитай `COMMON_STAGE_CONTRACT.md`. После каждого отчёта переходи дальше только при `GO`.

## Этап 18

Запускается отдельной командой пользователя и не изменяет код.
