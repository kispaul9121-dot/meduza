import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { boolQuery, pageRows, text } from "../helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const all = await service.listCompatibilityRules({}, { take: 10000, order: { priority: "ASC" } })
  const q = text(req.query.q).toLowerCase()
  const enabled = boolQuery(req.query.enabled)
  const category = text(req.query.category)

  const filtered = all.filter((rule: any) => {
    const action = rule.action_json || {}
    const haystack = [rule.name, rule.message, rule.category, rule.rule_type, rule.source_doc_reference].join(" ").toLowerCase()
    if (enabled !== undefined && Boolean(rule.enabled) !== enabled) return false
    if (category && rule.category !== category) return false
    if (q && !haystack.includes(q)) return false
    return action.draft === true || text(rule.admin_note).toLowerCase().includes("payloud 2 as draft")
  })

  const page = pageRows(filtered, req.query.limit, req.query.offset)
  res.json({ rules: page.rows, count: page.count, limit: page.limit, offset: page.offset })
}
