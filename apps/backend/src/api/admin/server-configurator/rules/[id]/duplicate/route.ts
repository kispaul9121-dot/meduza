import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { duplicateRuleWorkflow } from "../../../../../../workflows/server-configurator/rules/duplicate-rule"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await duplicateRuleWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(201).json(result)
}
