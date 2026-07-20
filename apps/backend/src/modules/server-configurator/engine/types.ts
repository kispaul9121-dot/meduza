export const VALIDATION_MODES = [
  "guided_check",
  "assisted_preview",
  "bulk_dry_run",
  "production_validation",
] as const

export type ValidationMode = typeof VALIDATION_MODES[number]

export const OPTION_SOURCE_TYPES = [
  "pack",
  "direct",
  "topology",
  "bundle",
  "auto_added",
  "built_in",
] as const

export type OptionSourceType = typeof OPTION_SOURCE_TYPES[number]
export type ValidationStatus = "compatible" | "unresolved" | "incompatible"
export type Severity = "blocker" | "warning" | "info"

export type SelectedComponentInput = {
  component_id: string
  quantity?: number
  group_key?: string
  zone_id?: string
}

export type ValidationIssue = {
  code: string
  message: string
  severity: Severity
  validator: string
  component_id?: string
  group_key?: string
  path?: string
  source_reference?: string | null
  details?: Record<string, unknown>
}

export type TraceEntry = {
  phase: "candidate" | "property" | "relation" | "validator" | "rule" | "placement" | "group"
  validator: string
  result: "pass" | "fail" | "unresolved" | "applied" | "skipped"
  reason_code: string
  message: string
  component_id?: string
  source_reference?: string | null
  details?: Record<string, unknown>
}

export type ResolvedProperty = {
  key: string
  value: unknown
  source_scope: string
  source_id: string
  schema_version: number
  inheritance_chain: Array<{ scope: string; id: string; value: unknown; mode: string }>
  excluded: boolean
  conflict: boolean
}

export type CandidateOption = {
  component: any
  component_id: string
  source_type: OptionSourceType
  source_types: OptionSourceType[]
  source_ids: string[]
  assignment_roles: string[]
  default_quantity: number
  min_quantity: number
  max_quantity: number
  selection_mode: string
  required_bundles: string[]
}

export type StoragePlacement = {
  component_id: string
  instance: number
  zone_id?: string
  bay_id?: string
  protocol?: string
  form_factor?: string
  adapter_required?: string
  result: "placed" | "unresolved" | "rejected"
  reason_code: string
}

export type CompatibilityData = {
  model: any
  components: any[]
  selected: SelectedComponentInput[]
  rules?: any[]
  component_type_definitions?: any[]
  property_definitions?: any[]
  property_assignments?: any[]
  property_values?: any[]
  relation_type_definitions?: any[]
  relations?: any[]
  concepts?: any[]
  configurations?: any[]
  capability_profiles?: any[]
  storage_topologies?: any[]
  storage_options?: any[]
  option_groups?: any[]
  pack_assignments?: any[]
  packs?: any[]
  pack_items?: any[]
  direct_assignments?: any[]
  bundles?: any[]
  scope_chain?: Array<{ type: string; id: string }>
  explicit_none?: string[]
  mode?: ValidationMode
  partial?: boolean
  resolved_candidates?: CandidateOption[]
}

export type CompatibilityResult = {
  valid: boolean
  status: ValidationStatus
  mode: ValidationMode
  errors: string[]
  warnings: string[]
  issues: ValidationIssue[]
  reason_codes: string[]
  required_components: string[]
  auto_added_components: string[]
  effective_specs: Record<string, unknown>
  total_price: number
  triggered_rules: unknown[]
  facts: Record<string, unknown>
  trace: TraceEntry[]
  placements: StoragePlacement[]
  resolved_properties: ResolvedProperty[]
  relation_summary: Record<string, number>
  snapshot: {
    selected_components: SelectedComponentInput[]
    explicit_none: string[]
    auto_added_components: string[]
    validation_trace: TraceEntry[]
  }
  recommendations: Array<{ code: string; message: string; action: string; payload?: Record<string, unknown> }>
}

export type ValidatorContext = {
  data: CompatibilityData
  selectedComponents: any[]
  byType: Record<string, any[]>
  facts: Record<string, unknown>
  effective: Record<string, unknown>
  addIssue: (issue: ValidationIssue) => void
  addTrace: (trace: TraceEntry) => void
  placements: StoragePlacement[]
}

export type Validator = (context: ValidatorContext) => void
