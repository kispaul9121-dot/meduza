import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { duplicateRulePresetWorkflow } from "../../../../../../workflows/server-configurator/rule-presets/duplicate-rule-preset"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await duplicateRulePresetWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(201).json(result)
}
