import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../../modules/server-configurator"
import { KNOWLEDGE_ENTITY_DESCRIPTORS, KNOWLEDGE_ENTITY_TYPES, KnowledgeEntityType, mutateKnowledgeEntityWorkflow } from "../../../../../../workflows/server-configurator/knowledge-base/mutate-entity"
import { KnowledgeEntityMutationBody } from "../../../validators"

function entityType(value: string): KnowledgeEntityType {
  if (!(KNOWLEDGE_ENTITY_TYPES as readonly string[]).includes(value)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unsupported knowledge entity ${value}.`)
  return value as KnowledgeEntityType
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const type = entityType(req.params.entity_type)
  const entity = await (req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any)[KNOWLEDGE_ENTITY_DESCRIPTORS[type].retrieve](req.params.id)
  res.json({ entity_type: type, entity })
}

export async function POST(req: MedusaRequest<KnowledgeEntityMutationBody>, res: MedusaResponse) {
  const type = entityType(req.params.entity_type)
  if (req.validatedBody.entity_type !== type) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Body entity_type does not match route.")
  const actor_id = (req as any).auth_context?.actor_id || "authenticated-admin"
  const { result } = await mutateKnowledgeEntityWorkflow(req.scope).run({ input: { operation: "update", entity_type: type, id: req.params.id, data: req.validatedBody.data, actor_id, context: { return_to: req.validatedBody.return_to } } })
  const catalog_index_validation = type === "property_definition"
    ? await (req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any).validateCatalogIndex()
    : undefined
  res.json({ ...result, catalog_index_validation })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const type = entityType(req.params.entity_type)
  const actor_id = (req as any).auth_context?.actor_id || "authenticated-admin"
  const { result } = await mutateKnowledgeEntityWorkflow(req.scope).run({ input: { operation: "delete", entity_type: type, id: req.params.id, actor_id } })
  const catalog_index_validation = type === "property_definition"
    ? await (req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any).validateCatalogIndex()
    : undefined
  res.json({ ...result, catalog_index_validation })
}
