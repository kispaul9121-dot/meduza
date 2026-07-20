import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { SimulateConfigurationBody } from "../validators"

export async function POST(req: MedusaRequest<SimulateConfigurationBody>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const result = await service.validateConfiguration(req.validatedBody)

  res.json(result)
}
