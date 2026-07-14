import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { applyPackApplicabilityWorkflow } from "../../../../../../workflows/server-configurator/component-packs/apply-pack-applicability"
import { ApplyPackApplicabilityBody } from "../../../validators"

export async function POST(req: MedusaRequest<ApplyPackApplicabilityBody>, res: MedusaResponse) {
  const { result } = await applyPackApplicabilityWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  res.json(result)
}
