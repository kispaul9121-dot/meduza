import { sourceReference } from "./read-source"
import { report } from "./report"
import { sourceFiles } from "./source-files"
import { CompatibilityRuleInput } from "./types"
import { cleanText, ruleCategory, ruleType } from "./utils"

const draftNote = "Imported from Payloud 2 as draft. Must be normalized and manually reviewed before enabling."

export function normalizeDraftRule(rule: Record<string, unknown>, index: number) {
  const category = ruleCategory(rule.category)
  if (!category) {
    report.skipped.push({ source: sourceFiles.dl360Rules, item: cleanText(rule.title), reason: `Unsupported rule category ${rule.category}` })
    report.rules.skipped += 1
    return null
  }

  return {
    name: cleanText(rule.title),
    enabled: false,
    priority: 1000 + index,
    scope_type: cleanText(rule.slug).startsWith("global-") ? "global" : "family",
    scope_value: cleanText(rule.slug).startsWith("global-") ? null : "ProLiant DL360",
    category,
    rule_type: ruleType(rule),
    conditions_json: (rule.conditionJson as Record<string, unknown>) ?? null,
    action_json: {
      draft: true,
      legacy_action: rule.action,
      legacy_rule_type: rule.ruleType,
      severity: rule.severity,
      recommendations: rule.recommendations,
      required_options: rule.requiredOptions,
      source_rule: cleanText(rule.ruleId || rule.slug),
    },
    message: cleanText(rule.messageRu || rule.message) || null,
    admin_note: draftNote,
    source_doc_reference: sourceReference(sourceFiles.dl360Rules),
    version: cleanText(rule.version || "payloud-draft"),
  } satisfies CompatibilityRuleInput
}
