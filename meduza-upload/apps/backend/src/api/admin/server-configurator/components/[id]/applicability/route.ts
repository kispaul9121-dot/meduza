import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateComponentApplicabilityWorkflow } from "../../../../../../workflows/server-configurator/components/update-component-applicability"
import { UpdateComponentApplicabilityBody } from "../../../validators"

export async function POST(req: MedusaRequest<UpdateComponentApplicabilityBody>, res: MedusaResponse) {
  const { result } = await updateComponentApplicabilityWorkflow(req.scope).run({
    input: { id: req.params.id, applicability: req.validatedBody.applicability },
  })

  res.json(result)
}
