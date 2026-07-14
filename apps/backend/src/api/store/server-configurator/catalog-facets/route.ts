import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { catalogFacetDefinitions, modelFacetValues } from "../../../../modules/server-configurator/catalog-facets"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const models = await service.listServerModels({ enabled: true })
  const catalogModels = models.filter((model: any) => model.slug !== "hpe-proliant-dl360-gen10-8sff-front-drive-option")
  const facets = catalogFacetDefinitions
    .map((definition) => {
      const counts = new Map<string, number>()
      for (const model of catalogModels) {
        for (const value of modelFacetValues(model, definition.key)) {
          counts.set(value, (counts.get(value) || 0) + 1)
        }
      }
      return {
        ...definition,
        values: Array.from(counts.entries()).map(([value, count]) => ({ value, count })),
      }
    })
    .filter((facet) => facet.values.length > 0)

  res.json({ facets, count: catalogModels.length })
}
