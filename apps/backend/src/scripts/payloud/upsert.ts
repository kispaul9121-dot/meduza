import { dryRun } from "./source-files"
import { report } from "./report"
import { CompatibilityRuleInput, ComponentInput, HelpAnnotationInput } from "./types"
import { cleanText, componentKey, numberOrZero } from "./utils"

function stableJson(value: unknown) {
  return JSON.stringify(sortJson(value ?? null))
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson)
  if (!value || typeof value !== "object") return value

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce((sorted, key) => {
      const child = (value as Record<string, unknown>)[key]
      if (child !== undefined) sorted[key] = sortJson(child)
      return sorted
    }, {} as Record<string, unknown>)
}

function sameComponent(existing: any, next: ComponentInput) {
  return (
    cleanText(existing.type) === next.type &&
    cleanText(existing.brand) === next.brand &&
    cleanText(existing.model) === next.model &&
    cleanText(existing.part_number) === cleanText(next.part_number) &&
    cleanText(existing.public_name) === next.public_name &&
    cleanText(existing.short_name) === next.short_name &&
    numberOrZero(existing.price) === next.price &&
    numberOrZero(existing.cost) === next.cost &&
    numberOrZero(existing.stock_qty) === next.stock_qty &&
    Boolean(existing.enabled) === next.enabled &&
    stableJson(existing.specs_json) === stableJson(next.specs_json)
  )
}

function sameAnnotation(existing: any, next: HelpAnnotationInput) {
  return (
    cleanText(existing.page) === next.page &&
    cleanText(existing.target_type) === next.target_type &&
    cleanText(existing.component_type) === cleanText(next.component_type) &&
    cleanText(existing.server_model_slug) === cleanText(next.server_model_slug) &&
    cleanText(existing.title) === next.title &&
    cleanText(existing.body) === next.body &&
    cleanText(existing.placement) === next.placement &&
    cleanText(existing.icon) === next.icon &&
    cleanText(existing.severity) === next.severity &&
    numberOrZero(existing.sort_order) === next.sort_order &&
    Boolean(existing.enabled) === next.enabled &&
    cleanText(existing.source_doc_reference) === next.source_doc_reference &&
    stableJson(existing.metadata_json) === stableJson(next.metadata_json)
  )
}

function sameRule(existing: any, next: CompatibilityRuleInput) {
  return (
    Boolean(existing.enabled) === next.enabled &&
    numberOrZero(existing.priority) === next.priority &&
    cleanText(existing.scope_type) === next.scope_type &&
    cleanText(existing.scope_value) === cleanText(next.scope_value) &&
    cleanText(existing.category) === next.category &&
    cleanText(existing.rule_type) === next.rule_type &&
    stableJson(existing.conditions_json) === stableJson(next.conditions_json) &&
    stableJson(existing.action_json) === stableJson(next.action_json) &&
    cleanText(existing.message) === cleanText(next.message) &&
    cleanText(existing.admin_note) === cleanText(next.admin_note) &&
    cleanText(existing.source_doc_reference) === next.source_doc_reference &&
    cleanText(existing.version) === next.version
  )
}

export async function upsertComponents(service: any, components: ComponentInput[]) {
  const existing = await service.listComponents({}, { take: 10000 })
  const byKey = new Map(existing.map((item: any) => [componentKey(item), item]))

  for (const component of components) {
    report.components.by_type[component.type] = (report.components.by_type[component.type] ?? 0) + 1
    const key = componentKey(component)
    const current = byKey.get(key) as any
    const next = { ...component }

    if (current) {
      if (numberOrZero(current.price) > 0 && next.price === 0) next.price = numberOrZero(current.price)
      if (numberOrZero(current.cost) > 0 && next.cost === 0) next.cost = numberOrZero(current.cost)
      if (numberOrZero(current.stock_qty) > 0 && next.stock_qty === 0) next.stock_qty = numberOrZero(current.stock_qty)
      next.specs_json = { ...(current.specs_json ?? {}), ...(next.specs_json ?? {}) }

      if (sameComponent(current, next)) {
        report.components.unchanged += 1
        continue
      }

      if (!dryRun) {
        await service.updateComponents({ id: current.id, ...next })
      }
      report.components.updated += 1
      continue
    }

    if (!dryRun) {
      await service.createComponents(next)
    }
    report.components.created += 1
  }
}

export async function upsertAnnotations(service: any, annotations: HelpAnnotationInput[]) {
  const existing = await service.listHelpAnnotations({}, { take: 10000 })
  const byKey = new Map(existing.map((item: any) => [`${item.page}:${item.key}`, item]))

  for (const annotation of annotations) {
    const current = byKey.get(`${annotation.page}:${annotation.key}`) as any
    if (current) {
      if (sameAnnotation(current, annotation)) {
        report.annotations.unchanged += 1
        continue
      }
      if (!dryRun) {
        await service.updateHelpAnnotations({ id: current.id, ...annotation })
      }
      report.annotations.updated += 1
      continue
    }

    if (!dryRun) {
      await service.createHelpAnnotations(annotation)
    }
    report.annotations.created += 1
  }
}

export async function upsertRules(service: any, rules: CompatibilityRuleInput[]) {
  const existing = await service.listCompatibilityRules({}, { take: 10000 })
  const byName = new Map(existing.map((item: any) => [cleanText(item.name).toLowerCase(), item]))

  for (const rule of rules) {
    const current = byName.get(rule.name.toLowerCase()) as any
    if (current) {
      if (sameRule(current, rule)) {
        report.rules.unchanged += 1
        continue
      }
      if (!dryRun) {
        await service.updateCompatibilityRules({ id: current.id, ...rule })
      }
      report.rules.updated += 1
      continue
    }

    if (!dryRun) {
      await service.createCompatibilityRules(rule)
    }
    report.rules.created += 1
  }
}

export async function upsertPresets(service: any, presets: any[]) {
  const existing = await service.listRulePresets({}, { take: 10000 })
  const byName = new Map(existing.map((item: any) => [cleanText(item.name).toLowerCase(), item]))

  for (const preset of presets) {
    const current = byName.get(preset.name.toLowerCase()) as any
    if (current) {
      const same =
        cleanText(current.category) === preset.category &&
        cleanText(current.description) === preset.description &&
        stableJson(current.conditions_template_json) === stableJson(preset.conditions_template_json) &&
        stableJson(current.action_template_json) === stableJson(preset.action_template_json) &&
        Boolean(current.enabled) === preset.enabled
      if (same) {
        report.presets.unchanged += 1
        continue
      }
      if (!dryRun) {
        await service.updateRulePresets({ id: current.id, ...preset })
      }
      report.presets.updated += 1
      continue
    }

    if (!dryRun) {
      await service.createRulePresets(preset)
    }
    report.presets.created += 1
  }
}
