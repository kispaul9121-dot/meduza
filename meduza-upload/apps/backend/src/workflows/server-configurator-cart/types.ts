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
  pricing_mode?: ConfiguredServerPricingMode
}

export type ConfiguredServerValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
  effective_specs: Record<string, unknown>
  total_price: number
  facts?: Record<string, unknown>
  triggered_rules?: unknown[]
  server_model: Record<string, any>
}

export type ConfiguredServerPriceResult = {
  total_price: number
  pricing_mode: ConfiguredServerPricingMode
  request_quote: boolean
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
