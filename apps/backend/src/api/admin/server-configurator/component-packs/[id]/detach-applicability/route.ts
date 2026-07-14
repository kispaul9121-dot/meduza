import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { detachPackApplicabilityWorkflow } from "../../../../../../workflows/server-configurator/component-packs/detach-pack-applicability"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await detachPackApplicabilityWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json(result)
}
