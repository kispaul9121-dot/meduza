import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { mutateKnowledgeEntityWorkflow } from "../../../../../workflows/server-configurator/knowledge-base/mutate-entity"
import { SmartBuilderDraftBody } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const actor_id = (req as any).auth_context?.actor_id || "authenticated-admin"
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const [drafts, count] = await service.listAndCountCreationWizardSessions({ owner_id: actor_id, mode_hint: "smart_component_pack", status: ["draft", "ready", "failed"] }, { take: 100, order: { updated_at: "DESC" } })
  res.json({ drafts, count })
}

export async function POST(req: MedusaRequest<SmartBuilderDraftBody>, res: MedusaResponse) {
  const actor_id = (req as any).auth_context?.actor_id || "authenticated-admin"
  const body = req.validatedBody
  const { result } = await mutateKnowledgeEntityWorkflow(req.scope).run({ input: {
    operation: body.id ? "update" : "create",
    entity_type: "creation_wizard_session",
    id: body.id,
    actor_id,
    data: { owner_id: actor_id, current_step: body.current_step, draft_payload_json: body.draft_payload_json, mode_hint: body.mode_hint, status: body.status, schema_version: 1 },
    context: { autosave: true },
  } })
  res.status(body.id ? 200 : 201).json(result)
}
