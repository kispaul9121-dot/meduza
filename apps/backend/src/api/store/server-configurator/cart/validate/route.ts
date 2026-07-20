import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { resolveCommercePrice } from "../../../../../workflows/server-configurator-cart/commerce-pricing"
import type { ValidateConfiguredCartSchemaType } from "../../validators"

export async function POST(req: MedusaRequest<ValidateConfiguredCartSchemaType>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const query = req.scope.resolve("query") as any
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "customer_id", "completed_at", "items.id", "items.quantity", "items.unit_price", "items.metadata"],
    filters: { id: req.validatedBody.cart_id },
  })
  const cart = data?.[0]
  const actorId = (req as any).auth_context?.actor_id
  if (!cart || cart.completed_at || (cart.customer_id && cart.customer_id !== actorId)) {
    res.status(404).json({ valid: false, errors: ["Cart is missing, completed, or inaccessible."] })
    return
  }
  const configuredLines = (cart.items || []).filter((item: any) => item.metadata?.configuration_id)
  const errors: string[] = []
  const checked: any[] = []
  for (const line of configuredLines) {
    const [configuration] = await service.listConfigurations({ id: line.metadata.configuration_id })
    if (!configuration || configuration.medusa_cart_id !== cart.id || configuration.medusa_line_item_id !== line.id) {
      errors.push(`Line ${line.id}: configuration link is invalid.`)
      continue
    }
    if (configuration.medusa_customer_id && configuration.medusa_customer_id !== actorId) {
      errors.push(`Line ${line.id}: configuration ownership mismatch.`)
      continue
    }
    if (configuration.hash !== line.metadata.configuration_hash) {
      errors.push(`Line ${line.id}: configuration snapshot was tampered with.`)
      continue
    }
    const snapshot = configuration.snapshot_json || {}
    const validation = await service.validateConfiguration({
      server_model_slug: snapshot.server_model?.slug,
      storage_option_id: configuration.storage_option_id || undefined,
      selected_components: (snapshot.selected_components || [])
        .filter((item: any) => !item.technical)
        .map((item: any) => ({ component_id: item.component_id, quantity: item.quantity })),
      explicit_none: configuration.explicit_none_json || [],
      mode: "production_validation",
    })
    if (!validation.valid) {
      errors.push(`Line ${line.id}: ${validation.errors.join(" ")}`)
      continue
    }
    const pricing = await resolveCommercePrice({
      container: req.scope,
      request: {
        cart_id: cart.id,
        customer_id: actorId,
        server_model_slug: snapshot.server_model.slug,
        selected_components: (snapshot.selected_components || [])
          .filter((item: any) => !item.technical)
          .map((item: any) => ({ component_id: item.component_id, quantity: item.quantity })),
        quantity: line.quantity,
        storage_option_id: configuration.storage_option_id || undefined,
        explicit_none: configuration.explicit_none_json || [],
        pricing_mode: "calculated",
      },
      validation: { ...validation, server_model: validation.server_model || snapshot.server_model },
    })
    const storedUnitPrice = Number(configuration.total_price)
    if (pricing.availability_errors.length) errors.push(...pricing.availability_errors.map((message) => `Line ${line.id}: ${message}`))
    if (pricing.price_hash !== snapshot.price?.price_hash || pricing.total_price !== storedUnitPrice || Number(line.unit_price) !== storedUnitPrice) {
      errors.push(`Line ${line.id}: price changed; remove and re-add the configuration.`)
    }
    checked.push({ configuration_id: configuration.id, price_hash: pricing.price_hash })
  }
  res.status(errors.length ? 409 : 200).json({ valid: errors.length === 0, errors, checked })
}
