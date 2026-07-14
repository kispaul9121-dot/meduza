import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { enableRuleWithConfirmationWorkflow } from "../../../../../../workflows/server-configurator/rules/enable-rule-with-confirmation"
import { EnableRuleWithConfirmationBody } from "../../../validators"

export async function POST(req: MedusaRequest<EnableRuleWithConfirmationBody>, res: MedusaResponse) {
  const { result } = await enableRuleWithConfirmationWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  res.json(result)
}
