import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"
import { canonicalComponentPayload, componentContractErrors, componentTypeDefinitionErrors } from "../../../modules/server-configurator/domain-contracts"

type ApplyInput = Record<string, any> & { actor_id: string; entity_kind: "direct_component" | "component_pack" | "assembly_bundle" | "storage_topology" }

async function safeDelete(service: any, method: string, id?: string) {
  if (!id) return
  try { await service[method](id) } catch { /* compensation is best-effort and idempotent */ }
}

const applySmartBuilderStep = createStep(
  "apply-smart-builder",
  async (input: ApplyInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const created: Array<{ type: string; id: string; delete_method: string }> = []
    let primary: any
    let assignment: any
    try {
      if (input.entity_kind === "direct_component") {
        const payload = canonicalComponentPayload(input.component)
        const errors = componentContractErrors(payload)
        const definitions = await service.listComponentTypeDefinitions({ key: payload.type, enabled: true })
        errors.push(...componentTypeDefinitionErrors(definitions[0] || null))
        if (payload.part_number) {
          const duplicate = await service.listComponents({ part_number: payload.part_number })
          if (duplicate.length) errors.push(`Part number ${payload.part_number} already exists.`)
        }
        if (errors.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, errors.join(" "))
        primary = await service.createComponents(payload)
        created.push({ type: "component", id: primary.id, delete_method: "deleteComponents" })
        assignment = await service.createServerModelComponentAssignments({ ...input.assignment, server_model_id: input.server_model_id, component_id: primary.id, enabled: true })
        created.push({ type: "server_model_component_assignment", id: assignment.id, delete_method: "deleteServerModelComponentAssignments" })
      }
      if (["component_pack", "assembly_bundle"].includes(input.entity_kind)) {
        primary = await service.createComponentPacks({ ...input.pack, pack_kind: input.entity_kind === "assembly_bundle" ? "assembly_bundle" : input.pack.pack_kind || "candidate_pool", enabled: false })
        created.push({ type: "component_pack", id: primary.id, delete_method: "deleteComponentPacks" })
        for (const [index, component_id] of input.component_ids.entries()) {
          const item = await service.createComponentPackItems({ component_pack_id: primary.id, component_id, sort_order: (index + 1) * 10, enabled: true })
          created.push({ type: "component_pack_item", id: item.id, delete_method: "deleteComponentPackItems" })
        }
        if (input.assignment) {
          assignment = await service.createPackAssignments({ ...input.assignment, component_pack_id: primary.id, enabled: true, priority: 100 })
          created.push({ type: "pack_assignment", id: assignment.id, delete_method: "deletePackAssignments" })
        }
      }
      if (input.entity_kind === "storage_topology") {
        const total = input.cage.bay_groups.reduce((sum: number, group: any) => sum + Number(group.count), 0)
        const zones = input.cage.bay_groups.map((group: any) => ({ id: group.zone_id, capacity: group.max_populated || group.count, protocols: group.protocols, form_factors: [group.native_form_factor], accepted_form_factors: group.accepted_form_factors, adapters: group.adapter_component_id ? Object.fromEntries(group.accepted_form_factors.map((form: string) => [form, group.adapter_component_id])) : {} }))
        if (zones.reduce((sum: number, zone: any) => sum + Number(zone.capacity), 0) > total) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Zone capacity exceeds physical bay count.")
        const cage = await service.createStorageCageDefinitions({ name: input.cage.name, location: input.cage.location, bay_groups_json: input.cage.bay_groups, hot_swap: input.cage.hot_swap, max_total_drives: total, source_doc_reference: input.cage.source_doc_reference, enabled: false, schema_version: 1 })
        created.push({ type: "storage_cage_definition", id: cage.id, delete_method: "deleteStorageCageDefinitions" })
        const backplane = await service.createBackplaneVariants({ ...input.backplane, enabled: false, schema_version: 1 })
        created.push({ type: "backplane_variant", id: backplane.id, delete_method: "deleteBackplaneVariants" })
        primary = await service.createServerStorageOptions({ ...input.option, server_model_id: input.server_model_id, storage_cages_json: [cage.id], backplane_variants_json: [backplane.id], drive_limits_json: Object.fromEntries(input.backplane.supported_protocols.map((protocol: string) => [protocol, zones.filter((zone: any) => zone.protocols.includes(protocol)).reduce((sum: number, zone: any) => sum + zone.capacity, 0)])), suggested_drive_packs_json: [], enabled: false, schema_version: 1 })
        created.push({ type: "server_storage_option", id: primary.id, delete_method: "deleteServerStorageOptions" })
        const topology = await service.createStorageTopologies({ owner_type: "storage_option", owner_id: primary.id, zones_json: zones, requirements_json: { cage_id: cage.id, backplane_id: backplane.id, controller: input.backplane.required_controller_capabilities_json, cables: input.backplane.required_cables_json }, provides_json: input.backplane.provides_json, consumes_json: input.backplane.consumes_json, conflicts_json: input.backplane.conflicts_json, source_doc_reference: input.option.source_doc_reference, schema_version: 1 })
        created.push({ type: "storage_topology", id: topology.id, delete_method: "deleteStorageTopologies" })
      }
      const validation = input.server_model_id ? await service.validateCompatibilityReadiness({ server_model_id: input.server_model_id, mode: "assisted_preview", partial: true }) : null
      const audit = await service.createAdminAuditEvents({ actor_id: input.actor_id, action: "apply", entity_type: input.entity_kind, entity_id: primary?.id || null, before_json: null, after_json: { primary, assignment, created: created.map(({ type, id }) => ({ type, id })) }, context_json: { return_to: input.return_to, source_context: input.source_context } })
      created.push({ type: "server_configurator_admin_audit_event", id: audit.id, delete_method: "deleteAdminAuditEvents" })
      return new StepResponse({ created: primary, assignment, validation, return_to: input.return_to, highlight_id: primary?.id, audit_event_id: audit.id }, created)
    } catch (error) {
      for (const item of [...created].reverse()) await safeDelete(service, item.delete_method, item.id)
      throw error
    }
  },
  async (created, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    for (const item of [...(created || [])].reverse()) await safeDelete(service, item.delete_method, item.id)
  }
)

export const applySmartBuilderWorkflow = createWorkflow("apply-smart-builder", function (input: ApplyInput) {
  return new WorkflowResponse(applySmartBuilderStep(input))
})
