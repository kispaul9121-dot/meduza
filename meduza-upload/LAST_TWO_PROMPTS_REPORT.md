# Report: latest DL360 configurator fixes

Date: 2026-07-13
Project: `D:\Meduza site`

## Scope

Covered the latest browser annotation batch for:

- CPU 1st Gen restoration.
- CPU-aware memory speed filtering.
- Cooling bundle placement and TDP behavior.
- Network multi-select behavior.
- RAID standard controller restoration.
- Removal of the separate `Корзина / Media Bay` scenario block.
- Backend-backed annotations/options for the storefront configurator.

## Backend changes

- Added source-backed default components in `apps/backend/src/modules/server-configurator/default-components.ts`.
- Store options API now merges these defaults into Medusa module results:
  - Xeon Scalable 1st Gen CPU examples: Gold 6130, Gold 6148, Silver 4110, Bronze 3106.
  - RAM speeds: 2133, 2400, 2666, 2933 MT/s.
  - Standard HPE Smart Array Gen10 controllers: S100i, E208i-a, P408i-a, P816i-a.
  - Standard and Performance cooling bundles.
- `validateConfiguration` now recognizes fallback component IDs and includes them in price/fact calculation.
- Backend facts now include NIC quantity, slot types, and selected NIC speeds.
- Added source-backed default help annotations in `apps/backend/src/modules/server-configurator/default-help-annotations.ts`.
- Store help annotation API now merges/overrides stale DB annotations with detailed backend annotations.

## Storefront changes

- Removed the old `Корзина / Media Bay` scenario block from the 8SFF page.
- Moved the title above the overview:
  - `Конфигуратор сервера`
  - full model name.
- Removed the duplicated `Gen10 / 8SFF` title line.
- Reordered configurator groups:
  - Processor
  - Система охлаждения
  - Memory
  - Drive Bay / Media Bay
  - Storage
  - RAID Controller
  - Network
  - Power Supply
- Memory filters are fixed buttons: 2133, 2400, 2666, 2933 MT/s.
- Selecting a CPU hides/disables unsupported higher RAM speeds and falls back to a compatible RAM option.
- Cooling auto-selects:
  - Standard for lower-TDP CPU.
  - Performance for 150W+ CPU.
- Network supports multiple selected NIC rows with a practical max of 3 selected adapters.
- Overview characteristics now show general platform specs instead of current selected CPU/RAM/PSU quantities.
- Storefront fallback data was updated so the page still has the same minimal options if backend fetch fails.

## Verification

Commands:

- `npm --workspace @dtc/storefront run build`
- `npm --workspace @dtc/backend run build`

Local servers restarted:

- Backend: `http://localhost:9000`
- Storefront: `http://localhost:8000`

Browser MCP QA on:

`http://localhost:8000/servers/hpe-proliant-dl360-gen10-8sff`

Results:

- Page returns HTTP 200.
- `button button` nested buttons: `0`.
- Console errors/warnings/issues: none.
- First groups render as:
  - `Processor`
  - `Система охлаждения`
  - `Memory`
  - `Drive Bay / Media Bay`
  - `Storage`
  - `RAID Controller`
  - `Network`
  - `Power Supply`
- `Корзина / Media Bay` scenario block is absent.
- Top title is `Конфигуратор сервера` plus `HPE ProLiant DL360 Gen10 8SFF`.
- CPU filters include `Xeon Scalable 1st Gen`.
- RAM filters include `2133`, `2400`, `2666`, `2933 MT/s`.
- Selecting `Intel Xeon Gold 6148` selects Performance cooling and disables 2933 MT/s RAM.
- Selecting `Intel Xeon Gold 6130` selects Standard cooling and keeps 2933 MT/s disabled.
- RAID section contains standard Smart Array entries including S100i and P408i-a.
- Three NIC rows can be selected at once.

Screenshot:

`D:\Meduza site\.codex\tmp\dl360-configurator-after-fixes.png`

## Notes

- Direct unauthenticated calls to `http://localhost:9000/store/...` return 400 because Medusa store routes require the configured publishable API key. The storefront SDK request path works and was verified through the rendered page.
- I did not modify Medusa cart/order snapshot behavior and did not enable draft compatibility rules.
