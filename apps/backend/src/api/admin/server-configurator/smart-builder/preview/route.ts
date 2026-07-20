import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { recommendSmartEntity } from "../../../../../modules/server-configurator/admin-builders"
import { SmartBuilderPreviewBody } from "../../validators"

export async function POST(req: MedusaRequest<SmartBuilderPreviewBody>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const body = req.validatedBody
  const recommendation = recommendSmartEntity(body)
  const [model, chassis, profiles, topologies, assignments, duplicateParts] = await Promise.all([
    body.server_model_id ? service.retrieveServerModel(body.server_model_id).catch(() => null) : null,
    body.server_model_id ? service.listChassisVariants({ server_model_id: body.server_model_id, enabled: true }) : [],
    body.server_model_id ? service.listCapabilityProfiles({ owner_id: body.server_model_id }) : [],
    body.server_model_id ? service.listStorageTopologies({ owner_id: body.server_model_id }) : [],
    body.server_model_id ? service.listServerModelComponentAssignments({ server_model_id: body.server_model_id, enabled: true }) : [],
    service.listComponents({}, { take: 500 }),
  ])
  const readiness = body.server_model_id ? await service.validateCompatibilityReadiness({ server_model_id: body.server_model_id, selected_components: body.selected_components, mode: "assisted_preview", partial: true }) : null
  res.json({
    recommendation,
    server_context: model ? { model, chassis_variants: chassis, capability_profiles: profiles, storage_topologies: topologies, existing_assignments: assignments } : null,
    validation: readiness,
    duplicate_candidates: duplicateParts.filter((component: any) => component.part_number).slice(0, 20).map((component: any) => ({ id: component.id, part_number: component.part_number, public_name: component.public_name })),
    deterministic: true,
    writes_performed: false,
  })
}
