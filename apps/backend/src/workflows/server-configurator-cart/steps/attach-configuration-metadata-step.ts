import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"
import {
  AddedConfiguredServerLine,
  ConfiguredServerPriceResult,
  ConfiguredServerValidationResult,
  SavedConfiguredServer,
} from "../types"

async function retrieveCart(container: any, cartId: string) {
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
  return data?.[0]
}

export const attachConfigurationMetadataStep = createStep(
  "attach-configured-server-line-item-metadata",
  async (input: {
    validation: ConfiguredServerValidationResult
    pricing: ConfiguredServerPriceResult
    saved: SavedConfiguredServer
    added: AddedConfiguredServerLine
  }, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const configurationId = input.saved.configuration.id
    const lineItemId = input.added.line_item.id

    const configuration = await service.updateConfigurations({
      id: configurationId,
      medusa_cart_id: input.added.cart.id,
      medusa_line_item_id: lineItemId,
      status: "in_cart",
      snapshot_json: {
        ...(input.saved.snapshot || {}),
        medusa_cart_id: input.added.cart.id,
        medusa_line_item_id: lineItemId,
      },
    })
    const cart = await retrieveCart(container, input.added.cart.id)
    const lineItem = cart?.items?.find((item: any) => item.id === lineItemId) || input.added.line_item

    return new StepResponse({
      cart,
      configuration,
      line_item: lineItem,
    })
  }
)
