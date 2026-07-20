# Source of Truth Cleanup Result

Date: 2026-07-13
Project: `D:\Meduza site`
Medusa version: `2.17.2`

## 1. MCP

Medusa MCP was not available in the current Codex tool list. I used local Medusa skills and official Medusa documentation patterns instead.

Official docs checked:

- https://docs.medusajs.com/learn/fundamentals/modules
- https://docs.medusajs.com/learn/customization/custom-features/api-route
- https://docs.medusajs.com/resources/how-to-tutorials/tutorials/product-reviews

## 2. Patterns Used

- Domain data and business logic stay in the `server-configurator` custom module.
- Storefront reads through Store API using Medusa SDK.
- Admin UI reads through Admin API using Medusa SDK.
- Seed/import data is loaded through a `medusa exec` script.
- Draft compatibility rules remain disabled unless explicitly reviewed.

## 3. Runtime Fallback Sources Found

- Backend default components were merged into `/options`.
- Backend default help annotations were merged into Store help API.
- Backend validation accepted missing component ids from default files.
- Storefront had fallback models, options, and help annotations.
- Storefront had hardcoded card prices.
- Storefront duplicated catalog facet business facts.

Details are in `SOURCE_OF_TRUTH_AUDIT.md`.

## 4. What Was Moved Into DB

Created script:

- `apps/backend/src/scripts/seed-configurator-defaults.ts`

The script upserts:

- default components;
- default help annotations;
- canonical compatibility rules;
- rule presets.

The script preserves existing positive `price`, `cost`, and `stock_qty`, merges traceability metadata, and is idempotent. Final repeat run:

```text
components: created 0, updated 0, unchanged 18
help_annotations: created 0, updated 0, unchanged 12
compatibility_rules: created 0, updated 0, unchanged 5
rule_presets: created 0, updated 0, unchanged 2
```

Current DB totals:

- server models: 4;
- components: 97;
- help annotations: 49;
- enabled rules: 10;
- draft/disabled rules: 26;
- rule presets: 19.

## 5. Scripts Created

- `apps/backend/src/scripts/seed-configurator-defaults.ts`

Support helper:

- `apps/backend/src/modules/server-configurator/runtime-fallback-warning.ts`

## 6. Files Changed / Created

Backend:

- `apps/backend/src/modules/server-configurator/service.ts`
- `apps/backend/src/modules/server-configurator/catalog-facets.ts`
- `apps/backend/src/modules/server-configurator/runtime-fallback-warning.ts`
- `apps/backend/src/api/store/server-configurator/models/route.ts`
- `apps/backend/src/api/store/server-configurator/models/[slug]/route.ts`
- `apps/backend/src/api/store/server-configurator/models/[slug]/options/route.ts`
- `apps/backend/src/api/store/server-configurator/help-annotations/route.ts`
- `apps/backend/src/api/store/server-configurator/catalog-facets/route.ts`
- `apps/backend/src/api/admin/server-configurator/source-of-truth/route.ts`
- `apps/backend/src/admin/routes/server-configurator/source-of-truth/page.tsx`
- `apps/backend/src/scripts/seed-configurator-defaults.ts`

Storefront:

- `apps/storefront/src/lib/server-configurator/data.ts`
- `apps/storefront/src/app/sitemap.ts`
- `apps/storefront/src/app/servers/[slug]/page.tsx`
- `apps/storefront/src/modules/server-configurator/catalog-client.tsx`
- `apps/storefront/src/modules/server-configurator/configurator-client.tsx`
- `apps/storefront/src/modules/server-configurator/product-card.tsx`

Reports:

- `SOURCE_OF_TRUTH_AUDIT.md`
- `SOURCE_OF_TRUTH_CLEANUP_RESULT.md`

## 7. DB-First Options

Updated:

- `GET /store/server-configurator/models`
- `GET /store/server-configurator/models/:slug`
- `GET /store/server-configurator/models/:slug/options`
- `GET /store/server-configurator/help-annotations`
- `GET /store/server-configurator/catalog-facets`
- `POST /store/server-configurator/validate`

`/options` now returns `source: "db"` in normal mode and no longer merges DB rows with `default-components.ts`.

## 8. Where Fallback Remains

Only dev fallback remains:

- DB options must be empty;
- `SERVER_CONFIGURATOR_DEV_FALLBACK=true`;
- `NODE_ENV !== "production"`.

It logs a warning and is visible in Admin Source of Truth. Current API checks returned `source: "db"`.

## 9. Backplane / Media Bay Split

No enum migration was done.

Safe representation:

- `type = "backplane"`;
- `specs_json.logical_group = "backplane"` or `"media_bay"`;
- `specs_json.media_bay = true/false`;
- `specs_json.backplane_role = "base" | "media_bay"`;
- `specs_json.bay_count`;
- `specs_json.effective_bay_count`;
- `specs_json.interfaces`.

Verified:

- 8SFF: 1 base backplane and 4 Media Bay options.
- 10SFF NVMe Premium: 1 integrated backplane and 0 Media Bay options.
- 4LFF: 1 4LFF/SAS-SATA backplane and 0 Media Bay options.

## 10. Model-Specific Rules Moved

Canonical enabled DB rules now cover:

- NVMe drive requires selected NVMe backplane / Media Bay / integrated NVMe chassis.
- 4LFF blocks NVMe but allows LFF and 2.5 SAS/SATA adapter path.
- DL360 FlexibleLOM max = 1.
- DL360 PCIe NIC max = 2.
- DL360 total NIC max = 3.

Imported draft rules stayed disabled.

## 11. Frontend Hardcoded Data Removed

Removed from storefront runtime:

- fallback server models;
- fallback configurator options;
- fallback help annotations;
- hardcoded product-card `basePrices`;
- local validation fallback when backend Rules Engine fails;
- duplicated commercial/catalog facet facts.

Allowed UI constants remain:

- labels;
- group order;
- filter control labels;
- formatting helpers;
- empty state text.

## 12. Verification

Passed:

- `npx tsc --noEmit --pretty false` in `apps/backend`
- `npx tsc --noEmit --pretty false` in `apps/storefront`
- `npm --workspace @dtc/backend run build`
- `npm --workspace @dtc/storefront run build`
- `npm run build`
- `npx medusa exec ./src/scripts/seed-configurator-defaults.ts`

`npx medusa lint` did not pass because Medusa CLI reports ESLint is not installed in the backend project. This is the same existing CLI/lint issue; backend build succeeds.

HTTP checks passed:

- `/servers`
- `/servers/hpe-proliant-dl360-gen10-8sff`
- `/servers/hpe-proliant-dl360-gen10-10sff-nvme-premium`
- `/servers/hpe-proliant-dl360-gen10-4lff`
- `GET /store/server-configurator/models`
- `GET /store/server-configurator/catalog-facets`
- `GET /store/server-configurator/models/:slug/options`
- `POST /store/server-configurator/validate`

Validation checks passed:

- base 8SFF blocks NVMe drives;
- NVMe Media Bay allows 2 NVMe drives;
- NVMe Media Bay blocks 3 NVMe drives;
- SAS/SATA Media Bay allows 10 SAS/SATA drives;
- 4LFF does not expose NVMe drives;
- FlexibleLOM and total NIC limits block invalid selections.

## 13. Recommended Schema Changes Before Dell/Supermicro

See `SOURCE_OF_TRUTH_AUDIT.md`.

Most important before expansion:

- first-class applicability relation between server models and components;
- structured NIC/riser slot resources;
- optional `media_bay` enum value;
- backend price source for server cards;
- explicit component-model compatibility matrix.

## 14. Next Stage

1. Build Admin CRUD for server models, components, rules, presets, and annotations.
2. Add component applicability relation instead of using specs/name filters.
3. Add backend pricing source for catalog cards.
4. Normalize imported draft rules one by one and enable only after review.
5. Add Dell R640 as a new backend-driven model family using the manual.
6. Add tests around `/options` grouping and Rules Engine validation cases.
