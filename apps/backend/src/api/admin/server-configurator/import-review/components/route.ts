import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { boolQuery, hasValue, pageRows, specs, text } from "../helpers"

function logicalType(component: any) {
  const data = specs(component)
  if (component.type === "backplane" && data.media_bay) return "media_bay"
  return component.type
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const all = await service.listComponents({}, { take: 10000, order: { type: "ASC", public_name: "ASC" } })
  const q = text(req.query.q).toLowerCase()
  const type = text(req.query.type)
  const enabled = boolQuery(req.query.enabled)
  const sourceFile = text(req.query.source_file)

  const filtered = all.filter((component: any) => {
    const data = specs(component)
    const haystack = [component.public_name, component.model, component.part_number, component.short_name].join(" ").toLowerCase()
    if (type && logicalType(component) !== type) return false
    if (enabled !== undefined && Boolean(component.enabled) !== enabled) return false
    if (sourceFile && data.source_file !== sourceFile) return false
    if (req.query.has_warnings === "true" && !hasValue(data.warnings)) return false
    if (req.query.has_source_price === "true" && !hasValue(data.source_price)) return false
    if (req.query.has_applicability === "true" && !hasValue(data.applicability_hints)) return false
    if (q && !haystack.includes(q)) return false
    return data.source === "pauloud 2" || hasValue(data.source_file)
  })

  const page = pageRows(filtered, req.query.limit, req.query.offset)
  res.json({ components: page.rows, count: page.count, limit: page.limit, offset: page.offset })
}
