import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { deleteComponentWorkflow } from "../../../../../workflows/server-configurator/components/delete-component"
import { updateComponentWorkflow } from "../../../../../workflows/server-configurator/components/update-component"
import { UpdateComponentBody } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const component = await service.retrieveComponent(req.params.id)

  res.json({ component })
}

export async function POST(req: MedusaRequest<UpdateComponentBody>, res: MedusaResponse) {
  const { result } = await updateComponentWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json(result)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await deleteComponentWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json(result)
}
