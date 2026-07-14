import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { duplicateComponentPackWorkflow } from "../../../../../../workflows/server-configurator/component-packs/duplicate-component-pack"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await duplicateComponentPackWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(201).json(result)
}
