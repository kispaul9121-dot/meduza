import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const { page, slug, target_type } = req.query
  const annotations = await service.listHelpAnnotations(
    { enabled: true },
    { order: { sort_order: "ASC" } }
  )

  const filtered = annotations.filter((item: any) => {
    if (page && item.page !== page && item.page !== "global") return false
    if (target_type && item.target_type !== target_type) return false
    if (item.server_model_slug && slug && item.server_model_slug !== slug) return false
    if (item.server_model_slug && !slug) return false
    return true
  })

  res.json({ annotations: filtered })
}
