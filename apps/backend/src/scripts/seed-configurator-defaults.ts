import { MedusaContainer } from "@medusajs/framework"
import { SERVER_CONFIGURATOR_MODULE } from "../modules/server-configurator"
import { defaultConfiguratorComponents } from "../modules/server-configurator/default-components"
import { defaultHelpAnnotations } from "../modules/server-configurator/default-help-annotations"

type ComponentInput = (typeof defaultConfiguratorComponents)[number]

const sourceMeta = {
  source: "default-components",
  migrated_from_runtime_fallback: true,
  source_file: "apps/backend/src/modules/server-configurator/default-components.ts",
}

const annotationSourceMeta = {
  source: "default-help-annotations",
  migrated_from_runtime_fallback: true,
  source_file: "apps/backend/src/modules/server-configurator/default-help-annotations.ts",
}

function clean(value: unknown) {
  return String(value || "").trim()
}

function componentKey(component: any) {
  const specs = component.specs_json || {}
  return [
    component.type,
    component.part_number || specs.part_number || specs.source_id || specs.original_id || component.brand,
    component.model,
    component.public_name,
  ].map((item) => clean(item).toLowerCase()).join(":")
}

function looseComponentKey(component: any) {
  return [
    component.type,
    component.brand,
    component.model,
  ].map((item) => clean(item).toLowerCase()).join(":")
}

function enrichComponent(component: ComponentInput) {
  const specs = (component.specs_json || {}) as Record<string, any>
  return {
    ...component,
    specs_json: {
      ...specs,
      ...sourceMeta,
      original_id: component.id,
      original_category: component.type,
      notes: specs.notes || specs.note || "Migrated from default runtime fallback into DB seed/import flow.",
      applicability_hints: specs.applicability_hints || ["HPE ProLiant DL360 Gen10 defaults"],
    },
  }
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson)
  if (!value || typeof value !== "object") return value

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce((acc, key) => {
      const child = (value as Record<string, unknown>)[key]
      if (child !== undefined) acc[key] = sortJson(child)
      return acc
    }, {} as Record<string, unknown>)
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(sortJson(left || null)) === JSON.stringify(sortJson(right || null))
}

function jsonContains(left: unknown, right: unknown): boolean {
  if (!right || typeof right !== "object") return sameJson(left, right)
  if (!left || typeof left !== "object") return false
  return Object.entries(right as Record<string, unknown>).every(([key, value]) => {
    const existing = (left as Record<string, unknown>)[key]
    if (value && typeof value === "object") return jsonContains(existing, value)
    return sameJson(existing, value)
  })
}

async function upsertComponents(service: any) {
  const existing = await service.listComponents({}, { take: 10000 })
  const byKey = new Map<string, any>()
  for (const item of existing) {
    byKey.set(componentKey(item), item)
    byKey.set(looseComponentKey(item), item)
  }
  const report = { created: 0, updated: 0, unchanged: 0 }

  for (const raw of defaultConfiguratorComponents) {
    const component = enrichComponent(raw)
    const current = (byKey.get(componentKey(component)) || byKey.get(looseComponentKey(component))) as any

    if (!current) {
      const { id: _id, ...createInput } = component
      await service.createComponents(createInput)
      report.created += 1
      continue
    }

    const next = {
      ...component,
      price: Number(current.price || 0) > 0 ? Number(current.price) : Number(component.price || 0),
      cost: Number(current.cost || 0) > 0 ? Number(current.cost) : Number((component as any).cost || 0),
      stock_qty: Number(current.stock_qty || 0) > 0 ? Number(current.stock_qty) : Number(component.stock_qty || 0),
      specs_json: {
        ...(current.specs_json || {}),
        ...(component.specs_json || {}),
      },
    }
    const changed =
      clean(current.public_name) !== clean(next.public_name) ||
      clean(current.short_name) !== clean(next.short_name) ||
      clean(current.part_number) !== clean((next as any).part_number) ||
      Number(current.price || 0) !== Number(next.price || 0) ||
      Number(current.cost || 0) !== Number(next.cost || 0) ||
      Number(current.stock_qty || 0) !== Number(next.stock_qty || 0) ||
      sameJson(current.specs_json, next.specs_json) === false

    if (!changed) {
      report.unchanged += 1
      continue
    }

    const { id: _id, ...data } = next
    await service.updateComponents({ id: current.id, ...data })
    report.updated += 1
  }

  return report
}

function extraAnnotations() {
  return [
    {
      key: "configurator.storage_scenario",
      page: "configurator",
      target_type: "group",
      component_type: "storage_scenario",
      title: "Сценарий корзины",
      body: "В этом конфигураторе доступны только варианты текущего DL360 шаблона. Chassis/storage variants берутся из server_model, а опции корзины - из component/backplane.",
      placement: "right",
      icon: "info",
      severity: "info",
      sort_order: 10,
      enabled: true,
      source_doc_reference: "Payloud UI annotation migrated to Medusa DB",
    },
    {
      key: "catalog.filters",
      page: "catalog",
      target_type: "filters",
      component_type: "filters",
      title: "Все фильтры",
      body: "Фильтры строятся по server_model и Store API facets. Коммерческие и технические значения должны приходить из backend data.",
      placement: "top",
      icon: "sliders",
      severity: "info",
      sort_order: 100,
      enabled: true,
      source_doc_reference: "Payloud UI annotation migrated to Medusa DB",
    },
    {
      key: "header.catalog_menu",
      page: "global",
      target_type: "navigation",
      component_type: "catalog_menu",
      title: "Меню каталога",
      body: "Меню заполняется server_model из Medusa backend. Не храните каталог моделей в frontend fallback.",
      placement: "bottom",
      icon: "menu",
      severity: "info",
      sort_order: 110,
      enabled: true,
      source_doc_reference: "Payloud UI annotation migrated to Medusa DB",
    },
  ]
}

async function upsertAnnotations(service: any) {
  const existing = await service.listHelpAnnotations({}, { take: 10000 })
  const byKey = new Map(existing.map((item: any) => [`${item.page}:${item.key}`, item]))
  const report = { created: 0, updated: 0, unchanged: 0 }
  const annotations = [...defaultHelpAnnotations, ...extraAnnotations()]

  for (const annotation of annotations) {
    const current = byKey.get(`${annotation.page}:${annotation.key}`) as any
    const next = {
      ...annotation,
      metadata_json: {
        ...annotationSourceMeta,
        original_id: annotation.key,
      },
    }

    if (!current) {
      await service.createHelpAnnotations(next)
      report.created += 1
      continue
    }

    const changed =
      clean(current.title) !== clean(next.title) ||
      clean(current.body) !== clean(next.body) ||
      clean(current.component_type) !== clean(next.component_type) ||
      clean(current.target_type) !== clean(next.target_type) ||
      clean(current.source_doc_reference) !== clean(next.source_doc_reference) ||
      Number(current.sort_order || 0) !== Number(next.sort_order || 0) ||
      jsonContains(current.metadata_json, next.metadata_json) === false

    if (!changed) {
      report.unchanged += 1
      continue
    }

    await service.updateHelpAnnotations({ id: current.id, ...next })
    report.updated += 1
  }

  return report
}

function compatibilityRules() {
  return [
    {
      name: "NVMe requires NVMe backplane",
      enabled: true,
      priority: 40,
      scope_type: "generation",
      scope_value: "Gen10",
      category: "storage",
      rule_type: "block",
      conditions_json: {
        and: [
          { fact: "selected_drive_interface", operator: "equals", value: "NVMe" },
          { fact: "backplane_interfaces", operator: "not_includes", value: "NVMe" },
        ],
      },
      action_json: { block: true },
      message: "NVMe накопители требуют выбранный NVMe backplane, NVMe Media Bay или integrated NVMe chassis.",
      admin_note: "Canonical DB-first rule migrated from runtime fallback cleanup.",
      source_doc_reference: "CONFIGURATOR_BACKEND_MANUAL.md; HPE DL360 Gen10 QuickSpecs",
      version: "2",
    },
    {
      name: "4LFF chassis limits drive form factor",
      enabled: true,
      priority: 45,
      scope_type: "chassis_variant",
      scope_value: "4LFF",
      category: "storage",
      rule_type: "block",
      conditions_json: {
        fact: "selected_drive_interface",
        operator: "equals",
        value: "NVMe",
      },
      action_json: { block: true },
      message: "4LFF допускает LFF SAS/SATA и 2.5 SAS/SATA SSD через adapter path, но блокирует NVMe.",
      admin_note: "Replaces old form-factor-only block so 2.5 SAS/SATA adapter path remains valid.",
      source_doc_reference: "CONFIGURATOR_BACKEND_MANUAL.md; HPE DL360 Gen10 QuickSpecs",
      version: "2",
    },
    {
      name: "DL360 FlexibleLOM max quantity",
      enabled: true,
      priority: 50,
      scope_type: "family",
      scope_value: "ProLiant DL360",
      category: "nic",
      rule_type: "limit",
      conditions_json: { fact: "nic_flexiblelom_qty", operator: "greater_than", value: 1 },
      action_json: { set_limit: { fact: "nic_flexiblelom_qty", max: 1 } },
      message: "FlexibleLOM слот один, поэтому можно выбрать только один FlexibleLOM адаптер.",
      admin_note: "Canonical DB-first rule. Imported draft rules remain disabled.",
      source_doc_reference: "CONFIGURATOR_BACKEND_MANUAL.md; HPE DL360 Gen10 QuickSpecs",
      version: "1",
    },
    {
      name: "DL360 PCIe NIC max quantity",
      enabled: true,
      priority: 51,
      scope_type: "family",
      scope_value: "ProLiant DL360",
      category: "nic",
      rule_type: "limit",
      conditions_json: { fact: "nic_pcie_qty", operator: "greater_than", value: 2 },
      action_json: { set_limit: { fact: "nic_pcie_qty", max: 2 } },
      message: "Для PCIe сетевых карт доступно максимум 2 riser-слота: один full-height и один low-profile.",
      admin_note: "Canonical DB-first rule. Imported draft rules remain disabled.",
      source_doc_reference: "CONFIGURATOR_BACKEND_MANUAL.md; HPE DL360 Gen10 QuickSpecs",
      version: "1",
    },
    {
      name: "DL360 total NIC max quantity",
      enabled: true,
      priority: 52,
      scope_type: "family",
      scope_value: "ProLiant DL360",
      category: "nic",
      rule_type: "limit",
      conditions_json: { fact: "nic_qty", operator: "greater_than", value: 3 },
      action_json: { set_limit: { fact: "nic_qty", max: 3 } },
      message: "DL360 Gen10 допускает максимум 3 сетевых адаптера в этой модели: 1 FlexibleLOM и до 2 PCIe standup.",
      admin_note: "Canonical DB-first rule. Imported draft rules remain disabled.",
      source_doc_reference: "CONFIGURATOR_BACKEND_MANUAL.md; HPE DL360 Gen10 QuickSpecs",
      version: "1",
    },
  ]
}

async function upsertRules(service: any) {
  const existing = await service.listCompatibilityRules({}, { take: 10000 })
  const byName = new Map(existing.map((item: any) => [clean(item.name).toLowerCase(), item]))
  const report = { created: 0, updated: 0, unchanged: 0 }

  for (const rule of compatibilityRules()) {
    const current = byName.get(rule.name.toLowerCase()) as any
    if (!current) {
      await service.createCompatibilityRules(rule)
      report.created += 1
      continue
    }

    const changed =
      Boolean(current.enabled) !== rule.enabled ||
      Number(current.priority || 0) !== rule.priority ||
      clean(current.scope_type) !== rule.scope_type ||
      clean(current.scope_value) !== clean(rule.scope_value) ||
      clean(current.category) !== rule.category ||
      clean(current.rule_type) !== rule.rule_type ||
      clean(current.message) !== clean(rule.message) ||
      clean(current.admin_note) !== clean(rule.admin_note) ||
      clean(current.version) !== rule.version ||
      sameJson(current.conditions_json, rule.conditions_json) === false ||
      sameJson(current.action_json, rule.action_json) === false

    if (!changed) {
      report.unchanged += 1
      continue
    }

    await service.updateCompatibilityRules({ id: current.id, ...rule })
    report.updated += 1
  }

  return report
}

function rulePresets() {
  return [
    {
      name: "Numeric max limit",
      category: "generic",
      description: "Limit a numeric fact using set_limit.",
      conditions_template_json: { fact: "{{fact}}", operator: "greater_than", value: "{{max}}" },
      action_template_json: { set_limit: { fact: "{{fact}}", max: "{{max}}" } },
      enabled: true,
    },
    {
      name: "Selected interface requires backplane interface",
      category: "storage",
      description: "Block a drive interface when the selected backplane does not expose the interface.",
      conditions_template_json: {
        and: [
          { fact: "selected_drive_interface", operator: "equals", value: "{{interface}}" },
          { fact: "backplane_interfaces", operator: "not_includes", value: "{{interface}}" },
        ],
      },
      action_template_json: { block: true },
      enabled: true,
    },
  ]
}

async function upsertPresets(service: any) {
  const existing = await service.listRulePresets({}, { take: 10000 })
  const byName = new Map(existing.map((item: any) => [clean(item.name).toLowerCase(), item]))
  const report = { created: 0, updated: 0, unchanged: 0 }

  for (const preset of rulePresets()) {
    const current = byName.get(preset.name.toLowerCase()) as any
    if (!current) {
      await service.createRulePresets(preset)
      report.created += 1
      continue
    }

    const changed =
      clean(current.category) !== preset.category ||
      clean(current.description) !== clean(preset.description) ||
      Boolean(current.enabled) !== preset.enabled ||
      sameJson(current.conditions_template_json, preset.conditions_template_json) === false ||
      sameJson(current.action_template_json, preset.action_template_json) === false

    if (!changed) {
      report.unchanged += 1
      continue
    }

    await service.updateRulePresets({ id: current.id, ...preset })
    report.updated += 1
  }

  return report
}

export default async function seedConfiguratorDefaults({ container }: { container: MedusaContainer }) {
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any

  const result = {
    components: await upsertComponents(service),
    help_annotations: await upsertAnnotations(service),
    compatibility_rules: await upsertRules(service),
    rule_presets: await upsertPresets(service),
    note: "Default files are migrated into DB and must not be used as normal runtime sources.",
  }

  console.log(JSON.stringify(result, null, 2))
}
