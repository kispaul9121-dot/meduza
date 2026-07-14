import crypto from "node:crypto"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"
import {
  AddConfiguredServerToCartInput,
  ConfigurationSnapshotComponent,
  ConfiguredServerPriceResult,
  ConfiguredServerValidationResult,
  SavedConfiguredServer,
} from "../types"

function snapshotComponent(component: any, quantity: number): ConfigurationSnapshotComponent {
  const unitPrice = Number(component.price || 0)
  return {
    component_id: component.id,
    type: component.type,
    quantity,
    brand: component.brand,
    model: component.model,
    public_name: component.public_name,
    short_name: component.short_name,
    unit_price: unitPrice,
    total_price: unitPrice * quantity,
    specs_json: component.specs_json || null,
  }
}

export const saveConfigurationStep = createStep(
  "save-configured-server-cart-configuration",
  async (input: {
    request: AddConfiguredServerToCartInput
    validation: ConfiguredServerValidationResult
    pricing: ConfiguredServerPriceResult
  }, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const selected = input.request.selected_components || []
    const componentIds = selected.map((item) => item.component_id)
    const components = componentIds.length
      ? await service.listComponents({ id: componentIds })
      : []
    const snapshotComponents = selected.map((item) => {
      const component = components.find((candidate: any) => candidate.id === item.component_id)
      return component ? snapshotComponent(component, item.quantity || 1) : null
    }).filter(Boolean) as ConfigurationSnapshotComponent[]
    const serverModel = input.validation.server_model
    const snapshot = {
      server_model: {
        id: serverModel.id,
        slug: serverModel.slug,
        public_name: serverModel.public_name,
        medusa_product_id: serverModel.medusa_product_id,
        medusa_variant_id: serverModel.medusa_variant_id,
      },
      selected_components: snapshotComponents,
      effective_specs: input.validation.effective_specs,
      warnings: input.validation.warnings,
      errors: input.validation.errors,
      total_price: input.pricing.total_price,
      pricing_mode: input.pricing.pricing_mode,
      request_quote: input.pricing.request_quote,
    }
    const hash = crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")
    const configuration = await service.createConfigurations({
      server_model_id: serverModel.id,
      medusa_cart_id: input.request.cart_id || null,
      medusa_line_item_id: null,
      status: "valid",
      total_price: input.pricing.total_price,
      effective_specs_json: input.validation.effective_specs,
      warnings_json: input.validation.warnings,
      errors_json: input.validation.errors,
      snapshot_json: snapshot,
      hash,
    })
    const items = snapshotComponents.map((item) => ({
      configuration_id: configuration.id,
      component_id: item.component_id,
      type: item.type,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      snapshot_json: item,
    }))

    const createdItems = items.length ? await service.createConfigurationItems(items) : []
    const result: SavedConfiguredServer = {
      configuration,
      snapshot,
      selected_components_snapshot: snapshotComponents,
    }

    return new StepResponse(result, {
      configuration_id: configuration.id,
      item_ids: createdItems.map((item: any) => item.id),
    })
  },
  async (created, { container }) => {
    if (!created?.configuration_id) return
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    if (created.item_ids?.length) {
      await service.deleteConfigurationItems(created.item_ids)
    }
    await service.deleteConfigurations(created.configuration_id)
  }
)
