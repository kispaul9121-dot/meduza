import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { removeComponentFromPackWorkflow } from "../../../../../../../workflows/server-configurator/component-packs/remove-component-from-pack"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await removeComponentFromPackWorkflow(req.scope).run({
    input: { id: req.params.id, item_id: req.params.item_id },
  })

  res.status(200).json(result)
}
