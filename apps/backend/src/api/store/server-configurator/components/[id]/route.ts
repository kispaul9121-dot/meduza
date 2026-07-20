import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { loadComponentCatalog } from "../../../../../modules/server-configurator/component-catalog-loader"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const loaded = await loadComponentCatalog(service)
  const component = loaded.items.find((item) => item.id === req.params.id)
  if (!component) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Public component not found")
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
  res.json({
    component,
    schema_version: `component-detail:${component.normalization_status}:${loaded.definitions.map((definition: any) => definition.schema_version).join(".")}`,
    query_metadata: { duration_ms: Number(loaded.duration_ms.toFixed(3)), query_count: loaded.query_count },
  })
}
