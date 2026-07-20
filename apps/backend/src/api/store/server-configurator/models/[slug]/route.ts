import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { loadServerCatalog } from "../../../../../modules/server-configurator/catalog-loader"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const catalog = await loadServerCatalog(service, graph)
  const record = catalog.records.find((item) => item.model.slug === req.params.slug)

  if (!record) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Server model not found")
  }

  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120")
  res.setHeader("Vary", "Accept-Encoding, x-publishable-api-key")
  res.json({
    model: record.model,
    property_provenance: record.provenance,
    query_metadata: {
      duration_ms: Number(catalog.duration_ms.toFixed(3)),
      query_count: catalog.query_count,
    },
  })
}
