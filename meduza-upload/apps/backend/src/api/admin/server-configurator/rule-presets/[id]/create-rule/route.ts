import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createRuleFromPresetWorkflow } from "../../../../../../workflows/server-configurator/rule-presets/create-rule-from-preset"
import { CreateRuleFromPresetBody } from "../../../validators"

export async function POST(req: MedusaRequest<CreateRuleFromPresetBody>, res: MedusaResponse) {
  const { result } = await createRuleFromPresetWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody || {} },
  })

  res.status(201).json(result)
}
