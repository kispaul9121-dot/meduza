export type ConfiguredServerPricingMode = "calculated" | "request_quote"

export type ConfiguredServerSelectedComponent = {
  component_id: string
  quantity: number
  type?: string
}

export type AddConfiguredServerToCartInput = {
  cart_id?: string
  server_model_slug: string
  selected_components: ConfiguredServerSelectedComponent[]
  quantity?: number
  customer_email?: string
  customer_id?: string
  pricing_mode?: ConfiguredServerPricingMode
  storage_option_id?: string
  explicit_none?: string[]
  ready_configuration_id?: string
  ready_configuration_version?: number
  ready_snapshot_hash?: string
}

export type ConfiguredServerValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
  effective_specs: Record<string, unknown>
  total_price: number
  facts?: Record<string, unknown>
  triggered_rules?: unknown[]
  auto_added_components?: string[]
  trace?: unknown[]
  placements?: unknown[]
  snapshot?: Record<string, any>
  server_model: Record<string, any>
}

export type CommercePriceLine = {
  kind: "base" | "component" | "bundle" | "service" | "adjustment"
  reference_id: string
  label: string
  quantity: number
  unit_amount: number
  total_amount: number
  currency_code: string
  medusa_variant_id?: string
  price_source: string
  availability: "available" | "backorder" | "unavailable"
  technical: boolean
}

export type ConfiguredServerPriceResult = {
  total_price: number
  pricing_mode: ConfiguredServerPricingMode
  request_quote: boolean
  currency_code: string
  region_id: string | null
  priced_at: string
  price_expires_at: string
  lines: CommercePriceLine[]
  price_hash: string
  availability_errors: string[]
}

export type ConfigurationSnapshotComponent = {
  component_id: string
  type: string
  quantity: number
  brand: string
  model: string
  public_name: string
  short_name: string
  unit_price: number
  total_price: number
  currency_code: string
  medusa_variant_id: string | null
  price_source: string
  technical: boolean
  specs_json: Record<string, unknown> | null
}

export type SavedConfiguredServer = {
  configuration: Record<string, any>
  snapshot: Record<string, unknown>
  selected_components_snapshot: ConfigurationSnapshotComponent[]
}

export type AddedConfiguredServerLine = {
  cart: Record<string, any>
  line_item: Record<string, any>
}
