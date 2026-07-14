import { sourceReference } from "./read-source"
import { report } from "./report"
import { sourceFiles } from "./source-files"
import { HelpAnnotationInput } from "./types"
import { cleanText, groupToComponentType, ruleCategory } from "./utils"

export function normalizeGroupAnnotation(group: Record<string, unknown>) {
  const groupId = cleanText(group.id)
  const type = groupToComponentType(groupId)
  if (!type) return null
  return {
    key: `configurator.${type}`,
    page: "configurator",
    target_type: "group",
    component_type: type,
    server_model_slug: null,
    title: cleanText(group.title),
    body: cleanText(group.description),
    placement: "right",
    icon: "info",
    severity: "info",
    sort_order: 200 + report.annotations.found,
    enabled: true,
    source_doc_reference: sourceReference(sourceFiles.configurator),
    metadata_json: {
      source_group: groupId,
      source: "pauloud 2",
    },
  } satisfies HelpAnnotationInput
}

export function normalizeRuleAnnotation(rule: Record<string, unknown>) {
  const category = ruleCategory(rule.category)
  return {
    key: `diagnostic.${cleanText(rule.slug || rule.ruleId || rule.title)}`,
    page: "configurator",
    target_type: "diagnostic",
    component_type: category,
    server_model_slug: null,
    title: cleanText(rule.title),
    body: cleanText(rule.messageRu || rule.message || rule.notes),
    placement: "right",
    icon: cleanText(rule.severity) === "error" ? "alert" : "info",
    severity: cleanText(rule.severity || "info"),
    sort_order: 500 + report.annotations.found,
    enabled: true,
    source_doc_reference: sourceReference(sourceFiles.dl360Rules),
    metadata_json: {
      rule_id: rule.ruleId,
      legacy_action: rule.action,
      legacy_rule_type: rule.ruleType,
      draft: true,
    },
  } satisfies HelpAnnotationInput
}

export function normalizeStorageScenarioAnnotation(row: Record<string, unknown>) {
  return {
    key: `configurator.storage_scenario.${cleanText(row.id)}`,
    page: "configurator",
    target_type: "storage_scenario",
    component_type: "storage_scenario",
    server_model_slug: null,
    title: cleanText(row.title),
    body: cleanText(row.subtitle),
    placement: "right",
    icon: "storage",
    severity: "info",
    sort_order: 300 + report.annotations.found,
    enabled: true,
    source_doc_reference: sourceReference(sourceFiles.storageScenarios),
    metadata_json: {
      drive_bay_id: row.driveBayId,
      source: "pauloud 2",
    },
  } satisfies HelpAnnotationInput
}
