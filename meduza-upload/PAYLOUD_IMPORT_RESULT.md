# Payloud 2 Import Result

Date: 2026-07-13
Project: `D:\Meduza site`
Source: `C:\Users\kampo\OneDrive\Documents\pauloud 2`

## MCP and Docs

- Medusa MCP was requested, but no Medusa MCP tools were available in the current Codex tool list.
- Fallback used: official Medusa documentation for custom CLI scripts. Medusa documents that custom scripts live under `src/scripts`, export a default function receiving the Medusa container, and are executed with `medusa exec`.
- Requested skills `medusa-dev` and `ecommerce-storefront` were not installed in this session.
- Installed Medusa/storefront skills used:
  - `building-with-medusa`
  - `building-storefronts`
  - `storefront-best-practices`

## Import Execution

Command:

```powershell
npx medusa exec ./src/scripts/import-payloud-data.ts
```

Result:

- Components found: 80
- Components created: 0
- Components updated: 57
- Components skipped: 23
- Component duplicates: 0
- Help annotations found: 45
- Help annotations updated: 44
- Draft compatibility rules found: 32
- Draft compatibility rules updated: 26
- Draft compatibility rules skipped: 6
- Rule presets found: 9
- Rule presets unchanged: 9

Final idempotency dry-run:

- Components unchanged: 57
- Help annotations unchanged: 44
- Draft compatibility rules unchanged: 26
- Rule presets unchanged: 9
- New updates on repeat dry-run: 0

## Imported Component Types

- `cpu`: 4
- `ram`: 3
- `raid`: 3
- `drive`: 4
- `backplane`: 7
- `rails`: 4
- `psu`: 9
- `nic`: 12
- `license`: 3
- `service`: 3
- `cable`: 1
- `cooling`: 2
- `riser`: 2

## Safety Rules Applied

- Payloud source folder was read-only from the import script perspective.
- Components are upserted by stable part-number/name keys.
- Existing positive `price`, `cost`, and `stock_qty` are preserved on update.
- Old Payloud RUB values are stored as `specs_json.source_price` with `source_price_currency: "RUB"`.
- New imported components use `price: 0`; no final storefront price is inferred from legacy RUB values.
- Generated/cross-platform catalog rows without DL360 source-backed applicability were skipped.
- GPU components and GPU rules were skipped because current Medusa enum does not include `gpu`.
- Imported compatibility rules remain disabled drafts.
- Draft rule `admin_note` is exactly: `Imported from Payloud 2 as draft. Must be normalized and manually reviewed before enabling.`
- `specs_json` now includes traceability fields such as `source_file`, `source_doc_reference`, `source_price`, `original_category`, `original_id`, `warnings`, `notes`, `applicability_hints`, `quantity_limits`, `ui_state`, and `raw_source`.

## Files Changed

- `apps/backend/src/scripts/import-payloud-data.ts`
- `apps/backend/src/scripts/payloud/types.ts`
- `apps/backend/src/scripts/payloud/source-files.ts`
- `apps/backend/src/scripts/payloud/report.ts`
- `apps/backend/src/scripts/payloud/read-source.ts`
- `apps/backend/src/scripts/payloud/utils.ts`
- `apps/backend/src/scripts/payloud/component-mapper.ts`
- `apps/backend/src/scripts/payloud/source-backed-mapper.ts`
- `apps/backend/src/scripts/payloud/annotation-mapper.ts`
- `apps/backend/src/scripts/payloud/rule-mapper.ts`
- `apps/backend/src/scripts/payloud/collect.ts`
- `apps/backend/src/scripts/payloud/upsert.ts`
- `PAYLOUD_IMPORT_RESULT.md`

## File Size Limits

The previous monolithic import script was 1038 lines. It was split into focused modules.

- `import-payloud-data.ts`: 23 lines
- Largest import module: `upsert.ts`, 156 lines
- All new script/helper files are below the requested 300-400 line helper limit.

## Verification

Passed:

- `npx tsc --noEmit --pretty false` in `apps/backend`
- `npm run build` in `apps/backend`
- `npx tsc --noEmit --pretty false` in `apps/storefront`
- `npm run build` in `apps/storefront`
- `npm run build` at repo root
- Store API `GET /store/server-configurator/models`: 200, 4 models
- Store API `GET /store/server-configurator/models/hpe-proliant-dl360-gen10-8sff/options`: 200, 75 options
- Store API `POST /store/server-configurator/validate`: 200 with expected 1 CPU / 13 DIMM validation error
- Storefront `GET /servers`: 200
- Storefront `GET /servers/hpe-proliant-dl360-gen10-8sff`: 200
- Model page contains `Backplanes / Media Bay`, `Cooling Kits`, and `Risers`

Not fully passed:

- `npx medusa lint` returned exit code 1 because Medusa CLI reported that `eslint` is not installed in the backend project, even though root dependencies include ESLint. Backend build also emitted the same lint-skipped warning.

## Remaining Work

- Normalize and manually review imported draft compatibility rules before enabling any of them.
- Add `gpu` to the module enum and UI only if GPU configurator support becomes a scoped requirement.
- Decide whether tray-only Payloud rows should become a first-class component type or stay skipped.
