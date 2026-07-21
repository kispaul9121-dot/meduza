import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"

type RepairSessionBody = {
  server_model_id?: string
  finding?: {
    code?: string
    severity?: string
    explanation?: string
    repair_action?: Record<string, unknown>
    deep_link?: string
    step?: number
    affected_entity?: Record<string, unknown>
  }
}

export async function POST(req: MedusaRequest<RepairSessionBody>, res: MedusaResponse) {
  const body = (req.body || {}) as RepairSessionBody
  if (!body.server_model_id || !body.finding?.code || !body.finding?.deep_link) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "server_model_id and a structured readiness finding are required.",
    )
  }

  const actorId = (req as any).auth_context?.actor_id || "authenticated-admin"
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const model = await service.retrieveServerModel(body.server_model_id)
  const session = await service.createCreationWizardSessions({
    owner_id: actorId,
    current_step: String(body.finding.step || 14),
    draft_payload_json: {
      schema: "publishing-repair.v1",
      server_model_id: model.id,
      server_model_slug: model.slug,
      finding: body.finding,
      return_to: "/server-configurator/publishing-assistant",
    },
    mode_hint: "publication_repair",
    status: "draft",
    schema_version: 1,
  })

  await service.createAdminAuditEvents({
    actor_id: actorId,
    action: "create",
    entity_type: "publication_repair_session",
    entity_id: session.id,
    before_json: null,
    after_json: {
      server_model_id: model.id,
      finding_code: body.finding.code,
      deep_link: body.finding.deep_link,
    },
    context_json: { source: "publishing_assistant" },
  })

  res.status(201).json({
    repair_session: session,
    deep_link: body.finding.deep_link,
  })
}
