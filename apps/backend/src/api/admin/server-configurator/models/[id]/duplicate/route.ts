import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { duplicateServerModelWorkflow } from "../../../../../../workflows/server-configurator/models/duplicate-server-model"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await duplicateServerModelWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(201).json(result)
}
