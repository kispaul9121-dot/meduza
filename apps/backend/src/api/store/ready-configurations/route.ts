import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"
import { presentReadyConfiguration } from "../../../modules/server-configurator/ready-configuration-presentation"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const filters: Record<string, unknown> = { status: "published" }
  if (req.query.server_model_id) filters.server_model_id = req.query.server_model_id
  if (req.query.use_case) filters.use_case = req.query.use_case
  if (req.query.featured !== undefined) filters.featured = req.query.featured === "true"
  if (req.query.server_model_slug) {
    const models = await service.listServerModels({ slug: req.query.server_model_slug, enabled: true }, { take: 1 })
    filters.server_model_id = models[0]?.id || "__not_found__"
  }
  const rows = await service.listReadyConfigurations(filters, {
    take: Math.min(Number(req.query.limit || 100), 200),
    skip: Number(req.query.offset || 0),
    order: { sort_order: "ASC", name: "ASC" },
  })
  const presented = await Promise.all(rows.map((row: any) => presentReadyConfiguration(service, row)))
  const includeStale = req.query.include_stale === "true"
  const readyConfigurations = includeStale ? presented : presented.filter((item) => !item.stale)
  res.json({ ready_configurations: readyConfigurations, count: readyConfigurations.length })
}
