import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { presentReadyConfiguration } from "../../../../../modules/server-configurator/ready-configuration-presentation"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const rows = await service.listReadyConfigurations({ slug: req.params.slug, status: "published" }, { take: 1 })
  if (!rows[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Ready configuration not found")
  const ready = await presentReadyConfiguration(service, rows[0])
  if (!ready.available_for_order) throw new MedusaError(MedusaError.Types.CONFLICT, `Ready configuration is unavailable: ${ready.stale_reasons.join(",")}`)
  const snapshot = ready.version.snapshot
  res.json({
    ready_configuration_id: ready.id,
    version: ready.version.version,
    server_model_slug: snapshot.server_model.slug,
    selected_components: snapshot.selected_components.map((item: any) => ({ component_id: item.component_id, quantity: item.quantity, group_key: item.group_key, zone_id: item.zone_id })),
    explicit_none: snapshot.explicit_none,
    storage_option_id: snapshot.topology?.storage_option_id || null,
    snapshot_hash: ready.version.snapshot_hash,
  })
}
