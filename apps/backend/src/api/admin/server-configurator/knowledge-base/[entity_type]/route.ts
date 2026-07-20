import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { KNOWLEDGE_ENTITY_DESCRIPTORS, KNOWLEDGE_ENTITY_TYPES, KnowledgeEntityType, mutateKnowledgeEntityWorkflow } from "../../../../../workflows/server-configurator/knowledge-base/mutate-entity"
import { KnowledgeEntityMutationBody } from "../../validators"

function entityType(value: string): KnowledgeEntityType {
  if (!(KNOWLEDGE_ENTITY_TYPES as readonly string[]).includes(value)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unsupported knowledge entity ${value}.`)
  return value as KnowledgeEntityType
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const type = entityType(req.params.entity_type)
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const descriptor = KNOWLEDGE_ENTITY_DESCRIPTORS[type]
  const limit = Math.min(Number(req.query.limit || 100), 500)
  const offset = Math.max(Number(req.query.offset || 0), 0)
  const filters = Object.fromEntries(["server_model_id", "scope_id", "owner_id", "component_id", "enabled", "status", "lifecycle_status"]
    .filter((key) => req.query[key] !== undefined && req.query[key] !== "")
    .map((key) => [key, key === "enabled" ? req.query[key] === "true" : req.query[key]]))
  const [rows, count] = await service[descriptor.list](filters, { take: limit, skip: offset, order: { updated_at: "DESC" } })
  const search = String(req.query.q || "").trim().toLowerCase()
  const entities = search ? rows.filter((row: any) => [row.key, row.name, row.label, row.display_name, row.vendor, row.source_id, row.target_id].filter(Boolean).join(" ").toLowerCase().includes(search)) : rows
  res.json({ entity_type: type, entities, count: search ? entities.length : count })
}

export async function POST(req: MedusaRequest<KnowledgeEntityMutationBody>, res: MedusaResponse) {
  const type = entityType(req.params.entity_type)
  if (req.validatedBody.entity_type !== type) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Body entity_type does not match route.")
  const actor_id = (req as any).auth_context?.actor_id || "authenticated-admin"
  const { result } = await mutateKnowledgeEntityWorkflow(req.scope).run({ input: { operation: "create", entity_type: type, data: req.validatedBody.data, actor_id, context: { return_to: req.validatedBody.return_to } } })
  const catalog_index_validation = type === "property_definition"
    ? await (req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any).validateCatalogIndex()
    : undefined
  res.status(201).json({ ...result, catalog_index_validation })
}
