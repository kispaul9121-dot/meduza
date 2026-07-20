# Backend Configurator Builder Result

Date: 2026-07-13
Project: `D:\Meduza site`

## Summary

Implemented backend-driven Component Packs for the existing Medusa `server-configurator` module. Packs are admin tooling only: Store API `/options` still depends on `component.specs_json.applicability`, rules and server model data.

## MCP / Patterns

Medusa MCP was not callable in this session. Used local Medusa skills and existing project patterns:

`Module -> Workflow Step -> Workflow -> API Route -> Admin UI`

## Data Models / Migration

Added:

- `apps/backend/src/modules/server-configurator/models/component-pack.ts`
- `apps/backend/src/modules/server-configurator/models/component-pack-item.ts`
- `apps/backend/src/modules/server-configurator/migrations/Migration20260713170000.ts`

Migration applied with `npx medusa db:migrate`.

## Admin API Routes

Added:

- `GET/POST /admin/server-configurator/component-packs`
- `GET/POST/DELETE /admin/server-configurator/component-packs/:id`
- `POST /admin/server-configurator/component-packs/:id/duplicate`
- `GET/POST /admin/server-configurator/component-packs/:id/items`
- `DELETE /admin/server-configurator/component-packs/:id/items/:item_id`
- `POST /admin/server-configurator/component-packs/:id/items/reorder`
- `POST /admin/server-configurator/component-packs/:id/bulk-add-components`
- `POST /admin/server-configurator/component-packs/:id/preview-applicability`
- `POST /admin/server-configurator/component-packs/:id/apply-applicability`
- `POST /admin/server-configurator/component-packs/:id/detach-applicability`

Admin routes are protected; unauthenticated direct HTTP check returns `401`.

## Workflows

Added workflows under `apps/backend/src/workflows/server-configurator/component-packs/`:

- create/update/delete/duplicate component pack
- add/remove/bulk-add/reorder pack items
- preview/apply/detach pack applicability

Mutation routes call workflows. Preview is also workflow-backed for consistent business logic.

## Validation

Added Zod schemas for:

- create/update pack
- add item
- bulk add
- preview/apply/detach applicability
- reorder items

Registered in `apps/backend/src/api/admin/server-configurator/middlewares.ts`.

## Admin UI

Added:

- `/app/server-configurator/component-packs`
- `/app/server-configurator/component-packs/:id`

Updated:

- Server Configurator navigation
- Components page: quick type filters, CPU filters, Add to Pack
- Applicability page: component/server/pack view summary

Admin browser check reached login screen, so authenticated UI interaction was not completed in this session. Backend Admin build passed.

## Component Packs Behavior

- Bulk Add can add components by explicit IDs or filters.
- Preview shows target server models, visible component IDs and conflicts.
- Apply merges target applicability into every enabled pack item component.
- Detach removes only values recorded in `specs_json.pack_applications[pack_id].added_values`; manual applicability is not touched.

## Conflict Detection

Preview flags:

- pack/component type mismatch;
- HPE/FlexibleLOM on Dell scope;
- Dell/NDC on HPE scope;
- NVMe components on non-NVMe targets;
- CPU socket mismatch;
- CPU generation mismatch;
- very high CPU TDP warning.

## Store API Impact

Packs do not affect runtime directly. They update component applicability. Verified through browser and storefront:

- DL360 page shows imported Intel Xeon Scalable CPUs.
- `Xeon Gold 6130` and `Xeon Gold 6230` appear in the configurator.
- CPU frequency display aliases were fixed after browser QA.

## Sample Packs

Created/seeded:

- Intel Xeon Scalable 1st Gen
- Intel Xeon Scalable 2nd Gen
- Intel Xeon Scalable 1st/2nd Gen for HPE Gen10
- DDR4 RDIMM ECC
- HPE Smart Array Gen10
- Intel/Broadcom PCIe NIC
- HPE FlexibleLOM NIC
- 2.5 SAS/SATA Drives
- 2.5 NVMe U.2 Drives
- 3.5 LFF Drives
- HPE DL360 Gen10 Media Bay Options
- Standard/Performance Cooling

## Checks

Passed:

- `npx tsc --noEmit --pretty false` in backend
- `npx tsc --noEmit --pretty false` in storefront
- `npm --workspace @dtc/backend run build`
- `npm --workspace @dtc/storefront run build`
- `npm run build`
- `npx medusa db:migrate`
- `npx medusa exec ./src/scripts/import-intel-xeon-scalable-cpus.ts`
- `npx medusa exec ./src/scripts/seed-component-packs.ts`

`npx medusa lint` exited 1 because Medusa CLI skipped linting with the existing eslint detection warning.

Browser/storefront:

- `/servers/hpe-proliant-dl360-gen10-8sff`: CPU imports visible.
- Add valid configuration to cart: passed.
- `/servers?view=cart`: passed.
- Cart reload persistence: passed.
- Cart shows CPU/RAM/Storage/RAID/NIC/PSU/Cooling/Media Bay.
- “по запросу” display: passed.
- Browser console errors/warnings: none found.

## Remaining Risks Before Dell R640

- Build a full Intel ARK parser/export or manually verify imported fallback CPU specs.
- Normalize SKU-level HPE/Dell CPU support by BIOS/cooling/TDP.
- Add first-class normalized applicability table when bulk applicability grows beyond packs.
- Add authenticated Admin UI integration tests.
- Expand conflict detection with Dell R640-specific NDC/BOSS/riser facts.
