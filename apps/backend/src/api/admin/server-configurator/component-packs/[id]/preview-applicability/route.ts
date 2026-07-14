import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { previewPackApplicabilityWorkflow } from "../../../../../../workflows/server-configurator/component-packs/preview-pack-applicability"
import { PreviewPackApplicabilityBody } from "../../../validators"

export async function POST(req: MedusaRequest<PreviewPackApplicabilityBody>, res: MedusaResponse) {
  const { result } = await previewPackApplicabilityWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  res.json(result)
}
