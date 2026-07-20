import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { deleteComponentPackWorkflow } from "../../../../../workflows/server-configurator/component-packs/delete-component-pack"
import { updateComponentPackWorkflow } from "../../../../../workflows/server-configurator/component-packs/update-component-pack"
import { UpdateComponentPackBody } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const component_pack = await service.retrieveComponentPack(req.params.id)
  const items = await service.listComponentPackItems({ component_pack_id: req.params.id })

  res.json({ component_pack: { ...component_pack, item_count: items.length } })
}

export async function POST(req: MedusaRequest<UpdateComponentPackBody>, res: MedusaResponse) {
  const { result } = await updateComponentPackWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json(result)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await deleteComponentPackWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json(result)
}
