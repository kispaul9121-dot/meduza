import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const filters: Record<string, unknown> = {}
  if (req.query.status) filters.status = req.query.status
  if (req.query.medusa_customer_id) filters.medusa_customer_id = req.query.medusa_customer_id
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200)
  const offset = Math.max(Number(req.query.offset || 0), 0)
  const [quoteRequests, count] = await service.listAndCountQuoteRequests(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
  })
  res.json({ quote_requests: quoteRequests, count, limit, offset })
}
