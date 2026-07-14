import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reviewRuleWorkflow } from "../../../../../../workflows/server-configurator/rules/review-rule"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await reviewRuleWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json(result)
}
