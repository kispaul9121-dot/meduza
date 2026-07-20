import type { CompatibilityData } from "./engine"

const GROUP_ORDER: Record<string, number> = {
  cpu: 10,
  ram: 20,
  drive: 30,
  raid: 40,
  nic: 50,
  accelerator: 60,
  psu: 70,
  riser: 80,
  boot_storage: 90,
  backplane: 100,
  drive_cage: 110,
  cable: 120,
  rails: 130,
  cooling: 140,
  license: 150,
  service: 160,
}

const GROUP_TITLES: Record<string, string> = {
  cpu: "Процессоры",
  ram: "Оперативная память",
  drive: "Накопители",
  raid: "RAID / HBA",
  nic: "Сетевые адаптеры",
  accelerator: "GPU и ускорители",
  psu: "Блоки питания",
  riser: "Райзеры",
  boot_storage: "Загрузочные накопители",
  backplane: "Дисковые корзины и backplane",
  drive_cage: "Дисковые корзины",
  cable: "Кабельные комплекты",
  rails: "Рельсы",
  cooling: "Охлаждение",
  license: "Лицензии",
  service: "Сервис",
}

const NONE_BY_DEFAULT = new Set(["accelerator", "boot_storage", "rails"])

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  return value === null || value === undefined || value === "" ? [] : [value]
}

function stringList(...values: unknown[]) {
  return [...new Set(values.flatMap(asArray).flatMap((value) => {
    if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean)
    if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key)
    return value === undefined || value === null ? [] : [String(value)]
  }))]
}

function componentSpecs(option: any) {
  return { ...(option.specs_json || {}), ...(option.normalized_specs_json || {}) }
}

export function buildStorefrontGroups(data: CompatibilityData, options: any[]) {
  const typeDefinitions = new Map((data.component_type_definitions || []).map((definition: any) => [definition.key, definition]))
  const persisted = (data.option_groups || []).filter((group: any) => group.enabled !== false)
  const groups = persisted.length ? persisted : [...new Set(options.map((option) => option.type).filter(Boolean))].map((type) => ({
    key: String(type),
    title: (typeDefinitions.get(type) as any)?.name || GROUP_TITLES[type] || String(type),
    component_type: type,
    source_types_json: [...new Set(options.filter((option) => option.type === type).flatMap((option) => option.source_types || []))],
    selection_cardinality: "zero_or_many",
    allow_none: true,
    none_label: "Не добавлять",
    none_selected_by_default: NONE_BY_DEFAULT.has(String(type)),
    min_quantity: 0,
    max_quantity: Math.max(1, ...options.filter((option) => option.type === type).map((option) => Number(option.max_quantity || 1))),
    sort_order: GROUP_ORDER[String(type)] || 1000,
    advanced: ["backplane", "drive_cage", "cable", "cooling"].includes(String(type)),
    help_text: null,
    visibility_rules_json: null,
    schema_version: 1,
    enabled: true,
    derived: true,
  }))

  return groups
    .map((group: any) => ({
      ...group,
      label: group.title,
      derived: Boolean(group.derived),
      none: group.allow_none ? {
        value: null,
        label: group.none_label || "Не добавлять",
        selected_by_default: Boolean(group.none_selected_by_default),
      } : null,
      options: options.filter((option) => option.type === group.component_type),
    }))
    .filter((group: any) => group.options.length > 0)
    .sort((left: any, right: any) => Number(left.sort_order || 1000) - Number(right.sort_order || 1000) || String(left.title).localeCompare(String(right.title)))
}

function baseStorageChoice(model: any) {
  const totalBays = Number(model?.drive_bays_front || 0) + Number(model?.drive_bays_rear || 0)
  return {
    id: "base-model-storage",
    key: "base-model-storage",
    public_name: totalBays ? `Базовая дисковая конфигурация: ${totalBays} отс.` : "Базовая дисковая конфигурация",
    source: "server_model",
    resolution_status: "base_model",
    storage_option_id: null,
    component_id: null,
    total_bays: totalBays || null,
    zones: [Number(model?.drive_bays_front || 0) > 0 ? "front" : null, Number(model?.drive_bays_rear || 0) > 0 ? "rear" : null].filter(Boolean),
    form_factors: stringList(model?.drive_form_factor),
    protocols: stringList(model?.supported_drive_interfaces),
    smaller_form_factor_via_adapter: "not_specified",
    requirements: { controller: "not_specified", cables: "not_specified", other: [] },
    conflicts: [],
    technical_details: { source_doc_reference: model?.source_doc_reference || null },
    available: true,
    disabled: false,
    reason_codes: [],
  }
}

export function buildStorageChoices(data: CompatibilityData, options: any[]) {
  const model = data.model || {}
  const persisted = (data.storage_options || []).filter((option: any) => option.enabled !== false).map((option: any) => ({
    id: option.id,
    key: option.key,
    public_name: option.public_name,
    source: "server_storage_option",
    resolution_status: "persisted",
    storage_option_id: option.id,
    component_id: null,
    total_bays: Number(option.drive_limits_json?.total || option.drive_limits_json?.max_total_drives || 0) || null,
    zones: asArray(option.storage_cages_json),
    form_factors: stringList(option.drive_limits_json?.form_factors),
    protocols: stringList(option.drive_limits_json?.protocols),
    smaller_form_factor_via_adapter: option.drive_limits_json?.smaller_form_factor_via_adapter ?? "not_specified",
    requirements: {
      controller: option.drive_limits_json?.required_controller || "not_specified",
      cables: option.drive_limits_json?.required_cables || "not_specified",
      other: stringList(option.required_bundles_json),
    },
    conflicts: stringList(option.conflicts_json),
    technical_details: { source_doc_reference: option.source_doc_reference || null },
    available: true,
    disabled: false,
    reason_codes: [],
  }))

  const componentChoices = options
    .filter((option) => ["backplane", "drive_cage"].includes(option.type))
    .map((option) => {
      const specs = componentSpecs(option)
      const provides = { ...(option.provides_json || {}), ...(specs.provides || {}) }
      const requirements = { ...(option.requirements_json || {}), ...(specs.requires || {}) }
      const addedBays = Number(provides.driveBays || provides.devices || specs.drive_bays || specs.bays || 0)
      return {
        id: `component:${option.id}`,
        key: `component:${option.id}`,
        public_name: option.public_name,
        source: "compatibility_engine",
        resolution_status: "engine_candidate",
        storage_option_id: null,
        component_id: option.id,
        total_bays: addedBays || null,
        zones: stringList(specs.location, provides.location),
        form_factors: stringList(specs.supportedFormFactors, specs.form_factors, specs.form_factor, provides.formFactor),
        protocols: stringList(specs.interfaces, specs.interface, specs.protocols, provides.protocol),
        smaller_form_factor_via_adapter: specs.smaller_form_factor_via_adapter ?? specs.adapter_required ?? "not_specified",
        requirements: {
          controller: requirements.controller || requirements.controllerType || requirements.raid || "not_specified",
          cables: requirements.cables || requirements.cable || "not_specified",
          other: stringList(requirements.components, option.required_bundles),
        },
        conflicts: stringList(option.conflicts, specs.conflicts, option.conflicts_json),
        technical_details: { part_number: option.part_number || null, qualification: option.qualification || null },
        available: option.available !== false && option.disabled !== true,
        disabled: Boolean(option.disabled),
        reason_codes: option.reason_codes || [],
      }
    })

  return [baseStorageChoice(model), ...persisted, ...componentChoices]
}
