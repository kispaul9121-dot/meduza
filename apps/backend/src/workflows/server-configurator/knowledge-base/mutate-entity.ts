import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"

export const KNOWLEDGE_ENTITY_TYPES = [
  "property_definition",
  "technology_concept",
  "technology_relation",
  "technology_platform",
  "vendor_generation_template",
  "component_type_definition",
  "relation_type_definition",
  "server_model_component_assignment",
  "storage_cage_definition",
  "backplane_variant",
  "server_storage_option",
  "storage_topology",
  "configurator_option_group",
  "creation_wizard_session",
] as const

export type KnowledgeEntityType = typeof KNOWLEDGE_ENTITY_TYPES[number]
export type KnowledgeMutationInput = {
  operation: "create" | "update" | "delete"
  entity_type: KnowledgeEntityType
  id?: string
  data?: Record<string, any>
  actor_id: string
  context?: Record<string, unknown>
}

const descriptors: Record<KnowledgeEntityType, { list: string; create: string; retrieve: string; update: string; delete: string }> = {
  property_definition: { list: "listAndCountPropertyDefinitions", create: "createPropertyDefinitions", retrieve: "retrievePropertyDefinition", update: "updatePropertyDefinitions", delete: "deletePropertyDefinitions" },
  technology_concept: { list: "listAndCountTechnologyConcepts", create: "createTechnologyConcepts", retrieve: "retrieveTechnologyConcept", update: "updateTechnologyConcepts", delete: "deleteTechnologyConcepts" },
  technology_relation: { list: "listAndCountTechnologyRelations", create: "createTechnologyRelations", retrieve: "retrieveTechnologyRelation", update: "updateTechnologyRelations", delete: "deleteTechnologyRelations" },
  technology_platform: { list: "listAndCountTechnologyPlatforms", create: "createTechnologyPlatforms", retrieve: "retrieveTechnologyPlatform", update: "updateTechnologyPlatforms", delete: "deleteTechnologyPlatforms" },
  vendor_generation_template: { list: "listAndCountVendorGenerationTemplates", create: "createVendorGenerationTemplates", retrieve: "retrieveVendorGenerationTemplate", update: "updateVendorGenerationTemplates", delete: "deleteVendorGenerationTemplates" },
  component_type_definition: { list: "listAndCountComponentTypeDefinitions", create: "createComponentTypeDefinitions", retrieve: "retrieveComponentTypeDefinition", update: "updateComponentTypeDefinitions", delete: "deleteComponentTypeDefinitions" },
  relation_type_definition: { list: "listAndCountRelationTypeDefinitions", create: "createRelationTypeDefinitions", retrieve: "retrieveRelationTypeDefinition", update: "updateRelationTypeDefinitions", delete: "deleteRelationTypeDefinitions" },
  server_model_component_assignment: { list: "listAndCountServerModelComponentAssignments", create: "createServerModelComponentAssignments", retrieve: "retrieveServerModelComponentAssignment", update: "updateServerModelComponentAssignments", delete: "deleteServerModelComponentAssignments" },
  storage_cage_definition: { list: "listAndCountStorageCageDefinitions", create: "createStorageCageDefinitions", retrieve: "retrieveStorageCageDefinition", update: "updateStorageCageDefinitions", delete: "deleteStorageCageDefinitions" },
  backplane_variant: { list: "listAndCountBackplaneVariants", create: "createBackplaneVariants", retrieve: "retrieveBackplaneVariant", update: "updateBackplaneVariants", delete: "deleteBackplaneVariants" },
  server_storage_option: { list: "listAndCountServerStorageOptions", create: "createServerStorageOptions", retrieve: "retrieveServerStorageOption", update: "updateServerStorageOptions", delete: "deleteServerStorageOptions" },
  storage_topology: { list: "listAndCountStorageTopologies", create: "createStorageTopologies", retrieve: "retrieveStorageTopology", update: "updateStorageTopologies", delete: "deleteStorageTopologies" },
  configurator_option_group: { list: "listAndCountConfiguratorOptionGroups", create: "createConfiguratorOptionGroups", retrieve: "retrieveConfiguratorOptionGroup", update: "updateConfiguratorOptionGroups", delete: "deleteConfiguratorOptionGroups" },
  creation_wizard_session: { list: "listAndCountCreationWizardSessions", create: "createCreationWizardSessions", retrieve: "retrieveCreationWizardSession", update: "updateCreationWizardSessions", delete: "deleteCreationWizardSessions" },
}

function clean(row: any) {
  if (!row) return row
  const { created_at, updated_at, deleted_at, ...value } = row
  return value
}

const mutateEntityStep = createStep(
  "mutate-entity",
  async (input: KnowledgeMutationInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const descriptor = descriptors[input.entity_type]
    if (!descriptor) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unsupported entity type ${input.entity_type}.`)
    if (input.operation !== "create" && !input.id) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Entity id is required.")
    const before = input.id ? await service[descriptor.retrieve](input.id) : null
    let entity: any
    if (input.operation === "create") entity = await service[descriptor.create](input.data || {})
    if (input.operation === "update") entity = await service[descriptor.update]({ id: input.id, ...(input.data || {}) })
    if (input.operation === "delete") {
      await service[descriptor.delete](input.id)
      entity = before
    }
    return new StepResponse({ entity, before }, { operation: input.operation, entity_type: input.entity_type, id: entity?.id || input.id, before: clean(before) })
  },
  async (undo, { container }) => {
    if (!undo) return
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const descriptor = descriptors[undo.entity_type]
    if (undo.operation === "create") await service[descriptor.delete](undo.id)
    if (undo.operation === "update" && undo.before) await service[descriptor.update](undo.before)
    if (undo.operation === "delete" && undo.before) await service[descriptor.create](undo.before)
  }
)

const recordAuditStep = createStep(
  "record-audit",
  async ({ input, result }: { input: KnowledgeMutationInput; result: { entity: any; before: any } }, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const event = await service.createAdminAuditEvents({
      actor_id: input.actor_id,
      action: input.operation,
      entity_type: input.entity_type,
      entity_id: result.entity?.id || input.id || null,
      before_json: clean(result.before),
      after_json: input.operation === "delete" ? null : clean(result.entity),
      context_json: input.context || null,
    })
    return new StepResponse(event, event.id)
  },
  async (id, { container }) => {
    if (id) await (container.resolve(SERVER_CONFIGURATOR_MODULE) as any).deleteAdminAuditEvents(id)
  }
)

export const mutateKnowledgeEntityWorkflow = createWorkflow(
  "mutate-knowledge-entity",
  function (input: KnowledgeMutationInput) {
    const result = mutateEntityStep(input)
    recordAuditStep({ input, result })
    return new WorkflowResponse(result)
  }
)

export const KNOWLEDGE_ENTITY_DESCRIPTORS = descriptors
