export type ServerModel = {
  id: string
  medusa_product_id?: string | null
  medusa_variant_id?: string | null
  brand: string
  family: string
  generation: string
  model: string
  public_name: string
  slug: string
  form_factor: string
  chassis_type: string
  drive_bays_front: number
  drive_bays_rear: number
  drive_form_factor: string
  supported_drive_interfaces?: string[] | null
  front_option_type?: string | null
  backplane_type: string
  cpu_socket: string
  max_cpu: number
  ram_slots_total: number
  ram_slots_per_cpu: number
  max_ram_capacity: string
  supported_ram_types?: string[] | null
  supported_ram_speeds?: string[] | null
  psu_type: string
  cooling_profile: string
  seo_title: string
  seo_description: string
  source_doc_reference: string
  enabled: boolean
}

export type ComponentRow = {
  id: string
  type: string
  brand: string
  model: string
  part_number?: string | null
  public_name: string
  short_name: string
  specs_json?: Record<string, any> | null
  price: number
  cost: number
  stock_qty: number
  medusa_product_variant_id?: string | null
  enabled: boolean
}

export type ComponentPack = {
  id: string
  name: string
  slug: string
  description?: string | null
  component_type: string
  brand_scope?: string[] | null
  family_scope?: string[] | null
  generation_scope?: string[] | null
  chassis_scope?: string[] | null
  tags_json?: string[] | Record<string, any> | null
  applicability_template_json?: Record<string, any> | null
  source_doc_reference?: string | null
  enabled: boolean
  item_count?: number
}

export type ComponentPackItem = {
  id: string
  component_pack_id: string
  component_id: string
  sort_order: number
  enabled: boolean
  note?: string | null
  component?: ComponentRow | null
}

export type RuleRow = {
  id: string
  name: string
  enabled: boolean
  priority: number
  scope_type: string
  scope_value?: string | null
  category: string
  rule_type: string
  conditions_json?: Record<string, any> | null
  action_json?: Record<string, any> | null
  message?: string | null
  admin_note?: string | null
  source_doc_reference?: string | null
  version: string
}

export type RulePreset = {
  id: string
  name: string
  category: string
  description?: string | null
  conditions_template_json?: Record<string, any> | null
  action_template_json?: Record<string, any> | null
  enabled: boolean
}

export type HelpAnnotation = {
  id: string
  key: string
  page: string
  target_type: string
  component_type?: string | null
  server_model_slug?: string | null
  title: string
  body: string
  severity: string
  source_doc_reference?: string | null
  metadata_json?: Record<string, any> | null
  enabled: boolean
}
