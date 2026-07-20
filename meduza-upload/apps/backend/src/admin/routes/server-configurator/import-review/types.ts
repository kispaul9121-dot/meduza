export type ComponentRow = {
  id: string
  type: string
  brand: string
  model: string
  part_number?: string
  public_name: string
  short_name: string
  enabled: boolean
  specs_json?: Record<string, any>
}

export type AnnotationRow = {
  id: string
  key: string
  page: string
  title: string
  body: string
  enabled: boolean
  source_doc_reference?: string
}

export type DraftRuleRow = {
  id: string
  name: string
  category: string
  rule_type: string
  scope_type: string
  scope_value?: string
  message?: string
  enabled: boolean
  conditions_json?: Record<string, any>
  action_json?: Record<string, any>
  source_doc_reference?: string
}

export type RulePresetRow = {
  id: string
  name: string
  category: string
  description?: string
  enabled: boolean
}

export type LegacySection = {
  key: string
  title: string
  status: "ok" | "partial" | "missing" | "needs review"
  source_files: string[]
  imported_count: number
  found: string[]
  current_medusa: string[]
  missing: string[]
  recommended_next_action: string
}

export type UiStyleFinding = {
  area: string
  payloud: string
  medusa_current: string
  recommendation: string
}
