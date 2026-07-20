import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { updateLineItemInCartWorkflow } from "@medusajs/medusa/core-flows"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../../modules/server-configurator"
import type { UpdateConfiguredCartLineSchemaType } from "../../../validators"

async function linkedConfiguration(req: MedusaRequest, cartId: string) {
  const query = req.scope.resolve("query") as any
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "customer_id", "items.id", "items.metadata"],
    filters: { id: cartId },
  })
  const cart = data?.[0]
  const actorId = (req as any).auth_context?.actor_id
  if (!cart || (cart.customer_id && cart.customer_id !== actorId)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart is inaccessible.")
  }
  const line = (cart.items || []).find((item: any) => item.id === req.params.line_id)
  const configurationId = line?.metadata?.configuration_id
  const [configuration] = configurationId
    ? await service.listConfigurations({ id: configurationId })
    : []
  if (!configuration || configuration.medusa_cart_id !== cart.id || configuration.medusa_line_item_id !== line.id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Configured line link is invalid.")
  }
  if (configuration.medusa_customer_id && configuration.medusa_customer_id !== actorId) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Configuration ownership mismatch.")
  }
  return { service, configuration }
}

export async function POST(req: MedusaRequest<UpdateConfiguredCartLineSchemaType>, res: MedusaResponse) {
  await linkedConfiguration(req, req.validatedBody.cart_id)
  await updateLineItemInCartWorkflow(req.scope).run({
    input: { cart_id: req.validatedBody.cart_id, item_id: req.params.line_id, update: { quantity: req.validatedBody.quantity } },
  })
  res.json({ updated: true })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const cartId = String(req.query.cart_id || "")
  if (!cartId || cartId.length > 160) throw new MedusaError(MedusaError.Types.INVALID_DATA, "cart_id is required.")
  const { service, configuration } = await linkedConfiguration(req, cartId)
  await updateLineItemInCartWorkflow(req.scope).run({
    input: { cart_id: cartId, item_id: req.params.line_id, update: { quantity: 0 } },
  })
  await service.updateConfigurations({
    id: configuration.id,
    status: "archived",
    medusa_cart_id: null,
    medusa_line_item_id: null,
  })
  res.status(200).json({ deleted: true })
}
