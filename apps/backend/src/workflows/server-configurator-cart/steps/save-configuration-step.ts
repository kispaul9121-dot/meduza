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

function snapshotComponent(
  component: any,
  quantity: number,
  pricing: ConfiguredServerPriceResult,
  technical: boolean
): ConfigurationSnapshotComponent {
  const priceLine = pricing.lines.find((line) => line.reference_id === component.id)
  const unitPrice = Number(priceLine?.unit_amount || 0)
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
    currency_code: pricing.currency_code,
    medusa_variant_id: component.medusa_product_variant_id || null,
    price_source: priceLine?.price_source || "not_individually_priced",
    technical,
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
    const selected = [...(input.request.selected_components || [])]
    for (const componentId of input.validation.auto_added_components || []) {
      if (!selected.some((item) => item.component_id === componentId)) {
        selected.push({ component_id: componentId, quantity: 1 })
      }
    }
    const componentIds = selected.map((item) => item.component_id)
    const components = componentIds.length
      ? await service.listComponents({ id: componentIds })
      : []
    const snapshotComponents = selected.map((item) => {
      const component = components.find((candidate: any) => candidate.id === item.component_id)
      return component ? snapshotComponent(
        component,
        item.quantity || 1,
        input.pricing,
        (input.validation.auto_added_components || []).includes(item.component_id)
      ) : null
    }).filter(Boolean) as ConfigurationSnapshotComponent[]
    const serverModel = input.validation.server_model
    const [storageOption] = input.request.storage_option_id
      ? await service.listServerStorageOptions({ id: input.request.storage_option_id })
      : []
    const optionGroups = await service.listConfiguratorOptionGroups(
      { scope_id: serverModel.id, enabled: true },
      { take: 1000 }
    )
    const selectedTypes = new Set(snapshotComponents.filter((item) => !item.technical).map((item) => item.type))
    const snapshot = {
      snapshot_schema: "commerce.configuration.v1",
      server_model: {
        id: serverModel.id,
        slug: serverModel.slug,
        public_name: serverModel.public_name,
        medusa_product_id: serverModel.medusa_product_id,
        medusa_variant_id: serverModel.medusa_variant_id,
      },
      ready_configuration: input.request.ready_configuration_id ? {
        id: input.request.ready_configuration_id,
        version: input.request.ready_configuration_version,
        snapshot_hash: input.request.ready_snapshot_hash,
      } : null,
      storage: storageOption ? {
        id: storageOption.id,
        key: storageOption.key,
        public_name: storageOption.public_name,
        zones: storageOption.storage_cages_json,
        drive_limits: storageOption.drive_limits_json,
        backplane_variants: storageOption.backplane_variants_json,
        placements: input.validation.placements || [],
      } : null,
      selected_components: snapshotComponents,
      auto_added_components: snapshotComponents.filter((item) => item.technical),
      optional_groups: optionGroups.map((group: any) => ({
        key: group.key,
        title: group.title,
        component_type: group.component_type,
        state: (input.request.explicit_none || []).includes(group.key) ||
          (input.request.explicit_none || []).includes(group.component_type)
          ? "explicit_none"
          : selectedTypes.has(group.component_type) ? "selected" : "not_applicable",
        selected: snapshotComponents.filter((item) => !item.technical && item.type === group.component_type),
      })),
      effective_specs: input.validation.effective_specs,
      warnings: input.validation.warnings,
      errors: input.validation.errors,
      total_price: input.pricing.total_price,
      currency_code: input.pricing.currency_code,
      pricing_mode: input.pricing.pricing_mode,
      request_quote: input.pricing.request_quote,
      price: {
        lines: input.pricing.lines,
        priced_at: input.pricing.priced_at,
        expires_at: input.pricing.price_expires_at,
        price_hash: input.pricing.price_hash,
        availability_errors: input.pricing.availability_errors,
      },
      validation: {
        engine_version: "compatibility-engine.v1",
        trace: (input.validation.trace || []).slice(0, 250),
      },
    }
    const hash = crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")
    const configuration = await service.createConfigurations({
      server_model_id: serverModel.id,
      medusa_cart_id: input.request.cart_id || null,
      medusa_line_item_id: null,
      medusa_customer_id: input.request.customer_id || null,
      status: input.pricing.request_quote ? "valid" : "valid",
      price_mode: input.pricing.pricing_mode,
      currency_code: input.pricing.currency_code,
      total_price: input.pricing.total_price,
      priced_at: input.pricing.priced_at,
      price_expires_at: input.pricing.price_expires_at,
      ready_configuration_id: input.request.ready_configuration_id || null,
      ready_configuration_version: input.request.ready_configuration_version || null,
      ready_snapshot_hash: input.request.ready_snapshot_hash || null,
      storage_option_id: input.request.storage_option_id || null,
      explicit_none_json: input.request.explicit_none || [],
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
      currency_code: item.currency_code,
      unit_price: item.unit_price,
      total_price: item.total_price,
      price_source: item.price_source,
      medusa_variant_id: item.medusa_variant_id,
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
