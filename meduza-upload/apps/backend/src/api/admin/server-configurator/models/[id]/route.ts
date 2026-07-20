import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { deleteServerModelWorkflow } from "../../../../../workflows/server-configurator/models/delete-server-model"
import { updateServerModelWorkflow } from "../../../../../workflows/server-configurator/models/update-server-model"
import { UpdateServerModelBody } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const model = await service.retrieveServerModel(req.params.id)

  res.json({ model })
}

export async function POST(req: MedusaRequest<UpdateServerModelBody>, res: MedusaResponse) {
  const { result } = await updateServerModelWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json(result)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await deleteServerModelWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json(result)
}
