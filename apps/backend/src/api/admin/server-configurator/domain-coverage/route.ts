import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as {
    getDomainCoverage: () => Promise<Record<string, string[]>>
  }
  const coverage = await service.getDomainCoverage()

  return res.status(200).json({ coverage })
}
