import {
  addToCartWorkflow,
  createCartWorkflow,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { CreateCartCreateLineItemDTO } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { Modules } from "@medusajs/framework/utils"
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
    let createdCart = false

    if (input.pricing.request_quote) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "RFQ_CONFIGURATION_MUST_USE_RFQ_ENDPOINT"
      )
    }

    if (!cartId) {
      const { result: cart } = await createCartWorkflow(container).run({
        input: {
          email: input.request.customer_email,
          region_id: input.pricing.region_id || undefined,
          customer_id: input.request.customer_id,
          metadata: { source: "server_configurator" },
        },
      })
      cartId = cart.id
      createdCart = true
    }

    const item: CreateCartCreateLineItemDTO = {
      variant_id: serverModel.medusa_variant_id,
      quantity: input.request.quantity || 1,
      metadata: {
        configuration_id: input.saved.configuration.id,
        configuration_hash: input.saved.configuration.hash,
        server_model_slug: serverModel.slug,
        server_public_name: serverModel.public_name,
        storage: sanitizeCartMetadata((input.saved.snapshot as any).storage),
        optional_groups: sanitizeCartMetadata((input.saved.snapshot as any).optional_groups),
        auto_added_components: sanitizeCartMetadata((input.saved.snapshot as any).auto_added_components),
        selected_components_snapshot: sanitizeCartMetadata(
          input.saved.selected_components_snapshot
        ),
        effective_specs: input.validation.effective_specs,
        warnings: input.validation.warnings,
        errors: input.validation.errors,
        total_price: input.pricing.total_price,
        currency_code: input.pricing.currency_code,
        pricing_mode: input.pricing.pricing_mode,
        request_quote: false,
        price_hash: input.pricing.price_hash,
        priced_at: input.pricing.priced_at,
        price_expires_at: input.pricing.price_expires_at,
        validation_engine_version: "compatibility-engine.v1",
        ready_configuration_id: input.request.ready_configuration_id || null,
        ready_configuration_version: input.request.ready_configuration_version || null,
        ready_snapshot_hash: input.request.ready_snapshot_hash || null,
      },
    }

    const metadataBytes = Buffer.byteLength(JSON.stringify(item.metadata), "utf8")
    if (metadataBytes > 48_000) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Configured line metadata exceeds the 48 KB safety limit (${metadataBytes} bytes).`
      )
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
      created_cart: createdCart,
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
    if (created.created_cart) {
      const cartService = container.resolve(Modules.CART) as any
      await cartService.deleteCarts(created.cart_id)
    }
  }
)
