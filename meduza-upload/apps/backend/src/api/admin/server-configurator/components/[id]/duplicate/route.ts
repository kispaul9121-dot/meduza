import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { duplicateComponentWorkflow } from "../../../../../../workflows/server-configurator/components/duplicate-component"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await duplicateComponentWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(201).json(result)
}
