import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { bulkAddComponentsToPackWorkflow } from "../../../../../../workflows/server-configurator/component-packs/bulk-add-components-to-pack"
import { BulkAddComponentsToPackBody } from "../../../validators"

export async function POST(req: MedusaRequest<BulkAddComponentsToPackBody>, res: MedusaResponse) {
  const { result } = await bulkAddComponentsToPackWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  res.status(201).json(result)
}
