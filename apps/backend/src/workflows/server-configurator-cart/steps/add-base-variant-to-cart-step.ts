import {
  addToCartWorkflow,
  createCartWorkflow,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { CreateCartCreateLineItemDTO } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  AddConfiguredServerToCartInput,
  AddedConfiguredServerLine,
  ConfiguredServerPriceResult,
  ConfiguredServerValidationResult,
  SavedConfiguredServer,
} from "../types"

async function retrieveCartWithConfiguredLine(
  container: any,
  cartId: string,
  configurationId: string
) {
  const query = container.resolve("query")
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "region_id",
      "currency_code",
      "total",
      "subtotal",
      "items.*",
      "items.metadata",
      "items.variant.*",
      "items.product.*",
    ],
    filters: { id: cartId },
  })
  const cart = data?.[0]
  const lineItem = cart?.items?.find((item: any) => (
    item.metadata?.configuration_id === configurationId
  ))

  if (!cart || !lineItem) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Configured server line item was not found after add-to-cart."
    )
  }

  return { cart, line_item: lineItem }
}

function sanitizeCartMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeCartMetadata(item))
  }

  if (!value || typeof value !== "object") {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      const safeKey = key.startsWith("raw_") ? `source_${key.slice(4)}` : key
      return [safeKey, sanitizeCartMetadata(item)]
    })
  )
}

export const addBaseVariantToCartStep = createStep(
  "add-configured-server-base-variant-to-cart",
  async (input: {
    request: AddConfiguredServerToCartInput
    validation: ConfiguredServerValidationResult
    pricing: ConfiguredServerPriceResult
    saved: SavedConfiguredServer
  }, { container }) => {
    const serverModel = input.validation.server_model
    let cartId = input.request.cart_id

    if (!cartId) {
      const { result: cart } = await createCartWorkflow(container).run({
        input: {
          email: input.request.customer_email,
          metadata: { source: "server_configurator" },
        },
      })
      cartId = cart.id
    }

    const item: CreateCartCreateLineItemDTO = {
      variant_id: serverModel.medusa_variant_id,
      quantity: input.request.quantity || 1,
      metadata: {
        configuration_id: input.saved.configuration.id,
        server_model_slug: serverModel.slug,
        server_public_name: serverModel.public_name,
        selected_components_snapshot: sanitizeCartMetadata(
          input.saved.selected_components_snapshot
        ),
        effective_specs: input.validation.effective_specs,
        warnings: input.validation.warnings,
        errors: input.validation.errors,
        total_price: input.pricing.total_price,
        pricing_mode: input.pricing.pricing_mode,
        request_quote: input.pricing.request_quote,
      },
    }

    if (input.pricing.pricing_mode === "calculated") {
      item.unit_price = input.pricing.total_price
    }

    await addToCartWorkflow(container).run({
      input: {
        cart_id: cartId,
        items: [item],
      },
    })

    const result = await retrieveCartWithConfiguredLine(
      container,
      cartId,
      input.saved.configuration.id
    )

    return new StepResponse(result, {
      cart_id: cartId,
      line_item_id: result.line_item.id,
    })
  },
  async (created, { container }) => {
    if (!created?.cart_id || !created?.line_item_id) return
    await updateLineItemInCartWorkflow(container).run({
      input: {
        cart_id: created.cart_id,
        item_id: created.line_item_id,
        update: { quantity: 0 },
      },
    })
  }
)
