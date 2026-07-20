import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { presentReadyConfiguration } from "../../../../modules/server-configurator/ready-configuration-presentation"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const rows = await service.listReadyConfigurations({ slug: req.params.slug, status: "published" }, { take: 1 })
  if (!rows[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Ready configuration not found")
  res.json({ ready_configuration: await presentReadyConfiguration(service, rows[0]) })
}
