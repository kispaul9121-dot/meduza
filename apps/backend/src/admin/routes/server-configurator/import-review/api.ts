import { sdk } from "../../../lib/client"
import { AnnotationRow, ComponentRow, DraftRuleRow, LegacySection, RulePresetRow, UiStyleFinding } from "./types"

function query(params: Record<string, string>) {
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== ""))
  return search.toString() ? `?${search.toString()}` : ""
}

export function listImportComponents(params: Record<string, string>) {
  return sdk.client.fetch<{ components: ComponentRow[]; count: number }>(
    `/admin/server-configurator/import-review/components${query(params)}`
  )
}

export function listImportAnnotations(params: Record<string, string>) {
  return sdk.client.fetch<{ annotations: AnnotationRow[]; count: number }>(
    `/admin/server-configurator/import-review/help-annotations${query(params)}`
  )
}

export function listDraftRules(params: Record<string, string>) {
  return sdk.client.fetch<{ rules: DraftRuleRow[]; count: number }>(
    `/admin/server-configurator/import-review/draft-rules${query(params)}`
  )
}

export function listRulePresets(params: Record<string, string>) {
  return sdk.client.fetch<{ presets: RulePresetRow[]; count: number }>(
    `/admin/server-configurator/import-review/rule-presets${query(params)}`
  )
}

export function getLegacyLogic() {
  return sdk.client.fetch<{ sections: LegacySection[]; recommended_data_model_changes: any[] }>(
    "/admin/server-configurator/import-review/legacy-logic"
  )
}

export function getUiStyleReview() {
  return sdk.client.fetch<{ ui_style: UiStyleFinding[] }>("/admin/server-configurator/import-review/ui-style")
}

export function markRuleReviewed(id: string) {
  return sdk.client.fetch(`/admin/server-configurator/rules/${id}/review`, { method: "POST" })
}

export function enableRuleWithConfirmation(id: string, confirmation: string) {
  return sdk.client.fetch(`/admin/server-configurator/rules/${id}/enable-with-confirmation`, {
    method: "POST",
    body: { confirmation },
  })
}
