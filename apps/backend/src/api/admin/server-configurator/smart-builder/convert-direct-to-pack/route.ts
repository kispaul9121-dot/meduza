import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { convertDirectToPackWorkflow } from "../../../../../workflows/server-configurator/smart-builder/convert-direct-to-pack"
import { ConvertDirectToPackBody } from "../../validators"

export async function POST(req: MedusaRequest<ConvertDirectToPackBody>, res: MedusaResponse) {
  const actor_id = (req as any).auth_context?.actor_id || "authenticated-admin"
  const { result } = await convertDirectToPackWorkflow(req.scope).run({ input: { ...req.validatedBody, actor_id } })
  res.status(201).json(result)
}
