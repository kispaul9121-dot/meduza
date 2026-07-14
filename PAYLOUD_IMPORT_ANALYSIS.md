# Payloud 2 Import Analysis

Source root: `C:\Users\kampo\OneDrive\Documents\pauloud 2`

The source project was inspected read-only. The Medusa project already has the required `server-configurator` models, so the first safe transfer should be an import layer that upserts data into existing `component`, `help_annotation`, `compatibility_rule`, and `rule_preset` records without changing Medusa models or replacing the Rules Engine.

## Files Found

| Source file | Data found | Safe transfer |
| --- | --- | --- |
| `src/data/configurator.js` | Legacy configurator groups: CPU, RAM, RAID, storage, drive/backplane type, trays, rails, PSU, network, management, service. Contains option names, quantities, notes, and RUB prices. | Components and group help annotations. Prices are not copied into Medusa `price` because the current storefront uses USD-style display values. Original price is preserved in `specs_json.source_price`. |
| `src/data/products/components-core.js` | Catalog component examples: CPU, RAM, RAID, SSD, NIC, case, motherboard, GPU. | Use only as audit/source reference for catalog groups. Several rows target newer DDR5/LGA4677 or non-DL360 hardware and should not be enabled as DL360 options. |
| `src/data/products/components-more.js` | Extra components: HDD, PSU, rails, cooling, cable, backplane, riser, thermal, bezel. | Selected option-like component types can map to Medusa component types. Non-DL360 vendor-specific rows should remain skipped or disabled until source-backed applicability is added. |
| `src/data/products/hpeDl360Servers.js` | HPE DL360 model cards, chassis/storage metadata, filters/tags, short B2B text. | Useful for server model metadata and storefront filters, but not imported as new Medusa products in this task. Existing four HPE models remain authoritative. |
| `src/data/filters/*.js`, `src/data/menu.js`, `src/lib/catalogUrlState.js`, `src/lib/catalogHelpers.js` | Catalog groups, filters, URL state, menu behavior. | UI-only/filter schema planning. Do not import as backend business logic. |
| `src/lib/configuratorOptionAnnotations.js` | Legacy option annotation extraction from CPU/RAM/RAID/NIC labels. | Convert to `help_annotation` patterns and preserve as source reference. Do not copy formatter logic into Medusa backend. |
| `src/lib/configuratorOptionUiState.js` | disabled/recommended/warning/required UI state merge and candidate keys. | Convert states into draft `compatibility_rule` metadata or annotations. Do not copy as backend rule engine logic. |
| `src/lib/dl360StorageScenarios.js` | DL360 8SFF and 8SFF + Media Bay scenarios, selected media bay UI state. | Convert media bay/backplane options into components and storage-scenario annotations/presets. |
| `src/lib/configuratorBackplaneSync.js` | UI sync between backplane options and drive bay scenarios. | Convert matching intent into rules/presets later. Do not copy UI sync logic into backend. |
| `src/lib/configuratorPlatformPatches.js` | Per-platform patches for CPU/RAM/template data. | Safe as audit reference only. Importing patches directly would conflict with Medusa server model records. |
| `payload-cms/src/lib/rules/dl360TestingRulesetSeed.ts` | Diagnostic compatibility rules, messages, recommendations, required options. | Create disabled draft `compatibility_rule` records and `rule_preset` records. Conditions are preserved in `conditions_json` as legacy source shape for manual normalization. |
| `payload-cms/src/lib/rules/dl360NicsSeed.ts` | Source-backed DL360 NIC option definitions and diagnostic warnings. | Import NIC components. Warnings become specs metadata; deeper applicability remains draft rules. |
| `payload-cms/src/lib/rules/dl360ExpansionOptionsSeed.ts` | Media bay/backplane kits and storage expansion scenarios. | Import as `backplane` components with media bay metadata. |
| `payload-cms/src/lib/rules/dl360PsuCoolingSeed.ts` | HPE Flex Slot PSU and cooling kit definitions. | Import PSU and cooling components. |
| `payload-cms/src/lib/rules/dl360GpuSeed.ts` | GPU and riser/accessory definitions. | Import only riser/accessory definitions that map to current `riser` component type. GPU itself is skipped because the current Medusa component enum has no `gpu`. |
| `payload-cms/scripts/seed-component-catalog.ts` | Large generated catalog for CPUs, RAM, storage, RAID, NIC, PSU. | Audit reference only for this pass. It generates many cross-platform rows and should not be blindly enabled for DL360 Gen10. |

## Mapping Plan

### Components

Old option rows map to `component`:

- `type`: mapped from source group/product type (`storage`, `ssd`, `hdd`, `nvme` -> `drive`; `network` and `network-card` -> `nic`; `driveType` and media bay -> `backplane`; `interface-cable` -> `cable`).
- `brand`: manufacturer/vendor/brand or inferred from name.
- `model`: normalized source model/name.
- `part_number`: source `sku`, `partNumber`, or `vendorPartNumber` when present.
- `public_name`: source option name.
- `short_name`: compact B2B label.
- `specs_json`: all source attributes that do not have first-class fields, including `source_doc_reference`, `source_file`, `source_price`, quantity bounds, UI notes, warnings, and applicability hints.
- `price`: set to `0` for new Payloud 2 imports unless a Medusa-compatible currency price is confirmed. Existing non-zero Medusa prices are not overwritten.
- `cost`: set to `0`.
- `stock_qty`: set to `0` unless numeric stock exists.
- `enabled`: true only for rows that are safe to show as current configurator options.

### Help Annotations

Old group descriptions, popovers, and diagnostic messages map to `help_annotation`:

- `key`: stable key such as `configurator.cpu` or `diagnostic.dl360-storage-nvme-without-path-001`.
- `page`: `configurator`, `catalog`, or `global`.
- `title`: old group/rule title.
- `body`: description/message.
- `severity`: source severity when available.
- `source_doc_reference`: `pauloud 2 / <file>`.
- `metadata_json`: source id, rule id, raw category, and legacy action when useful.

### Compatibility Rules

Old diagnostic rules map to disabled draft `compatibility_rule` records:

- `scope_type`: `server_model` for DL360-specific rules, otherwise `global`.
- `scope_value`: `hpe-proliant-dl360-gen10-8sff` for DL360-specific drafts until model-family scoping is normalized.
- `category`: mapped to current enum (`media-bay`/`nvme` -> `storage`, `pcie` -> `riser`, unsupported GPU rows skipped).
- `rule_type`: mapped from old `action`/`ruleType` to `block`, `require`, `limit`, or `warning`.
- `conditions_json`: preserved legacy condition JSON; not treated as production-ready.
- `action_json`: stores legacy action, severity, recommendations, required options, and `draft: true`.
- `message`: source Russian diagnostic text.
- `admin_note`: states that the rule is imported as draft and must be normalized before enabling.
- `source_doc_reference`: `pauloud 2 / payload-cms/src/lib/rules/dl360TestingRulesetSeed.ts`.

### Rule Presets

Rule templates discovered from Payloud 2 become `rule_preset`:

- CPU quantity limits RAM slots.
- CPU limits RAM speed.
- NVMe requires NVMe backplane/media bay.
- RAID requires compatible cable/controller path.
- Storage scenario requires media bay path.
- Backplane limits drive interface/form factor.
- PSU minimum wattage and redundancy review.
- Riser required by NIC/GPU.
- Cooling required/recommended by NVMe, 100GbE, or accelerator scenarios.

### UI-Only Data

The following should not be imported as backend logic:

- React components and popover rendering.
- Payload API clients and Payload collection schemas.
- Frontend-only URL state/filter switching code.
- Formatter heuristics from `configuratorOptionAnnotations.js`.
- UI state merge code from `configuratorOptionUiState.js`.
- Backplane selection synchronization code from `configuratorBackplaneSync.js`.

## Data Not Safe To Transfer Directly

- Payload CMS collections and API routes.
- Generated cross-platform catalog rows from `seed-component-catalog.ts` as enabled DL360 options.
- Old RUB prices into Medusa `price` without currency conversion and region strategy.
- Old rules as live Rules Engine conditions because operators/facts differ from the Medusa service implementation.
- GPU options, because the current Medusa component enum does not include `gpu`.
- Trays/bezel/thermal paste as first-class components, because current `component.type` has no tray/bezel/thermal categories.

## First Import Scope

The implemented import script should upsert:

1. CPU, RAM, drives, RAID, NIC, PSU, rails from `src/data/configurator.js`.
2. DL360 NIC, media bay/backplane, PSU, cooling, and riser/source-backed accessories from Payload seed files.
3. Group help annotations and diagnostic annotations.
4. Disabled draft compatibility rules from `dl360TestingRulesetSeed.ts`.
5. Rule presets for the discovered patterns.

It should not delete data, change existing server models, create Medusa product variants for components, or enable draft compatibility rules automatically.
