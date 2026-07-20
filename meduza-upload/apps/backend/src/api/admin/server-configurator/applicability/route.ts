import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { getApplicability, previewApplicability } from "../../../../modules/server-configurator/applicability"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const componentId = String(req.query.component_id || "")
  const components = componentId
    ? [await service.retrieveComponent(componentId)]
    : await service.listComponents({ enabled: true }, { take: 100, order: { type: "ASC", public_name: "ASC" } })
  const models = await service.listServerModels({ enabled: true })
  const packs = await service.listComponentPacks({}, { take: 1000, order: { name: "ASC" } })
  const packItems = await service.listComponentPackItems({}, { take: 10000 })
  const packCounts = packItems.reduce((acc: Record<string, number>, item: any) => {
    acc[item.component_pack_id] = (acc[item.component_pack_id] || 0) + 1
    return acc
  }, {})
  const applicability = components.map((component: any) => ({
    component,
    applicability: getApplicability(component),
    preview: previewApplicability(component, models),
  }))

  res.json({
    applicability,
    server_models: models,
    component_packs: packs.map((pack: any) => ({ ...pack, item_count: packCounts[pack.id] || 0 })),
  })
}
