import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const result = await service.validateConfiguration(req.body)

  res.json({
    total_price: result.total_price,
    effective_specs: result.effective_specs,
    warnings: result.warnings,
    valid: result.valid,
  })
}
