import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { loadServerCatalog } from "../../../../modules/server-configurator/catalog-loader"
import { executeCatalogQuery, parseCatalogQuery } from "../../../../modules/server-configurator/catalog-query"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const catalog = await loadServerCatalog(service, graph)
  const parsed = parseCatalogQuery(req.query as Record<string, unknown>, catalog.definitions)
  if (!parsed.query) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, parsed.errors.join("; "))
  }
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120")
  res.setHeader("Vary", "Accept-Encoding, x-publishable-api-key")
  res.json({
    ...executeCatalogQuery({
      ...catalog,
      query: parsed.query,
    }),
    index_validation: catalog.index_validation,
  })
}
