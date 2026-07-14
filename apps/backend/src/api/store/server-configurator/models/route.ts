import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { decorateModelWithFacets } from "../../../../modules/server-configurator/catalog-facets"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const models = await service.listServerModels({ enabled: true }, {
    order: { public_name: "ASC" },
  })

  res.json({ models: models.map(decorateModelWithFacets) })
}
