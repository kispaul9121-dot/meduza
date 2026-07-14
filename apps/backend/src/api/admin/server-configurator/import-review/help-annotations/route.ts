import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { boolQuery, pageRows, text } from "../helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const all = await service.listHelpAnnotations({}, { take: 10000, order: { page: "ASC", key: "ASC" } })
  const q = text(req.query.q).toLowerCase()
  const enabled = boolQuery(req.query.enabled)
  const pageFilter = text(req.query.page)

  const filtered = all.filter((item: any) => {
    const haystack = [item.key, item.title, item.body, item.source_doc_reference].join(" ").toLowerCase()
    if (enabled !== undefined && Boolean(item.enabled) !== enabled) return false
    if (pageFilter && item.page !== pageFilter) return false
    if (q && !haystack.includes(q)) return false
    return text(item.source_doc_reference).toLowerCase().includes("pauloud")
  })

  const page = pageRows(filtered, req.query.limit, req.query.offset)
  res.json({ annotations: page.rows, count: page.count, limit: page.limit, offset: page.offset })
}
