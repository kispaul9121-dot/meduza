import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../../modules/server-configurator"
import { addComponentToPackWorkflow } from "../../../../../../workflows/server-configurator/component-packs/add-component-to-pack"
import { AddComponentToPackBody } from "../../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const items = await service.listComponentPackItems(
    { component_pack_id: req.params.id },
    { order: { sort_order: "ASC" } }
  )
  const ids = items.map((item: any) => item.component_id)
  const components = ids.length ? await service.listComponents({ id: ids }) : []
  const byId = new Map(components.map((component: any) => [component.id, component]))

  res.json({
    items: items.map((item: any) => ({ ...item, component: byId.get(item.component_id) || null })),
    count: items.length,
  })
}

export async function POST(req: MedusaRequest<AddComponentToPackBody>, res: MedusaResponse) {
  const { result } = await addComponentToPackWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  res.status(201).json(result)
}
