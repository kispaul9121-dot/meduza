import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { loadServerCatalog } from "../../../../modules/server-configurator/catalog-loader"
import { executeCatalogQuery, parseCatalogQuery } from "../../../../modules/server-configurator/catalog-query"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const catalog = await loadServerCatalog(service, graph)
  const parsed = parseCatalogQuery({}, catalog.definitions)
  const result = executeCatalogQuery({ ...catalog, query: parsed.query! })
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120")
  res.json({
    facets: result.facets.map((facet) => ({
      ...catalog.definitions.find((definition) => definition.key === facet.key),
      ...facet,
    })),
    count: result.total,
    filter_schema: result.filter_schema,
  })
}
