import { Validator, ValidatorContext } from "./types"
import { array, componentText, makeIssue, number, specs, text, unique } from "./utils"

function declaredCompatible(actual: unknown, allowed: unknown): boolean {
  const allowedValues = array(allowed).map(text).filter(Boolean)
  return !text(actual) || allowedValues.length === 0 || allowedValues.includes(text(actual))
}

function fail(context: ValidatorContext, code: string, message: string, validator: string, component?: any, details?: Record<string, unknown>) {
  context.addIssue(makeIssue(code, message, validator, "blocker", { component_id: component?.id, details }))
}

const cpu: Validator = (context) => {
  const cpus = context.byType.cpu || []
  const quantity = cpus.reduce((sum, item) => sum + number(item.quantity, 1), 0)
  const maxSockets = number(context.data.model?.max_cpu ?? context.data.model?.max_sockets, 1)
  context.effective.cpu_quantity = quantity
  context.effective.cpu_socket_max = maxSockets
  if (quantity > maxSockets) fail(context, "CPU_SOCKET_CAPACITY_EXCEEDED", `Selected ${quantity} CPUs but the server provides ${maxSockets} sockets.`, "cpu")
  const cpuModels = unique(cpus.map((item) => item.model).filter(Boolean))
  if (cpuModels.length > 1 && !context.data.model?.allow_mixed_cpu_models) fail(context, "CPU_MODEL_MIXED", `Multi-socket configuration must use identical CPUs: ${cpuModels.join(", ")}.`, "cpu")
  for (const component of cpus) {
    const value = specs(component)
    if (!declaredCompatible(value.socket, context.data.model?.cpu_socket)) fail(context, "CPU_SOCKET_MISMATCH", `${component.public_name} uses an unsupported socket.`, "cpu", component)
    const allowedGenerations = context.data.model?.supported_cpu_generations || context.data.model?.cpu_generations
    if (!declaredCompatible(value.generation, allowedGenerations)) fail(context, "CPU_GENERATION_MISMATCH", `${component.public_name} uses an unsupported CPU generation.`, "cpu", component)
    const qualification = value.qualification || component.qualification
    if (qualification === "unsupported") fail(context, "CPU_UNSUPPORTED", `${component.public_name} is explicitly unsupported.`, "cpu", component)
  }
  const installed = Math.min(quantity, maxSockets)
  context.effective.memory_slots = number(context.data.model?.ram_slots_per_cpu) > 0
    ? installed * number(context.data.model.ram_slots_per_cpu)
    : number(context.data.model?.ram_slots_total)
  const cpuMemoryLimits = cpus.map((item) => number(specs(item).max_memory_gb, Number.MAX_SAFE_INTEGER))
  context.effective.memory_capacity_gb = Math.min(number(context.data.model?.max_ram_capacity_gb, Number.MAX_SAFE_INTEGER), ...cpuMemoryLimits)
  context.effective.cpu_owned_pcie_lanes = cpus.reduce((sum, item) => sum + number(specs(item).pcie_lanes) * number(item.quantity, 1), 0)
  context.effective.cpu_power_watts = cpus.reduce((sum, item) => sum + number(specs(item).tdp) * number(item.quantity, 1), 0)
}

const memory: Validator = (context) => {
  const modules = context.byType.ram || []
  const quantity = modules.reduce((sum, item) => sum + number(item.quantity, 1), 0)
  const availableSlots = number(context.effective.memory_slots, number(context.data.model?.ram_slots_total))
  if (quantity > availableSlots) fail(context, "MEMORY_SLOTS_EXCEEDED", `Selected ${quantity} memory modules but only ${availableSlots} slots are active.`, "memory")
  const types = unique(modules.map((item) => text(specs(item).type)).filter(Boolean))
  const generations = unique(modules.map((item) => text(specs(item).generation || specs(item).ddr_generation)).filter(Boolean))
  if (types.length > 1 && !context.data.model?.allow_mixed_memory_types) fail(context, "MEMORY_TYPE_MIXED", `Memory types cannot be mixed: ${types.join(", ")}.`, "memory")
  if (generations.length > 1) fail(context, "MEMORY_GENERATION_MIXED", `DDR generations cannot be mixed: ${generations.join(", ")}.`, "memory")
  const capacity = modules.reduce((sum, item) => sum + number(specs(item).capacity_gb ?? specs(item).capacity) * number(item.quantity, 1), 0)
  const capacityLimit = number(context.effective.memory_capacity_gb, number(context.data.model?.max_ram_capacity_gb, Number.MAX_SAFE_INTEGER))
  if (capacity > capacityLimit) fail(context, "MEMORY_CAPACITY_EXCEEDED", `Selected ${capacity} GB but the effective limit is ${capacityLimit} GB.`, "memory")
  for (const component of modules) {
    const value = specs(component)
    if (!declaredCompatible(value.type, context.data.model?.supported_ram_types)) fail(context, "MEMORY_TYPE_UNSUPPORTED", `${component.public_name} uses an unsupported memory type.`, "memory", component)
    if (!declaredCompatible(value.generation || value.ddr_generation, context.data.model?.supported_ram_generations)) fail(context, "MEMORY_GENERATION_UNSUPPORTED", `${component.public_name} uses an unsupported DDR generation.`, "memory", component)
  }
  const speeds = [
    number(context.data.model?.max_memory_speed, Number.MAX_SAFE_INTEGER),
    ...array(context.byType.cpu).map((item) => number(specs(item).max_memory_speed, Number.MAX_SAFE_INTEGER)),
    ...modules.map((item) => number(specs(item).speed, Number.MAX_SAFE_INTEGER)),
  ]
  const populationPenalty = quantity > number(context.data.model?.memory_full_speed_slots, availableSlots) ? number(context.data.model?.memory_population_speed) : Number.MAX_SAFE_INTEGER
  context.effective.ram_speed = Math.min(...speeds, populationPenalty)
  context.effective.ram_capacity_gb = capacity
  context.effective.ram_slots_used = quantity
}

type Zone = {
  id: string
  capacity: number
  protocols: string[]
  native: string[]
  accepted: string[]
  adapters: Record<string, string>
  perProtocol: Record<string, number>
  used: number
  usedProtocol: Record<string, number>
}

function storageZones(context: ValidatorContext): Zone[] {
  const priorities = new Map((context.data.scope_chain || []).map((scope, index) => [`${scope.type}:${scope.id}`, index]))
  const topology = [...(context.data.storage_topologies || [])].sort((left: any, right: any) =>
    Number(priorities.get(`${right.owner_type}:${right.owner_id}`) || 0) - Number(priorities.get(`${left.owner_type}:${left.owner_id}`) || 0)
  )[0]
  const rawZones = array<any>(topology?.zones_json)
  if (rawZones.length) return rawZones.map((zone, index) => ({
    id: String(zone.id || zone.key || `zone-${index + 1}`),
    capacity: number(zone.capacity ?? zone.max_total_drives ?? zone.bay_count ?? array(zone.bays).length),
    protocols: array<string>(zone.protocols || zone.supported_protocols).map(text),
    native: array<string>(zone.form_factors || zone.native_form_factors || zone.form_factor).map(text),
    accepted: array<string>(zone.accepted_form_factors).map(text),
    adapters: zone.adapters || zone.adapter_by_form_factor || {},
    perProtocol: zone.per_protocol_limits || zone.max_protocol_bays || {},
    used: 0,
    usedProtocol: {},
  }))
  const capacity = number(context.data.model?.drive_bays_front) + number(context.data.model?.drive_bays_rear)
  return capacity > 0 ? [{
    id: "model-bays",
    capacity,
    protocols: array<string>(context.data.model?.supported_drive_interfaces).map(text),
    native: array<string>(context.data.model?.drive_form_factor).map(text),
    accepted: [], adapters: {}, perProtocol: {}, used: 0, usedProtocol: {},
  }] : []
}

const storage: Validator = (context) => {
  const drives = context.byType.drive || []
  const zones = storageZones(context)
  for (const drive of drives) {
    const value = specs(drive)
    const protocol = text(value.protocol || value.interface)
    const formFactor = text(value.form_factor)
    for (let instance = 1; instance <= number(drive.quantity, 1); instance += 1) {
      const requestedZone = context.data.selected.find((item) => item.component_id === drive.id)?.zone_id
      let adapter: string | undefined
      const zone = zones.find((candidate) => {
        if (requestedZone && candidate.id !== requestedZone) return false
        const protocolAllowed = !protocol || candidate.protocols.length === 0 || candidate.protocols.includes(protocol)
        const native = !formFactor || candidate.native.length === 0 || candidate.native.includes(formFactor)
        const accepted = candidate.accepted.includes(formFactor) || Boolean(candidate.adapters[formFactor])
        if (!native && accepted) adapter = candidate.adapters[formFactor]
        const protocolLimit = number(candidate.perProtocol[protocol], candidate.capacity)
        return protocolAllowed && (native || accepted) && candidate.used < candidate.capacity && number(candidate.usedProtocol[protocol]) < protocolLimit
      })
      if (!zone) {
        context.placements.push({ component_id: drive.id, instance, protocol, form_factor: formFactor, result: "rejected", reason_code: "STORAGE_ZONE_UNAVAILABLE" })
        fail(context, "STORAGE_ZONE_UNAVAILABLE", `No storage zone can accept ${drive.public_name} instance ${instance}.`, "storage", drive, { protocol, form_factor: formFactor })
        continue
      }
      zone.used += 1
      zone.usedProtocol[protocol] = number(zone.usedProtocol[protocol]) + 1
      context.placements.push({ component_id: drive.id, instance, zone_id: zone.id, bay_id: `${zone.id}:${zone.used}`, protocol, form_factor: formFactor, adapter_required: adapter, result: "placed", reason_code: adapter ? "STORAGE_PLACED_WITH_ADAPTER" : "STORAGE_PLACED" })
    }
  }
  const controllerCapacity = (context.byType.raid || []).reduce((sum, item) => sum + number(specs(item).max_drives, Number.MAX_SAFE_INTEGER), 0)
  if (drives.length && controllerCapacity !== 0 && context.placements.filter((item) => item.result === "placed").length > controllerCapacity) fail(context, "CONTROLLER_DRIVE_LIMIT_EXCEEDED", "Selected drives exceed controller port/capacity limits.", "storage")
  context.effective.storage_zones = zones.map((zone) => ({ id: zone.id, used: zone.used, capacity: zone.capacity, protocol_usage: zone.usedProtocol }))
  context.effective.drive_bays_used = context.placements.filter((item) => item.result === "placed").length
}

const raid: Validator = (context) => {
  const controllers = context.byType.raid || []
  const driveProtocols = unique((context.byType.drive || []).map((drive) => text(specs(drive).protocol || specs(drive).interface)).filter(Boolean))
  for (const controller of controllers) {
    const value = specs(controller)
    for (const protocol of driveProtocols) if (!declaredCompatible(protocol, value.protocols || value.interfaces)) fail(context, "RAID_PROTOCOL_MISMATCH", `${controller.public_name} does not support ${protocol}.`, "raid", controller)
    const selectedLevel = value.selected_raid_level
    if (selectedLevel && !declaredCompatible(selectedLevel, value.raid_levels)) fail(context, "RAID_LEVEL_UNSUPPORTED", `${controller.public_name} does not support RAID ${selectedLevel}.`, "raid", controller)
    if (value.required_cables && array(value.required_cables).length > (context.byType.cable || []).length) fail(context, "RAID_CABLE_REQUIRED", `${controller.public_name} requires additional cables.`, "raid", controller)
  }
}

function expansionConsumers(context: ValidatorContext) {
  return ["raid", "nic", "riser", "accelerator", "boot_storage"].flatMap((type) => context.byType[type] || []).filter((item) => text(specs(item).slot_type).includes("pcie") || number(specs(item).pcie_lanes) > 0)
}

const expansion: Validator = (context) => {
  const consumers = expansionConsumers(context)
  const slotsUsed = consumers.reduce((sum, item) => sum + number(specs(item).slot_width, 1) * number(item.quantity, 1), 0)
  const lanesUsed = consumers.reduce((sum, item) => sum + number(specs(item).pcie_lanes) * number(item.quantity, 1), 0)
  const slots = number(context.data.model?.pcie_slots ?? context.facts.properties?.["expansion.pcie_slots"], Number.MAX_SAFE_INTEGER)
  const lanes = number(context.effective.cpu_owned_pcie_lanes, number(context.data.model?.pcie_lanes, Number.MAX_SAFE_INTEGER))
  if (slotsUsed > slots) fail(context, "PCIE_SLOTS_EXCEEDED", `PCIe devices consume ${slotsUsed} slots but only ${slots} are available.`, "expansion")
  if (lanesUsed > lanes) fail(context, "PCIE_LANES_EXCEEDED", `PCIe devices consume ${lanesUsed} lanes but only ${lanes} are available.`, "expansion")
  context.effective.pcie_slots_used = slotsUsed
  context.effective.pcie_lanes_used = lanesUsed
}

const network: Validator = (context) => {
  const adapters = context.byType.nic || []
  const mezzanineKinds = ["flexiblelom", "ndc", "ocp3", "ocp 3.0", "network_mezzanine"]
  let mezzanineCount = 0
  for (const adapter of adapters) {
    const value = specs(adapter)
    const kind = text(value.expansion_type || value.slot_type)
    const haystack = `${kind} ${componentText(adapter)}`
    if (mezzanineKinds.some((item) => haystack.includes(item))) mezzanineCount += number(adapter.quantity, 1)
    const allowed = context.data.model?.network_slot_types
    if (!declaredCompatible(kind, allowed)) fail(context, "NETWORK_SLOT_TYPE_UNSUPPORTED", `${adapter.public_name} requires an unsupported network slot.`, "network", adapter)
  }
  if (mezzanineCount > number(context.data.model?.network_mezzanine_slots, 1)) fail(context, "NETWORK_MEZZANINE_SLOTS_EXCEEDED", "Too many mezzanine/OCP/NDC/FlexibleLOM adapters are selected.", "network")
  context.effective.network_mezzanine_used = mezzanineCount
}

const accelerator: Validator = (context) => {
  for (const gpu of context.byType.accelerator || []) {
    const value = specs(gpu)
    const quantity = number(gpu.quantity, 1)
    const qualification = value.qualification || "technically_compatible"
    context.effective[`accelerator.${gpu.id}.qualification`] = qualification
    if (qualification === "unsupported") fail(context, "ACCELERATOR_UNSUPPORTED", `${gpu.public_name} is explicitly unsupported.`, "accelerator", gpu)
    if (number(value.max_quantity, quantity) < quantity) fail(context, "ACCELERATOR_QUANTITY_EXCEEDED", `${gpu.public_name} exceeds its qualified quantity.`, "accelerator", gpu)
    if (number(value.height_units, 1) > number(context.data.model?.gpu_max_height_units, Number.MAX_SAFE_INTEGER)) fail(context, "ACCELERATOR_HEIGHT_UNSUPPORTED", `${gpu.public_name} exceeds GPU height clearance.`, "accelerator", gpu)
    if (number(value.length_mm) > number(context.data.model?.gpu_max_length_mm, Number.MAX_SAFE_INTEGER)) fail(context, "ACCELERATOR_LENGTH_UNSUPPORTED", `${gpu.public_name} exceeds GPU length clearance.`, "accelerator", gpu)
    if (number(value.slot_width, 1) > number(context.data.model?.gpu_max_slot_width, Number.MAX_SAFE_INTEGER)) fail(context, "ACCELERATOR_WIDTH_UNSUPPORTED", `${gpu.public_name} exceeds GPU slot width.`, "accelerator", gpu)
    if (value.required_fan_kit && !(context.byType.cooling || []).some((item) => item.id === value.required_fan_kit)) fail(context, "ACCELERATOR_FAN_KIT_REQUIRED", `${gpu.public_name} requires fan kit ${value.required_fan_kit}.`, "accelerator", gpu)
    if (value.required_riser && !(context.byType.riser || []).some((item) => item.id === value.required_riser)) fail(context, "ACCELERATOR_RISER_REQUIRED", `${gpu.public_name} requires riser ${value.required_riser}.`, "accelerator", gpu)
    if (value.aux_power_connector && !(context.byType.cable || []).some((item) => array(specs(item).connectors).map(text).includes(text(value.aux_power_connector)))) fail(context, "ACCELERATOR_POWER_CABLE_REQUIRED", `${gpu.public_name} requires an auxiliary power cable.`, "accelerator", gpu)
  }
}

const boot: Validator = (context) => {
  for (const device of context.byType.boot_storage || []) {
    const value = specs(device)
    const quantity = number(device.quantity, 1)
    if (value.raid1_required && quantity !== 2) fail(context, "BOOT_RAID1_PAIR_REQUIRED", `${device.public_name} requires exactly two devices for RAID1.`, "boot_storage", device)
    if (!declaredCompatible(value.slot_type, context.data.model?.boot_storage_slot_types)) fail(context, "BOOT_SLOT_UNSUPPORTED", `${device.public_name} requires an unsupported boot-storage slot.`, "boot_storage", device)
    for (const conflictId of array<string>(device.conflicts_json?.component_ids || value.conflicts_with)) if (context.selectedComponents.some((item) => item.id === conflictId)) fail(context, "BOOT_STORAGE_CONFLICT", `${device.public_name} conflicts with ${conflictId}.`, "boot_storage", device)
  }
}

const power: Validator = (context) => {
  const psus = context.byType.psu || []
  const capacity = psus.reduce((sum, item) => sum + number(specs(item).wattage) * number(item.quantity, 1), 0)
  const redundancy = text(context.data.model?.psu_redundancy).includes("n+1") || Boolean(context.data.model?.require_redundant_psu)
  const usable = redundancy && psus.length > 1 ? capacity - Math.max(...psus.map((item) => number(specs(item).wattage))) : capacity
  if (psus.length && number(context.facts.total_estimated_power) > usable) fail(context, "POWER_BUDGET_EXCEEDED", `Estimated load ${context.facts.total_estimated_power} W exceeds usable PSU capacity ${usable} W.`, "power")
  context.effective.power_capacity_watts = usable
  context.effective.power_required_watts = context.facts.total_estimated_power
}

const cooling: Validator = (context) => {
  const coolingCapacity = (context.byType.cooling || []).reduce((sum, item) => sum + number(specs(item).max_tdp ?? specs(item).cooling_watts) * number(item.quantity, 1), 0)
  const platformCapacity = number(context.data.model?.cooling_capacity_watts, Number.MAX_SAFE_INTEGER)
  const effective = coolingCapacity || platformCapacity
  if (number(context.facts.cpu_tdp_total) > effective) fail(context, "COOLING_CAPACITY_EXCEEDED", `CPU TDP ${context.facts.cpu_tdp_total} W exceeds cooling capacity ${effective} W.`, "cooling")
  context.effective.cooling_capacity_watts = effective
}

export const VALIDATOR_REGISTRY: Record<string, Validator> = {
  cpu,
  memory,
  ram: memory,
  storage,
  drive: storage,
  raid,
  hba: raid,
  expansion,
  riser: expansion,
  network,
  nic: network,
  accelerator,
  gpu: accelerator,
  boot_storage: boot,
  boot,
  power,
  psu: power,
  cooling,
}

const DEFAULT_VALIDATORS = ["cpu", "memory", "storage", "raid", "expansion", "network", "accelerator", "boot_storage", "power", "cooling"]

const VERSIONED_VALIDATOR_ALIASES: Record<string, string> = {
  accelerator: "accelerator",
  backplane: "storage",
  boot_storage: "boot_storage",
  cable: "expansion",
  cooling: "cooling",
  cpu: "cpu",
  drive: "storage",
  drive_cage: "storage",
  nic: "network",
  psu: "power",
  raid: "raid",
  rails: "expansion",
  ram: "memory",
  riser: "expansion",
}

export function resolveValidatorKey(key: string) {
  if (VALIDATOR_REGISTRY[key]) return key
  const normalized = String(key).replace(/^component\./, "").replace(/\.v\d+$/, "")
  return VERSIONED_VALIDATOR_ALIASES[normalized] || normalized
}

export function runValidators(context: ValidatorContext) {
  const configured = (context.data.component_type_definitions || [])
    .filter((definition: any) => definition.enabled !== false && definition.compatibility_mode === "validated")
    .map((definition: any) => definition.validator_key)
    .filter(Boolean)
  const keys = unique(configured.length ? configured : DEFAULT_VALIDATORS)
  for (const key of keys) {
    const resolvedKey = resolveValidatorKey(key)
    const validator = VALIDATOR_REGISTRY[resolvedKey]
    if (!validator) {
      context.addIssue(makeIssue("VALIDATOR_KEY_UNKNOWN", `Validator key ${key} is not registered.`, "registry", "blocker", { path: key }))
      continue
    }
    const before = context.addTrace
    validator(context)
    void before
    context.addTrace({ phase: "validator", validator: resolvedKey, result: "applied", reason_code: "VALIDATOR_EXECUTED", message: `Executed deterministic validator ${key} as ${resolvedKey}.` })
  }
}
