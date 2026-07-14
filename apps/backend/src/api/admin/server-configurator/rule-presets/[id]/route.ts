import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { deleteRulePresetWorkflow } from "../../../../../workflows/server-configurator/rule-presets/delete-rule-preset"
import { updateRulePresetWorkflow } from "../../../../../workflows/server-configurator/rule-presets/update-rule-preset"
import { UpdateRulePresetBody } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const preset = await service.retrieveRulePreset(req.params.id)

  res.json({ preset })
}

export async function POST(req: MedusaRequest<UpdateRulePresetBody>, res: MedusaResponse) {
  const { result } = await updateRulePresetWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json(result)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await deleteRulePresetWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json(result)
}
