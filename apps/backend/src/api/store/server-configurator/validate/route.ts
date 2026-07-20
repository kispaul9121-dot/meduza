import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { ValidateServerConfigurationSchemaType } from "../validators"

export async function POST(req: MedusaRequest<ValidateServerConfigurationSchemaType>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const result = await service.validateConfiguration(req.validatedBody)

  res.json(result)
}
