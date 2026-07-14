import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { pageRows, text } from "../helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const all = await service.listRulePresets({}, { take: 10000, order: { category: "ASC", name: "ASC" } })
  const q = text(req.query.q).toLowerCase()
  const category = text(req.query.category)
  const filtered = all.filter((preset: any) => {
    const haystack = [preset.name, preset.description, preset.category].join(" ").toLowerCase()
    if (category && preset.category !== category) return false
    if (q && !haystack.includes(q)) return false
    return text(preset.description).toLowerCase().includes("pauloud 2")
  })

  const page = pageRows(filtered, req.query.limit, req.query.offset)
  res.json({ presets: page.rows, count: page.count, limit: page.limit, offset: page.offset })
}
