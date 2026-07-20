import { CompatibilityData } from "./types"
import { array, number, specs, unique } from "./utils"

export function selectedComponents(data: CompatibilityData): { components: any[]; duplicateIds: string[]; invalidQuantities: string[]; missingIds: string[] } {
  const componentsById = new Map(data.components.map((component) => [component.id, component]))
  const quantities = new Map<string, number>()
  const duplicateIds: string[] = []
  const invalidQuantities: string[] = []
  const missingIds: string[] = []
  for (const item of data.selected) {
    const quantity = Number(item.quantity ?? 1)
    if (!Number.isInteger(quantity) || quantity <= 0) invalidQuantities.push(item.component_id)
    if (quantities.has(item.component_id)) duplicateIds.push(item.component_id)
    quantities.set(item.component_id, (quantities.get(item.component_id) || 0) + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0))
    if (!componentsById.has(item.component_id)) missingIds.push(item.component_id)
  }
  return {
    components: [...quantities.entries()].flatMap(([id, quantity]) => {
      const component = componentsById.get(id)
      return component ? [{ ...component, quantity }] : []
    }),
    duplicateIds: unique(duplicateIds),
    invalidQuantities: unique(invalidQuantities),
    missingIds: unique(missingIds),
  }
}

export function buildFacts(data: CompatibilityData, components: any[], resolvedProperties: Array<{ key: string; value: unknown }>) {
  const byType = components.reduce<Record<string, any[]>>((result, component) => {
    ;(result[component.type] ||= []).push(component)
    return result
  }, {})
  const quantity = (type: string) => (byType[type] || []).reduce((sum, item) => sum + number(item.quantity, 1), 0)
  const values = (type: string, key: string) => unique((byType[type] || []).flatMap((item) => array(specs(item)[key])))
  const power = components.reduce((sum, item) => sum + number(specs(item).tdp ?? specs(item).power_watts ?? specs(item).power, 0) * number(item.quantity, 1), number(data.model?.base_power_watts, 150))
  return {
    model: { ...data.model },
    brand: data.model?.brand,
    generation: data.model?.generation,
    family: data.model?.family,
    server_model: data.model?.public_name,
    slug: data.model?.slug,
    chassis_type: data.model?.chassis_type,
    cpu_qty: quantity("cpu"),
    cpu_sockets: values("cpu", "socket"),
    cpu_generations: values("cpu", "generation"),
    cpu_tdp_total: (byType.cpu || []).reduce((sum, item) => sum + number(specs(item).tdp) * number(item.quantity, 1), 0),
    ram_qty: quantity("ram"),
    ram_capacity_total: (byType.ram || []).reduce((sum, item) => sum + number(specs(item).capacity_gb ?? specs(item).capacity) * number(item.quantity, 1), 0),
    ram_types: values("ram", "type"),
    ram_generations: values("ram", "generation"),
    ram_speeds: values("ram", "speed"),
    drive_qty: quantity("drive"),
    drive_protocols: unique([...values("drive", "protocol"), ...values("drive", "interface")]),
    drive_form_factors: values("drive", "form_factor"),
    raid_qty: quantity("raid"),
    nic_qty: quantity("nic"),
    accelerator_qty: quantity("accelerator"),
    boot_storage_qty: quantity("boot_storage"),
    psu_qty: quantity("psu"),
    cooling_qty: quantity("cooling"),
    total_estimated_power: power,
    selected_component_ids: components.map((component) => component.id),
    selected_component_types: components.map((component) => component.type),
    properties: Object.fromEntries(resolvedProperties.map((property) => [property.key, property.value])),
  }
}
