export type ComponentInput = {
  type: string
  brand: string
  model: string
  part_number: string | null
  public_name: string
  short_name: string
  specs_json: Record<string, unknown>
  price: number
  cost: number
  stock_qty: number
  enabled: boolean
}

export type HelpAnnotationInput = {
  key: string
  page: string
  target_type: string
  component_type: string | null
  server_model_slug: string | null
  title: string
  body: string
  placement: string
  icon: string
  severity: string
  sort_order: number
  enabled: boolean
  source_doc_reference: string
  metadata_json: Record<string, unknown>
}

export type CompatibilityRuleInput = {
  name: string
  enabled: boolean
  priority: number
  scope_type: string
  scope_value: string | null
  category: string
  rule_type: string
  conditions_json: Record<string, unknown> | null
  action_json: Record<string, unknown> | null
  message: string | null
  admin_note: string | null
  source_doc_reference: string
  version: string
}
