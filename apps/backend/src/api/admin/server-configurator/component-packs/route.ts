import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { createComponentPackWorkflow } from "../../../../workflows/server-configurator/component-packs/create-component-pack"
import { CreateComponentPackBody } from "../validators"

function hasText(row: any, q: string) {
  return [row.name, row.slug, row.description, row.source_doc_reference]
    .filter(Boolean).join(" ").toLowerCase().includes(q)
}

function hasScope(row: any, key: string, value: unknown) {
  if (!value) return true
  return Array.isArray(row[key]) && row[key].map(String).includes(String(value))
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const [rows] = await service.listAndCountComponentPacks({}, {
    take: 1000,
    skip: 0,
    order: { name: "ASC" },
  })
  const items = await service.listComponentPackItems({}, { take: 10000 })
  const counts = items.reduce((acc: Record<string, number>, item: any) => {
    acc[item.component_pack_id] = (acc[item.component_pack_id] || 0) + 1
    return acc
  }, {})
  const q = String(req.query.q || "").toLowerCase()
  const filtered = rows.filter((row: any) => {
    return (!q || hasText(row, q)) &&
      (!req.query.component_type || row.component_type === req.query.component_type) &&
      (req.query.enabled === undefined || row.enabled === (req.query.enabled === "true")) &&
      hasScope(row, "brand_scope", req.query.brand_scope) &&
      hasScope(row, "generation_scope", req.query.generation_scope) &&
      hasScope(row, "family_scope", req.query.family_scope)
  })
  const offset = Number(req.query.offset || 0)
  const limit = Number(req.query.limit || 100)

  res.json({
    component_packs: filtered.slice(offset, offset + limit).map((row: any) => ({
      ...row,
      item_count: counts[row.id] || 0,
    })),
    count: filtered.length,
  })
}

export async function POST(req: MedusaRequest<CreateComponentPackBody>, res: MedusaResponse) {
  const { result } = await createComponentPackWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json(result)
}
