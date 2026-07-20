import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"

type Input = { assignment_id: string; name: string; slug: string; source_reference?: string | null; actor_id: string }

async function ignoreDelete(service: any, method: string, id?: string) {
  if (!id) return
  try { await service[method](id) } catch { /* idempotent compensation */ }
}

const convertStep = createStep("convert", async (input: Input, { container }) => {
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const assignment = await service.retrieveServerModelComponentAssignment(input.assignment_id)
  const component = await service.retrieveComponent(assignment.component_id)
  let pack: any
  let item: any
  let packAssignment: any
  let audit: any
  try {
    pack = await service.createComponentPacks({ name: input.name, slug: input.slug, description: `Converted from direct assignment ${assignment.id}`, component_type: component.type, pack_kind: "candidate_pool", enabled: false, source_doc_reference: input.source_reference || assignment.source_doc_reference })
    item = await service.createComponentPackItems({ component_pack_id: pack.id, component_id: component.id, sort_order: 10, enabled: true, note: "Converted from direct assignment" })
    packAssignment = await service.createPackAssignments({ scope_type: "server_model", scope_id: assignment.server_model_id, component_pack_id: pack.id, enabled: true, priority: 100, inheritance_behavior: "inherit", assignment_source: "convert_direct_to_pack", source_reference: input.source_reference || assignment.source_doc_reference })
    await service.deleteServerModelComponentAssignments(assignment.id)
    audit = await service.createAdminAuditEvents({ actor_id: input.actor_id, action: "apply", entity_type: "direct_to_pack", entity_id: pack.id, before_json: assignment, after_json: { pack, item, pack_assignment: packAssignment }, context_json: { component_id: component.id } })
    return new StepResponse({ pack, pack_assignment: packAssignment, removed_direct_assignment_id: assignment.id, audit_event_id: audit.id }, { assignment, pack_id: pack.id, item_id: item.id, pack_assignment_id: packAssignment.id, audit_id: audit.id })
  } catch (error) {
    await ignoreDelete(service, "deleteAdminAuditEvents", audit?.id)
    await ignoreDelete(service, "deletePackAssignments", packAssignment?.id)
    await ignoreDelete(service, "deleteComponentPackItems", item?.id)
    await ignoreDelete(service, "deleteComponentPacks", pack?.id)
    const existing = await service.listServerModelComponentAssignments({ id: assignment.id })
    if (!existing.length) await service.createServerModelComponentAssignments(assignment)
    throw error
  }
}, async (undo, { container }) => {
  if (!undo) return
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
  await ignoreDelete(service, "deleteAdminAuditEvents", undo.audit_id)
  await ignoreDelete(service, "deletePackAssignments", undo.pack_assignment_id)
  await ignoreDelete(service, "deleteComponentPackItems", undo.item_id)
  await ignoreDelete(service, "deleteComponentPacks", undo.pack_id)
  const existing = await service.listServerModelComponentAssignments({ id: undo.assignment.id })
  if (!existing.length) await service.createServerModelComponentAssignments(undo.assignment)
})

export const convertDirectToPackWorkflow = createWorkflow("convert-direct-to-pack", function (input: Input) {
  return new WorkflowResponse(convertStep(input))
})
