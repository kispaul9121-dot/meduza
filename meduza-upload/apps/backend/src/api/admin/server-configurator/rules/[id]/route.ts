import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { deleteRuleWorkflow } from "../../../../../workflows/server-configurator/rules/delete-rule"
import { updateRuleWorkflow } from "../../../../../workflows/server-configurator/rules/update-rule"
import { UpdateRuleBody } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const rule = await service.retrieveCompatibilityRule(req.params.id)

  res.json({ rule })
}

export async function POST(req: MedusaRequest<UpdateRuleBody>, res: MedusaResponse) {
  const { result } = await updateRuleWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json(result)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await deleteRuleWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json(result)
}
