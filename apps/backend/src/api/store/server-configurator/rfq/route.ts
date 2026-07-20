import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requestConfigurationQuoteWorkflow } from "../../../../workflows/server-configurator-cart/request-configuration-quote"
import type { RequestConfigurationQuoteSchemaType } from "../validators"

export async function POST(
  req: MedusaRequest<RequestConfigurationQuoteSchemaType>,
  res: MedusaResponse
) {
  const { result } = await requestConfigurationQuoteWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      pricing_mode: "request_quote",
      customer_email: req.validatedBody.email,
      customer_id: (req as any).auth_context?.actor_id || undefined,
    },
  })
  res.status(201).json(result)
}
