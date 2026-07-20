import { MedusaService } from "@medusajs/framework/utils"
import Component from "./models/component"
import ComponentPack from "./models/component-pack"
import ComponentPackItem from "./models/component-pack-item"
import CompatibilityRule from "./models/compatibility-rule"
import Configuration from "./models/configuration"
import ConfigurationItem from "./models/configuration-item"
import HelpAnnotation from "./models/help-annotation"
import RulePreset from "./models/rule-preset"
import ServerModel from "./models/server-model"

type SelectedComponent = {
  component_id: string
  quantity?: number
}

type RuleResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
  required_components: string[]
  auto_added_components: string[]
  effective_specs: Record<string, unknown>
  total_price: number
  triggered_rules: unknown[]
  facts?: Record<string, unknown>
}

const OPERATORS: Record<string, (left: unknown, right: unknown) => boolean> = {
  equals: (left, right) => left === right,
  not_equals: (left, right) => left !== right,
  greater_than: (left, right) => Number(left) > Number(right),
  less_than: (left, right) => Number(left) < Number(right),
  includes: (left, right) => Array.isArray(left) && left.includes(right),
  not_includes: (left, right) => Array.isArray(left) && !left.includes(right),
  exists: (left) => left !== undefined && left !== null && left !== "",
  not_exists: (left) => left === undefined || left === null || left === "",
}

function getFact(facts: Record<string, unknown>, field: string) {
  return field.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object") {
      return (value as Record<string, unknown>)[key]
    }
    return undefined
  }, facts)
}

function evaluateConditions(condition: any, facts: Record<string, unknown>): boolean {
  if (!condition) {
    return true
  }

  if (Array.isArray(condition.and)) {
    return condition.and.every((item: any) => evaluateConditions(item, facts))
  }

  if (Array.isArray(condition.or)) {
    return condition.or.some((item: any) => evaluateConditions(item, facts))
  }

  const operator = OPERATORS[condition.operator || "equals"]
  return operator ? operator(getFact(facts, condition.fact), condition.value) : false
}

function buildFacts(serverModel: any, selectedComponents: any[]) {
  const byType = selectedComponents.reduce<Record<string, any[]>>((acc, item) => {
    acc[item.type] = acc[item.type] || []
    acc[item.type].push(item)
    return acc
  }, {})
  const cpuQty = byType.cpu?.reduce((sum, item) => sum + Number(item.quantity || 1), 0) || 0
  const ramQty = byType.ram?.reduce((sum, item) => sum + Number(item.quantity || 1), 0) || 0
  const driveQty = byType.drive?.reduce((sum, item) => sum + Number(item.quantity || 1), 0) || 0
  const psu = byType.psu?.[0]
  const cpu = byType.cpu?.[0]
  const ram = byType.ram?.[0]
  const drive = byType.drive?.[0]
  const nicItems = byType.nic || []
  const nicQty = nicItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
  const nicSlotTypes = nicItems
    .map((item) => item.specs_json?.slot_type || item.specs_json?.slotType)
    .filter(Boolean)
  const nicSpeeds = nicItems
    .map((item) => String(item.specs_json?.speed || item.model || ""))
    .filter(Boolean)
  const nicFlexibleLomQty = nicItems
    .filter((item) => componentText(item).includes("flexiblelom") || componentText(item).includes("flr"))
    .reduce((sum, item) => sum + Number(item.quantity || 1), 0)
  const nicPcieQty = nicItems
    .filter((item) => componentText(item).includes("pcie"))
    .reduce((sum, item) => sum + Number(item.quantity || 1), 0)
  const backplane = byType.backplane?.[0]

  return {
    brand: serverModel.brand,
    generation: serverModel.generation,
    family: serverModel.family,
    server_model: serverModel.public_name,
    slug: serverModel.slug,
    chassis_type: serverModel.chassis_type,
    backplane_type: serverModel.backplane_type,
    storage_interfaces: serverModel.supported_drive_interfaces || [],
    cpu_qty: cpuQty,
    cpu_socket: serverModel.cpu_socket,
    cpu_model: cpu?.model,
    cpu_tdp: cpu?.specs_json?.tdp || 0,
    cpu_max_memory_speed: cpu?.specs_json?.max_memory_speed || 2933,
    ram_qty: ramQty,
    ram_modules: ramQty,
    ram_type: ram?.specs_json?.type,
    ram_speed: ram?.specs_json?.speed || 0,
    drive_qty: driveQty,
    drive_form_factor: drive?.specs_json?.form_factor,
    drive_interface: drive?.specs_json?.interface,
    selected_drive_interface: drive?.specs_json?.interface,
    backplane_media_bay: Boolean(backplane?.specs_json?.media_bay || backplane?.specs_json?.logical_group === "media_bay"),
    backplane_role: backplane?.specs_json?.backplane_role,
    backplane_interfaces: backplane?.specs_json?.interfaces || (backplane?.specs_json?.interface ? [backplane.specs_json.interface] : []),
    backplane_effective_bay_count: backplane?.specs_json?.effective_bay_count,
    selected_raid: byType.raid?.[0]?.model,
    nic_qty: nicQty,
    nic_flexiblelom_qty: nicFlexibleLomQty,
    nic_pcie_qty: nicPcieQty,
    nic_slot_type: byType.nic?.[0]?.specs_json?.slot_type,
    nic_slot_types: nicSlotTypes,
    nic_speeds: nicSpeeds,
    psu_wattage: psu?.specs_json?.wattage || 0,
    total_estimated_power: selectedComponents.reduce((sum, item) => {
      return sum + Number(item.specs_json?.tdp || item.specs_json?.power || 0) * Number(item.quantity || 1)
    }, 150),
  }
}

function componentText(item: any) {
  return [
    item.public_name,
    item.short_name,
    item.model,
    item.brand,
    item.specs_json?.interface,
    item.specs_json?.interfaces?.join?.(" "),
    item.specs_json?.slot_type,
    item.specs_json?.height,
    item.specs_json?.connector,
  ].filter(Boolean).join(" ").toLowerCase()
}

function storageInterface(item: any) {
  const text = componentText(item)
  if (text.includes("nvme")) return "nvme"
  if (text.includes("sas")) return "sas"
  if (text.includes("sata")) return "sata"
  return ""
}

function storageLimits(serverModel: any, backplane?: any) {
  const specs = backplane?.specs_json || {}
  const backplaneText = backplane ? componentText(backplane) : String(serverModel.backplane_type || "").toLowerCase()
  const interfaces = (specs.interfaces || (specs.interface ? [specs.interface] : serverModel.supported_drive_interfaces || []))
    .map((item: string) => String(item).toLowerCase())
  const baseBayCount = Number(serverModel.drive_bays_front || 0)
  const providedBays = Number(
    specs.bay_count ||
    specs.added_bay_count ||
    specs.provides?.driveBays ||
    specs.provides?.devices ||
    0
  )
  const effectiveBayCount = Number(specs.effective_bay_count || 0)
  const mediaBay = Boolean(specs.media_bay || specs.logical_group === "media_bay")
  const normalizedType = String(specs.normalized_type || "").toLowerCase()

  if (mediaBay) {
    if (interfaces.includes("nvme") || backplaneText.includes("nvme")) {
      return { sasSata: baseBayCount, nvme: providedBays || 2, m2: 0 }
    }

    if (normalizedType.includes("m2") || backplaneText.includes("uff") || backplaneText.includes("m.2")) {
      return { sasSata: baseBayCount, nvme: 0, m2: providedBays || 4 }
    }

    if (interfaces.includes("sas") || interfaces.includes("sata") || backplaneText.includes("sas/sata")) {
      return { sasSata: effectiveBayCount || baseBayCount + providedBays, nvme: 0, m2: 0 }
    }

    return { sasSata: baseBayCount, nvme: 0, m2: 0 }
  }

  const bayCount = providedBays || effectiveBayCount || baseBayCount
  return {
    sasSata: interfaces.includes("sas") || interfaces.includes("sata") || backplaneText.includes("sas") || backplaneText.includes("sata")
      ? bayCount
      : 0,
    nvme: interfaces.includes("nvme") || backplaneText.includes("nvme")
      ? bayCount
      : 0,
    m2: normalizedType.includes("m2") || backplaneText.includes("m.2") || backplaneText.includes("uff")
      ? bayCount
      : 0,
  }
}

function maxDriveQuantityFor(serverModel: any, drive: any, backplane?: any) {
  const limits = storageLimits(serverModel, backplane)
  const text = componentText(drive)
  const iface = storageInterface(drive)
  if (text.includes("m.2") || text.includes("uff")) return limits.m2
  if (iface === "nvme") return limits.nvme
  if (iface === "sas" || iface === "sata") return limits.sasSata
  return 0
}

function applyBuiltInValidation(result: RuleResult, serverModel: any, selectedComponents: any[]) {
  const byType = selectedComponents.reduce<Record<string, any[]>>((acc, item) => {
    acc[item.type] = acc[item.type] || []
    acc[item.type].push(item)
    return acc
  }, {})

  const backplane = byType.backplane?.[0]
  const drive = byType.drive?.[0]
  if (drive) {
    const driveQty = byType.drive.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
    const maxDriveQty = maxDriveQuantityFor(serverModel, drive, backplane)
    result.effective_specs.drive_bay_max = maxDriveQty
    if (maxDriveQty <= 0) {
      result.valid = false
      result.errors.push("Выбранный накопитель не совместим с текущей корзиной / Media Bay.")
    } else if (driveQty > maxDriveQty) {
      result.valid = false
      result.errors.push(`Для выбранной корзины / Media Bay доступно максимум ${maxDriveQty} накопителей этого типа.`)
    }
  }

  const nics = byType.nic || []
  result.effective_specs.nic_qty = nics.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
}

class ServerConfiguratorModuleService extends MedusaService({
  ServerModel,
  Component,
  ComponentPack,
  ComponentPackItem,
  CompatibilityRule,
  RulePreset,
  Configuration,
  ConfigurationItem,
  HelpAnnotation,
}) {
  async validateConfiguration(input: {
    server_model_slug?: string
    server_model_id?: string
    selected_components: SelectedComponent[]
  }): Promise<RuleResult> {
    const service = this as any
    const [serverModel] = await service.listServerModels(
      input.server_model_id ? { id: input.server_model_id } : { slug: input.server_model_slug }
    )
    const componentIds = input.selected_components.map((item) => item.component_id)
    const dbComponents = componentIds.length
      ? await service.listComponents({ id: componentIds })
      : []
    const foundIds = new Set(dbComponents.map((component: any) => component.id))
    const missingIds = componentIds.filter((id) => !foundIds.has(id))
    const components = dbComponents
    const componentsWithQty = components.map((component: any) => ({
      ...component,
      quantity:
        input.selected_components.find((item) => item.component_id === component.id)?.quantity || 1,
    }))
    const facts = buildFacts(serverModel, componentsWithQty)
    const allRules = await service.listCompatibilityRules({ enabled: true })
    const rules = allRules
      .filter((rule: any) => {
        if (rule.scope_type === "global") return true
        if (rule.scope_type === "brand") return rule.scope_value === serverModel.brand
        if (rule.scope_type === "generation") return rule.scope_value === serverModel.generation
        if (rule.scope_type === "family") return rule.scope_value === serverModel.family
        if (rule.scope_type === "server_model") return rule.scope_value === serverModel.slug
        if (rule.scope_type === "chassis_variant") return rule.scope_value === serverModel.chassis_type
        return false
      })
      .sort((a: any, b: any) => Number(a.priority) - Number(b.priority))

    const result: RuleResult = {
      valid: true,
      errors: [],
      warnings: [],
      required_components: [],
      auto_added_components: [],
      effective_specs: {
        ram_speed: facts.ram_speed,
      },
      total_price:
        0 +
        componentsWithQty.reduce((sum: number, item: any) => {
          return sum + Number(item.price || 0) * Number(item.quantity || 1)
        }, 0),
      triggered_rules: [],
      facts,
    }

    if (missingIds.length) {
      result.valid = false
      result.errors.push(`Компоненты не найдены в server-configurator DB: ${missingIds.join(", ")}`)
    }

    applyBuiltInValidation(result, serverModel, componentsWithQty)

    for (const rule of rules) {
      if (!evaluateConditions(rule.conditions_json, facts)) {
        continue
      }

      result.triggered_rules.push({
        id: rule.id,
        name: rule.name,
        scope_type: rule.scope_type,
        scope_value: rule.scope_value,
        source_doc_reference: rule.source_doc_reference,
      })

      const action = rule.action_json || {}
      if (rule.rule_type === "block") {
        result.valid = false
        result.errors.push(rule.message || "Configuration is blocked by a compatibility rule.")
      }
      if (rule.rule_type === "warning" || action.warning) {
        result.warnings.push(rule.message || action.warning)
      }
      if (rule.rule_type === "require" && action.component_type) {
        result.required_components.push(action.component_type)
      }
      if (rule.rule_type === "auto_add" && action.component_type) {
        result.auto_added_components.push(action.component_type)
      }
      if (action.set_limit?.fact && action.set_limit?.max !== undefined) {
        result.effective_specs[`${action.set_limit.fact}_max`] = action.set_limit.max
        const factValue = Number(getFact(facts, action.set_limit.fact))
        if (factValue > Number(action.set_limit.max)) {
          result.valid = false
          result.errors.push(rule.message || `${action.set_limit.fact} exceeds allowed maximum.`)
        }
      }
      if (action.set_effective_value?.field) {
        result.effective_specs[action.set_effective_value.field] = action.set_effective_value.value_from_fact
          ? getFact(facts, action.set_effective_value.value_from_fact)
          : action.set_effective_value.value
      }
      if (action.add_price) {
        result.total_price += Number(action.add_price)
      }
      if (action.multiply_price) {
        result.total_price *= Number(action.multiply_price)
      }
    }

    return result
  }
}

export default ServerConfiguratorModuleService
