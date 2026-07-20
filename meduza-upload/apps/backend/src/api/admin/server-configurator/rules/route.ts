import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { createRuleWorkflow } from "../../../../workflows/server-configurator/rules/create-rule"
import { CreateRuleBody } from "../validators"

const filterKeys = ["enabled", "category", "rule_type", "scope_type", "source_doc_reference"]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const draft = req.query.draft
  const filters = Object.fromEntries(
    filterKeys
      .filter((key) => req.query[key] !== undefined && req.query[key] !== "")
      .map((key) => [key, key === "enabled" ? req.query[key] === "true" : req.query[key]])
  )
  const [rows] = await service.listAndCountCompatibilityRules(filters, {
    take: 1000,
    skip: 0,
    order: { priority: "ASC" },
  })
  const filtered = draft === undefined
    ? rows
    : rows.filter((rule: any) => {
        const text = [rule.admin_note, rule.source_doc_reference].filter(Boolean).join(" ").toLowerCase()
        const isDraft = !rule.enabled && (text.includes("draft") || text.includes("payloud") || text.includes("pauloud"))
        return draft === "true" ? isDraft : !isDraft
      })
  const offset = Number(req.query.offset || 0)
  const limit = Number(req.query.limit || 100)

  res.json({ rules: filtered.slice(offset, offset + limit), count: filtered.length })
}

export async function POST(req: MedusaRequest<CreateRuleBody>, res: MedusaResponse) {
  const { result } = await createRuleWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json(result)
}
