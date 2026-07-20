import { HttpTypes } from "@medusajs/types"

export type ConfiguredLineMetadata = {
  configuration_id?: string
  server_model_slug?: string
  server_public_name?: string
  selected_components_snapshot?: Array<{
    component_id: string
    type: string
    quantity: number
    public_name: string
    short_name: string
    unit_price?: number
    total_price?: number
    specs_json?: Record<string, any> | null
  }>
  effective_specs?: Record<string, any>
  warnings?: string[]
  errors?: string[]
  total_price?: number
  pricing_mode?: "calculated" | "request_quote"
  request_quote?: boolean
}

export function configuredMetadata(line: HttpTypes.StoreCartLineItem) {
  return (line.metadata || {}) as ConfiguredLineMetadata
}

export function isConfiguredServerLine(line: HttpTypes.StoreCartLineItem) {
  return Boolean(configuredMetadata(line).configuration_id)
}

export function formatCartPrice(amount?: number | null, currencyCode = "USD") {
  if (amount === undefined || amount === null) return "по запросу"
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

export function componentsByType(metadata: ConfiguredLineMetadata, type: string) {
  return (metadata.selected_components_snapshot || []).filter((item) => item.type === type)
}

export function componentLine(metadata: ConfiguredLineMetadata, type: string) {
  const items = componentsByType(metadata, type)
  if (!items.length) return "не выбрано"
  return items.map((item) => `${item.quantity}x ${item.short_name || item.public_name}`).join(", ")
}
