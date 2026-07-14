# Backend Configurator Builder Audit

Date: 2026-07-13
Project: `D:\Meduza site`
Medusa: `2.17.2`

## MCP / Docs

Medusa MCP tools are not callable in this Codex session. I checked available tools and no Medusa MCP server was exposed. Fallback used:

- local skills: `building-with-medusa`, `building-admin-dashboard-customizations`, `building-storefronts`, `storefront-best-practices`;
- existing project reports and code;
- official Medusa patterns already used in the project: Module -> Workflow Step -> Workflow -> API Route -> Admin UI.

## Current State

The `server-configurator` module already has:

- `server_model`
- `component`
- `compatibility_rule`
- `rule_preset`
- `help_annotation`
- `configuration`
- `configuration_item`

`component.specs_json.applicability` is the runtime availability source:

```json
{
  "brands": ["HPE"],
  "families": ["DL360"],
  "generations": ["Gen10"],
  "server_model_slugs": ["hpe-proliant-dl360-gen10-8sff"],
  "chassis_types": ["8SFF"],
  "exclude_server_model_slugs": []
}
```

Store API `/store/server-configurator/models/:slug/options` is DB-first and filters by:

- `enabled = true`;
- `componentAppliesToModel(component, model)`;
- storage/backplane/NIC/RAID runtime filters;
- no normal runtime fallback.

## What Was Already Possible

- CRUD for server models, components, rules, rule presets, annotations.
- Single-component applicability edit and dry-run preview.
- Rule simulator.
- Import review.
- Storefront reads `/options`; real Medusa cart workflow works.

## What Was Inconvenient

- No first-class grouping for large sets of components.
- No bulk add by component specs.
- No pack-level preview/apply/detach.
- No trace showing which applicability was added by a bulk action.
- Admin could not quickly attach all CPUs/RAM/NIC/drives to a family/model.
- Conflict detection was only implicit through rules/simulator, not visible before bulk apply.

## Required Data / UI / API

Needed additions:

- `component_pack` and `component_pack_item` models.
- Pack CRUD and item routes.
- Bulk add filters over component fields and `specs_json`.
- Pack applicability preview/apply/detach workflows.
- Admin list/detail pages for packs.
- Component library filters for CPU-specific metadata.
- Applicability page pack summary.

## Risks

- `specs_json` remains semi-structured; filters on nested fields are partly JS-side for admin tooling.
- Imported Intel CPU data uses fallback draft rows until a full ARK parser/export is available.
- Some HPE Gen10 CPU support requires manual validation by SKU, cooling and BIOS.
- Admin UI browser testing requires an authenticated Medusa Admin session.
