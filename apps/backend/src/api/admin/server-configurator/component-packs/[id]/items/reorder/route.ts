import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reorderPackItemsWorkflow } from "../../../../../../../workflows/server-configurator/component-packs/reorder-pack-items"
import { ReorderPackItemsBody } from "../../../../validators"

export async function POST(req: MedusaRequest<ReorderPackItemsBody>, res: MedusaResponse) {
  const { result } = await reorderPackItemsWorkflow(req.scope).run({
    input: { id: req.params.id, items: req.validatedBody.items },
  })

  res.json(result)
}
