import { MedusaError } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { decorateModelWithFacets } from "../../../../../modules/server-configurator/catalog-facets"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const [model] = await service.listServerModels({ slug: req.params.slug, enabled: true })

  if (!model) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Server model not found")
  }

  res.json({ model: decorateModelWithFacets(model) })
}
