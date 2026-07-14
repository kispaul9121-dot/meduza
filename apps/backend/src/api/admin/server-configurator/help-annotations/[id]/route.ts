import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { deleteHelpAnnotationWorkflow } from "../../../../../workflows/server-configurator/help-annotations/delete-help-annotation"
import { updateHelpAnnotationWorkflow } from "../../../../../workflows/server-configurator/help-annotations/update-help-annotation"
import { UpdateHelpAnnotationBody } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const annotation = await service.retrieveHelpAnnotation(req.params.id)

  res.json({ annotation })
}

export async function POST(req: MedusaRequest<UpdateHelpAnnotationBody>, res: MedusaResponse) {
  const { result } = await updateHelpAnnotationWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json(result)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await deleteHelpAnnotationWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json(result)
}
