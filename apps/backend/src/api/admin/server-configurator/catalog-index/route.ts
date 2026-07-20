import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { loadServerCatalog } from "../../../../modules/server-configurator/catalog-loader"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const catalog = await loadServerCatalog(service, graph)
  res.json({
    filter_schema: catalog.definitions,
    index_validation: catalog.index_validation,
    query_metadata: {
      duration_ms: Number(catalog.duration_ms.toFixed(3)),
      query_count: catalog.query_count,
      record_count: catalog.records.length,
    },
    records: catalog.records.map((record) => ({
      id: record.model.id,
      slug: record.model.slug,
      values: record.values,
      provenance: record.provenance,
    })),
  })
}
