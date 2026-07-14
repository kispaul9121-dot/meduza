import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { createRulePresetWorkflow } from "../../../../workflows/server-configurator/rule-presets/create-rule-preset"
import { CreateRulePresetBody } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const filters = req.query.category ? { category: req.query.category } : {}
  const [presets, count] = await service.listAndCountRulePresets(filters, {
    take: Number(req.query.limit || 100),
    skip: Number(req.query.offset || 0),
    order: { category: "ASC", name: "ASC" },
  })

  res.json({ presets, count })
}

export async function POST(req: MedusaRequest<CreateRulePresetBody>, res: MedusaResponse) {
  const { result } = await createRulePresetWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json(result)
}
