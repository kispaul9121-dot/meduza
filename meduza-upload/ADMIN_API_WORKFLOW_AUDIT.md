# Admin API Workflow Audit

Дата: 2026-07-13
Проект: `D:\Meduza site`

## MCP status

Medusa MCP remote server добавлен ранее, но текущая Codex session все еще не показывает Medusa MCP tools через `tool_search`. Для callable MCP tools нужен reload/auth Medusa Cloud OAuth или Personal Access Key. В этой задаче использованы локальные skills `building-with-medusa` и официальные Medusa docs patterns.

## Общий результат

Mutation routes `Server Configurator` переведены на Medusa workflow слой:

`Module -> Workflow Step -> Workflow -> API Route -> Admin UI`

GET routes продолжают читать через module service/query. Store API, storefront, cart/add-to-cart/order snapshot не изменялись.

## Validation

Добавлено:

- `apps/backend/src/api/admin/server-configurator/validators.ts`
- `apps/backend/src/api/admin/server-configurator/middlewares.ts`
- `apps/backend/src/api/middlewares.ts`

Используется `validateAndTransformBody` для POST mutation routes. DELETE routes body не используют, поэтому Zod body validation для DELETE не подключалась.

## Route audit

| Route | File | What it does | Direct service before | Validation | Workflow | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /admin/server-configurator/models` | `models/route.ts` | create server model | yes | `CreateServerModelSchema` | `createServerModelWorkflow` | medium: stricter required fields |
| `POST /admin/server-configurator/models/:id` | `models/[id]/route.ts` | update server model | yes | `UpdateServerModelSchema` | `updateServerModelWorkflow` | low |
| `DELETE /admin/server-configurator/models/:id` | `models/[id]/route.ts` | delete server model | yes | no body | `deleteServerModelWorkflow` | medium: delete has no compensation |
| `POST /admin/server-configurator/models/:id/duplicate` | `models/[id]/duplicate/route.ts` | duplicate server model disabled | yes | no body | `duplicateServerModelWorkflow` | low |
| `POST /admin/server-configurator/components` | `components/route.ts` | create component | yes | `CreateComponentSchema` | `createComponentWorkflow` | medium: stricter enum/type validation |
| `POST /admin/server-configurator/components/:id` | `components/[id]/route.ts` | update component | yes | `UpdateComponentSchema` | `updateComponentWorkflow` | low |
| `DELETE /admin/server-configurator/components/:id` | `components/[id]/route.ts` | delete component | yes | no body | `deleteComponentWorkflow` | medium: delete has no compensation |
| `POST /admin/server-configurator/components/:id/duplicate` | `components/[id]/duplicate/route.ts` | duplicate component disabled | yes | no body | `duplicateComponentWorkflow` | low |
| `POST /admin/server-configurator/components/:id/applicability` | `components/[id]/applicability/route.ts` | update `specs_json.applicability` and return dry-run preview | yes | `UpdateComponentApplicabilitySchema` | `updateComponentApplicabilityWorkflow` | low |
| `POST /admin/server-configurator/rules` | `rules/route.ts` | create compatibility rule | yes | `CreateRuleSchema` | `createRuleWorkflow` | medium: enum validation |
| `POST /admin/server-configurator/rules/:id` | `rules/[id]/route.ts` | update compatibility rule | yes | `UpdateRuleSchema` | `updateRuleWorkflow` | low |
| `DELETE /admin/server-configurator/rules/:id` | `rules/[id]/route.ts` | delete compatibility rule | yes | no body | `deleteRuleWorkflow` | medium: delete has no compensation |
| `POST /admin/server-configurator/rules/:id/duplicate` | `rules/[id]/duplicate/route.ts` | duplicate rule as disabled draft | yes | no body | `duplicateRuleWorkflow` | low |
| `POST /admin/server-configurator/rules/:id/review` | `rules/[id]/review/route.ts` | mark rule reviewed | yes | `ReviewRuleSchema` | `reviewRuleWorkflow` | low |
| `POST /admin/server-configurator/rules/:id/enable-with-confirmation` | `rules/[id]/enable-with-confirmation/route.ts` | enable imported draft after confirmation | yes | `EnableRuleWithConfirmationSchema` | `enableRuleWithConfirmationWorkflow` | low |
| `POST /admin/server-configurator/rule-presets` | `rule-presets/route.ts` | create rule preset | yes | `CreateRulePresetSchema` | `createRulePresetWorkflow` | medium: required name/category |
| `POST /admin/server-configurator/rule-presets/:id` | `rule-presets/[id]/route.ts` | update rule preset | yes | `UpdateRulePresetSchema` | `updateRulePresetWorkflow` | low |
| `DELETE /admin/server-configurator/rule-presets/:id` | `rule-presets/[id]/route.ts` | delete rule preset | yes | no body | `deleteRulePresetWorkflow` | medium: delete has no compensation |
| `POST /admin/server-configurator/rule-presets/:id/duplicate` | `rule-presets/[id]/duplicate/route.ts` | duplicate preset disabled | yes | no body | `duplicateRulePresetWorkflow` | low |
| `POST /admin/server-configurator/rule-presets/:id/create-rule` | `rule-presets/[id]/create-rule/route.ts` | create disabled rule from preset | yes | `CreateRuleFromPresetSchema` | `createRuleFromPresetWorkflow` | low |
| `POST /admin/server-configurator/help-annotations` | `help-annotations/route.ts` | create help annotation | yes | `CreateHelpAnnotationSchema` | `createHelpAnnotationWorkflow` | medium: required practical fields |
| `POST /admin/server-configurator/help-annotations/:id` | `help-annotations/[id]/route.ts` | update help annotation | yes | `UpdateHelpAnnotationSchema` | `updateHelpAnnotationWorkflow` | low |
| `DELETE /admin/server-configurator/help-annotations/:id` | `help-annotations/[id]/route.ts` | delete help annotation | yes | no body | `deleteHelpAnnotationWorkflow` | medium: delete has no compensation |

Additional validated POST:

| Route | File | Validation | Note |
| --- | --- | --- | --- |
| `POST /admin/server-configurator/simulate` | `simulate/route.ts` | `SimulateConfigurationSchema` | Still calls Rules Engine read/validation service, not CRUD mutation |

## Created workflows

Models:

- `createServerModelWorkflow`
- `updateServerModelWorkflow`
- `deleteServerModelWorkflow`
- `duplicateServerModelWorkflow`

Components:

- `createComponentWorkflow`
- `updateComponentWorkflow`
- `deleteComponentWorkflow`
- `duplicateComponentWorkflow`
- `updateComponentApplicabilityWorkflow`

Rules:

- `createRuleWorkflow`
- `updateRuleWorkflow`
- `deleteRuleWorkflow`
- `duplicateRuleWorkflow`
- `reviewRuleWorkflow`
- `enableRuleWithConfirmationWorkflow`

Rule presets:

- `createRulePresetWorkflow`
- `updateRulePresetWorkflow`
- `deleteRulePresetWorkflow`
- `duplicateRulePresetWorkflow`
- `createRuleFromPresetWorkflow`

Help annotations:

- `createHelpAnnotationWorkflow`
- `updateHelpAnnotationWorkflow`
- `deleteHelpAnnotationWorkflow`

Shared:

- `apps/backend/src/workflows/server-configurator/shared/steps.ts`
- `apps/backend/src/workflows/server-configurator/shared/types.ts`

## Notes

- Create/update/duplicate workflows have compensation where practical.
- Delete workflows return `{ id, deleted: true }` and do not restore deleted rows automatically.
- Imported draft rule confirmation is enforced inside `enableRuleWithConfirmationStep`.
- API response shapes were kept compatible with Admin UI.
- No draft rules were enabled automatically.
- Runtime fallback was not changed.
