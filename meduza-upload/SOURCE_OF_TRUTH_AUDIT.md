# Source of Truth Audit

Date: 2026-07-13
Project: `D:\Meduza site`

## Target Rule

Runtime source of truth for the server configurator is:

`Medusa DB` + `server-configurator` custom module.

Default/fallback files may remain only as seed/import inputs. They must not be merged into normal runtime options/help/rules.

## MCP / Docs Check

- Medusa MCP was checked through available Codex tools. No Medusa MCP tool was available in this session.
- Official Medusa docs were checked for current v2.17.2 patterns:
  - custom modules;
  - custom API routes;
  - Admin UI routes;
  - scripts through `medusa exec`.
- Skills used:
  - `building-with-medusa`;
  - `building-storefronts`;
  - `storefront-best-practices`;
  - `building-admin-dashboard-customizations`.

## Runtime Source Findings

| File | Data | Runtime before cleanup | DB migration needed | Status |
| --- | --- | --- | --- | --- |
| `apps/backend/src/modules/server-configurator/default-components.ts` | CPU, RAM, RAID, NIC, cooling default components | Yes, merged into `/options` and used by validation for missing ids | Yes | Converted to seed/import source only |
| `apps/backend/src/modules/server-configurator/default-help-annotations.ts` | configurator help annotations | Yes, merged into Store help API | Yes | Converted to seed/import source only |
| `apps/backend/src/api/store/server-configurator/models/[slug]/options/route.ts` | mixed DB + default component flow, model-specific backplane filtering | Yes | Partial | Now DB-first; dev fallback only if DB empty and env flag is enabled |
| `apps/backend/src/api/store/server-configurator/help-annotations/route.ts` | DB + default help merge | Yes | Yes | Now DB-only |
| `apps/backend/src/modules/server-configurator/service.ts` | fallback component lookup by id; hardcoded storage/NIC validation | Yes | Partial | Fallback lookup removed; storage limits now read backplane/media bay specs; NIC limits moved to DB rules |
| `apps/backend/src/api/store/server-configurator/catalog-facets/route.ts` | hardcoded facet derivation | Yes | Not schema migration | Backend owns facet derivation and exposes model `facets_json` |
| `apps/storefront/src/lib/server-configurator/data.ts` | fallback server models, options, help annotations | Yes | Yes | Removed; storefront uses Store API and empty states only |
| `apps/storefront/src/app/sitemap.ts` | fallback model list | Yes | Yes | Uses `listServerModels()` from Store API |
| `apps/storefront/src/app/servers/[slug]/page.tsx` | fallback model list for static params | Yes | Yes | Uses `listServerModels()` from Store API |
| `apps/storefront/src/modules/server-configurator/product-card.tsx` | hardcoded base prices | Yes | Needs future backend pricing source | Removed; card shows `по запросу` until backend price source is modeled |
| `apps/storefront/src/modules/server-configurator/catalog-client.tsx` | duplicated commercial/catalog facet facts | Yes | Not schema migration | Reads `facets_json` returned by backend |
| `apps/storefront/src/modules/server-configurator/configurator-client.tsx` | local validation fallback on backend failure | Yes | No | Removed; backend Rules Engine failure is shown as backend error |

## Dev-Only Fallback

Created:

- `apps/backend/src/modules/server-configurator/runtime-fallback-warning.ts`

Fallback is allowed only when:

- DB options are empty;
- `NODE_ENV !== "production"`;
- `SERVER_CONFIGURATOR_DEV_FALLBACK=true`.

The warning is explicit:

`Server configurator is using DEV fallback because DB options are empty. Do not use this in production.`

Current verification showed `/options` returns `source: "db"`.

## Backplane / Media Bay Audit

Before cleanup:

- Backplane and Media Bay were both represented as `component.type = "backplane"`.
- Some generic imported backplane rows could be selected as base rows for 8SFF.
- 10SFF and 4LFF could accidentally expose Media Bay rows if filtering was too broad.

After cleanup:

- `type = "backplane"` remains unchanged to avoid enum migration risk.
- `specs_json.logical_group` separates `"backplane"` and `"media_bay"`.
- `specs_json.media_bay` is normalized to boolean.
- `specs_json.backplane_role` identifies `"base"` or `"media_bay"`.
- `/options` returns:
  - `groups[{ key: "backplane" }]`;
  - `groups[{ key: "media_bay" }]`.

Verified:

- 8SFF: 1 base backplane, 4 Media Bay options.
- 10SFF NVMe Premium: 1 backplane, 0 Media Bay.
- 4LFF: 1 backplane, 0 Media Bay.

## Recommended Schema Changes Before Dell/Supermicro Expansion

| Change | Why | Temporary `specs_json` path | Migration needed | Risk |
| --- | --- | --- | --- | --- |
| Add first-class `component.type = "media_bay"` | Cleaner UI/API grouping and Admin forms | `specs_json.logical_group = "media_bay"` | Yes | Medium, enum migration and UI update |
| Add component applicability table or relation | Avoid text/spec filtering by model family | `specs_json.server_model_slug`, `applicability_hints` | Yes | Medium |
| Add `server_model.facets_json` or commercial fields | Avoid recomputing catalog facets in API helper | response-only `facets_json` | Optional | Low |
| Add structured backplane capacity fields | Drive limits should not parse names | `bay_count`, `effective_bay_count`, `interfaces`, `backplane_role` | Optional | Low |
| Add structured NIC/riser slot resource model | Dell NDC/OCP/PCIe and Supermicro risers need exact slot accounting | `slot_type`, `height`, `provides.slots` | Yes for robust expansion | Medium |
| Add `component_model_applicability` for brand/family/chassis | Prevent HPE NIC/RAID appearing in Dell configs | `applicability_hints`, `source_doc_reference` | Yes | Medium |
| Add price source for `server_model` cards | Removed frontend `basePrices`; cards need backend pricing | Medusa product/variant link | Maybe no custom migration if using Medusa pricing | Medium |

## What Must Stay Out Of Runtime

- No permanent merge from `default-components.ts`.
- No permanent merge from `default-help-annotations.ts`.
- No storefront fallback component arrays.
- No frontend-owned CPU/RAM/RAID/NIC/PSU source lists.
- No hidden DB + default mixing in `/options`.
- No automatic enabling of imported draft compatibility rules.
