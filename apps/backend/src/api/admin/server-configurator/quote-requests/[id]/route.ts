import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import type { UpdateQuoteRequestBody } from "../../validators"

export async function POST(req: MedusaRequest<UpdateQuoteRequestBody>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const [existing] = await service.listQuoteRequests({ id: req.params.id })
  if (!existing) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Quote request not found.")
  if (req.validatedBody.status === "quoted" && req.validatedBody.quoted_amount === undefined) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "quoted_amount is required for quoted status.")
  }
  const quoteRequest = await service.updateQuoteRequests({
    id: existing.id,
    ...req.validatedBody,
    quoted_at: req.validatedBody.status === "quoted" ? new Date() : existing.quoted_at,
  })
  const configurationStatus = ({ quoted: "quoted", expired: "expired", converted: "ordered" } as Record<string, string>)[req.validatedBody.status]
  if (configurationStatus) {
    await service.updateConfigurations({
      id: existing.configuration_id,
      status: configurationStatus,
      medusa_order_id: req.validatedBody.medusa_order_id || existing.medusa_order_id,
    })
  }
  res.json({ quote_request: quoteRequest })
}
