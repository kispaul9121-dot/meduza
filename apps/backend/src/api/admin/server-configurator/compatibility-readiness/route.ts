import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { CompatibilityReadinessBody } from "../validators"

export async function POST(req: MedusaRequest<CompatibilityReadinessBody>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const readiness = await service.validateCompatibilityReadiness(req.validatedBody)
  res.status(200).json({ readiness })
}
