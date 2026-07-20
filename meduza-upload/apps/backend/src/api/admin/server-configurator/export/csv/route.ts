import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const models = await service.listServerModels({})
  const rows = [
    "slug,public_name,chassis_type,drive_bays_front,drive_form_factor,backplane_type",
    ...models.map((item: any) =>
      [
        item.slug,
        item.public_name,
        item.chassis_type,
        item.drive_bays_front,
        item.drive_form_factor,
        item.backplane_type,
      ].join(",")
    ),
  ].join("\n")

  res.setHeader("content-type", "text/csv")
  res.send(rows)
}
