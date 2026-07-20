import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { applySmartBuilderWorkflow } from "../../../../../workflows/server-configurator/smart-builder/apply-smart-builder"
import { SmartBuilderApplyBody } from "../../validators"

export async function POST(req: MedusaRequest<SmartBuilderApplyBody>, res: MedusaResponse) {
  const actor_id = (req as any).auth_context?.actor_id || "authenticated-admin"
  const { result } = await applySmartBuilderWorkflow(req.scope).run({ input: { ...req.validatedBody, actor_id } })
  res.status(201).json(result)
}
