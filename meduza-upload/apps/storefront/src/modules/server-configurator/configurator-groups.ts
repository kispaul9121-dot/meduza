import { ComponentOption } from "@lib/server-configurator/data"

export type OptionFilter = {
  id: string
  label: string
  disabled?: boolean
}

export const configuratorGroups = [
  { label: "Drive Bay / Media Bay", key: "drive_bay", annotationType: "backplane" },
  { label: "Processor", key: "cpu", annotationType: "cpu" },
  { label: "Система охлаждения", key: "cooling", annotationType: "cooling" },
  { label: "Memory", key: "ram", annotationType: "ram" },
  { label: "Storage", key: "drive", annotationType: "drive" },
  { label: "RAID Controller", key: "raid", annotationType: "raid" },
  { label: "Network", key: "nic", annotationType: "nic" },
  { label: "Power Supply", key: "psu", annotationType: "psu" },
  { label: "Rails", key: "rails", annotationType: "rails" },
  { label: "Risers", key: "riser", annotationType: "riser" },
  { label: "Cable Kits", key: "cable", annotationType: "cable" },
  { label: "Services / Assembly", key: "service", annotationType: "service" },
]

export function optionText(option: ComponentOption) {
  const specs = option.specs_json || {}
  return [
    option.public_name,
    option.brand,
    option.model,
    specs.model,
    specs.memoryType,
    specs.type,
    specs.interface,
    specs.protocol,
    specs.driveType,
    specs.slot_type,
    specs.slotType,
    specs.connector,
    specs.cache,
    specs.cacheGB,
    specs.raidLevels?.join?.(" "),
    specs.efficiency,
    specs.efficiencyRating,
    specs.input_type,
    specs.inputType,
  ].filter(Boolean).join(" ").toLowerCase()
}

export function optionMemorySpeed(option?: ComponentOption) {
  if (!option) return null
  const specs = option.specs_json || {}
  const numericSpeed = Number(specs.speed ?? specs.speedMTs ?? specs.max_memory_speed ?? specs.maxMemorySpeedMTs)
  if (Number.isFinite(numericSpeed) && numericSpeed > 0) return numericSpeed
  const match = optionText(option).match(/ddr[45][-\s]?(\d{4})|(\d{4})\s*mt\/?s/i)
  const speed = Number(match?.[1] || match?.[2])
  return Number.isFinite(speed) && speed > 0 ? speed : null
}

export function optionCpuGeneration(option: ComponentOption) {
  const specs = option.specs_json || {}
  const text = [specs.model, option.model, option.public_name].filter(Boolean).join(" ")
  const model = text.match(/\b(?:bronze|silver|gold|platinum)?\s*(3[12]\d{2}|4[12]\d{2}R?|5[12]\d{2}R?|6[12]\d{2}R?|8[12]\d{2}[A-Z]?)\b/i)?.[1]?.toUpperCase()
  if (!model) return ""
  if (/^[34568]1/.test(model)) return "1st"
  if (/^[34568]2/.test(model)) return "2nd"
  return ""
}

export function optionStorageInterface(option: ComponentOption) {
  const text = optionText(option)
  if (text.includes("nvme")) return "nvme"
  if (text.includes("sas")) return "sas"
  if (text.includes("sata")) return "sata"
  return ""
}

export function optionDriveKind(option: ComponentOption) {
  const text = optionText(option)
  if (text.includes("hdd") || text.includes("7.2k") || text.includes("10k") || text.includes("15k")) return "hdd"
  if (text.includes("ssd") || text.includes("nvme") || text.includes("m.2")) return "ssd"
  return ""
}

export function optionNetworkSlot(option: ComponentOption) {
  const text = optionText(option)
  if (text.includes("embedded") || text.includes("встро") || text.includes("rndc") || /\bndc\b/.test(text) || text.includes("network daughter")) return "embedded"
  if (text.includes("flexiblelom") || text.includes("flexible lom") || text.includes("flr")) return "flexlom"
  if (text.includes("ocp")) return "ocp"
  if (text.includes("pcie") || text.includes("pci-e")) return "pcie"
  return ""
}

export function optionRaidControllerKind(option: ComponentOption) {
  const text = optionText(option)
  if (text.includes("smart array") || text.includes("p408") || text.includes("p816")) return "smart-array"
  if (text.includes("megaraid") || text.includes("broadcom") || text.includes("lsi")) return "megaraid"
  if (text.includes("hba") || text.includes("software") || text.includes("sata controller")) return "hba"
  return ""
}

export function optionRaidCache(option: ComponentOption) {
  const text = optionText(option)
  if (text.includes("bbu") || text.includes("battery") || text.includes("flash backup")) return "bbu"
  if (/\b(?:2|4|8)\s*gb\s*cache\b/i.test(text) || text.includes("cache")) return "cache"
  return "none"
}

export function optionPsuWattage(option: ComponentOption) {
  const specs = option.specs_json || {}
  const wattage = Number(specs.wattage)
  if (Number.isFinite(wattage) && wattage > 0) return wattage
  const match = optionText(option).match(/\b(500|800|1100|1600)\s*w\b/i)
  const parsed = Number(match?.[1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function optionPsuEfficiency(option: ComponentOption) {
  const text = optionText(option)
  if (text.includes("titanium")) return "Titanium"
  if (text.includes("platinum")) return "Platinum"
  return ""
}

function optionPsuInput(option: ComponentOption) {
  const specs = option.specs_json || {}
  const value = String(specs.input_type || specs.inputType || "").trim()
  if (value) return value
  const text = optionText(option)
  if (text.includes("48vdc") || text.includes("-48vdc")) return "DC"
  if (text.includes("universal")) return "Universal"
  return "AC"
}

function optionDisplayKey(option: ComponentOption, key: string) {
  const specs = option.specs_json || {}
  if (key === "cooling") {
    const text = optionText(option)
    return text.includes("performance") || text.includes("high")
      ? "performance-cooling-bundle"
      : "standard-cooling-bundle"
  }
  if (key === "ram") {
    return [
      specs.capacity_gb,
      specs.type,
      optionMemorySpeed(option),
    ].filter(Boolean).join("|") || option.public_name.toLowerCase()
  }
  if (key === "psu") {
    return String(optionPsuWattage(option) || option.id)
  }
  if (key === "raid") {
    return [
      optionRaidControllerKind(option) || option.brand,
      optionStorageInterface(option) || option.specs_json?.interface || "sas/sata",
      optionRaidCache(option),
      option.price,
    ].filter(Boolean).join("|").toLowerCase()
  }
  return option.id
}

function dedupeOptions(options: ComponentOption[], key: string) {
  if (!["cooling", "raid", "ram", "psu"].includes(key)) return options
  const seen = new Set<string>()
  return options.filter((option) => {
    const displayKey = optionDisplayKey(option, key)
    if (seen.has(displayKey)) return false
    seen.add(displayKey)
    return true
  })
}

function simplifyPsuOptions(options: ComponentOption[]) {
  const visible = options.filter((option) => {
    const text = optionText(option)
    const wattage = optionPsuWattage(option)
    if (!wattage || ![500, 800, 1600].includes(wattage)) return false
    if (/^\s*2\s*[x×]/i.test(option.public_name) || /^\s*2\s*[x×]/i.test(option.model)) return false
    if (text.includes("1100w")) return false
    if (text.includes("48vdc") || text.includes("-48vdc") || text.includes("universal")) return false
    return true
  })
  const source = visible.length ? visible : options.filter((option) => !/^\s*2\s*[x×]/i.test(option.public_name))
  return [500, 800, 1600]
    .map((wattage) => {
      const variants = source.filter((option) => optionPsuWattage(option) === wattage)
      return variants.sort((a, b) => Number(b.price > 0) - Number(a.price > 0))[0]
    })
    .filter(Boolean) as ComponentOption[]
}

export function groupOptions(options: ComponentOption[], key: string) {
  let result: ComponentOption[]
  if (key === "drive_bay") {
    result = options
      .filter((option) => option.type === "backplane")
      .sort((a, b) => Number(Boolean(a.specs_json?.media_bay)) - Number(Boolean(b.specs_json?.media_bay)))
  } else if (key === "psu") {
    result = simplifyPsuOptions(options.filter((option) => option.type === key))
  } else {
    result = options.filter((option) => option.type === key)
  }
  return dedupeOptions(result, key)
}

export function filterControls(key: string, options: ComponentOption[]): OptionFilter[] {
  if (key === "cpu") {
    const generations = new Set<string>(options.map(optionCpuGeneration).filter(Boolean))
    return ["1st", "2nd"].map((generation: string) => ({
      id: `generation:${generation}`,
      label: generation === "1st" ? "Xeon Scalable 1st Gen" : "Xeon Scalable 2nd Gen",
      disabled: !generations.has(generation),
    }))
  }
  if (key === "ram") {
    const speeds = new Set(options.map(optionMemorySpeed).filter(Boolean) as number[])
    return [2133, 2400, 2666, 2933].map((speed) => ({
      id: `memory:${speed}`,
      label: `${speed} MT/s`,
      disabled: !speeds.has(speed),
    }))
  }
  if (key === "nic") {
    return [
      { id: "network:embedded", label: "Embedded", disabled: !options.some((option) => optionNetworkSlot(option) === "embedded") },
      { id: "network:flexlom", label: "FlexibleLOM", disabled: !options.some((option) => optionNetworkSlot(option) === "flexlom") },
      { id: "network:ocp", label: "OCP", disabled: !options.some((option) => optionNetworkSlot(option) === "ocp") },
      { id: "network:pcie", label: "PCIe", disabled: !options.some((option) => optionNetworkSlot(option) === "pcie") },
    ]
  }
  return []
}

export function filterOptions(key: string, options: ComponentOption[], filterId: string, cpu?: ComponentOption) {
  const cpuMemoryLimit = optionMemorySpeed(cpu)
  let filtered = key === "ram" && cpuMemoryLimit
    ? options.filter((option) => {
      const speed = optionMemorySpeed(option)
      return !speed || speed <= cpuMemoryLimit
    })
    : options

  if (!filterId || filterId === "all") return filtered
  const [, value] = filterId.split(":")
  if (key === "cpu") filtered = filtered.filter((option) => optionCpuGeneration(option) === value)
  if (key === "ram") filtered = filtered.filter((option) => optionMemorySpeed(option) === Number(value))
  if (key === "nic") filtered = filtered.filter((option) => optionNetworkSlot(option) === value)
  return filtered
}

export function filterDriveOptions(options: ComponentOption[], filters: { kind: string; interface: string }) {
  return options.filter((option) => {
    const kindMatch = filters.kind === "all" || optionDriveKind(option) === filters.kind
    const interfaceMatch = filters.interface === "all" || optionStorageInterface(option) === filters.interface
    return kindMatch && interfaceMatch
  })
}

export function filterRaidOptions(options: ComponentOption[], filters: { kind: string; cache: string; interface: string }) {
  return options.filter((option) => {
    const kindMatch = filters.kind === "all" || optionRaidControllerKind(option) === filters.kind
    const cacheMatch = filters.cache === "all" || optionRaidCache(option) === filters.cache
    const interfaceValue = optionStorageInterface(option) || "sas"
    const interfaceMatch = filters.interface === "all" || interfaceValue === filters.interface
    return kindMatch && cacheMatch && interfaceMatch
  })
}

function cleanRaidName(option: ComponentOption) {
  return option.public_name
    .replace(/\s+placeholder\b/gi, "")
    .trim()
}

function cleanPsuName(option: ComponentOption) {
  const wattage = optionPsuWattage(option)
  const efficiency = optionPsuEfficiency(option)
  const input = optionPsuInput(option)
  const highLine = option.specs_json?.requires_high_line || option.specs_json?.requiresHighLine
  const base = [`${wattage || ""}W`, "Flex Slot", efficiency, "Hot Plug PSU"].filter(Boolean).join(" ")
  return [base, input && input !== "AC" ? input : "", highLine ? "high-line" : ""].filter(Boolean).join(" · ")
}

export function optionLine(option: ComponentOption) {
  const specs = option.specs_json || {}
  if (option.type === "cpu") return `${option.public_name} · ${specs.cores}C/${specs.threads}T · ${specs.base_clock} · ${specs.tdp}W`
  if (option.type === "nic") return option.public_name
  if (option.type === "raid") {
    const interfaceLabel = specs.interface || optionStorageInterface(option).toUpperCase() || "SAS/SATA"
    const cache = optionRaidCache(option)
    const cacheLabel = cache === "bbu" ? "cache + BBU" : cache === "cache" ? "cache" : "no cache"
    return `${cleanRaidName(option)} · ${interfaceLabel} · ${cacheLabel}`
  }
  if (option.type === "psu") return cleanPsuName(option)
  if (option.type === "backplane" && specs.media_bay) return `${option.public_name} · ${specs.interfaces?.join?.("/") || specs.interface || "front option"}`
  if (option.type === "backplane") return `${option.public_name} · ${specs.interfaces?.join?.("/") || specs.interface || "storage path"}`
  if (option.type === "riser") return `${option.public_name} · ${specs.required_riser_type || specs.accessory_type || "PCIe"}`
  if (option.type === "cable") return `${option.public_name} · ${specs.connectorType || specs.interface || "cable kit"}`
  if (option.type === "cooling") {
    const text = optionText(option)
    const tier = text.includes("performance") || text.includes("high") ? "Performance" : "Standard"
    return `${tier} cooling bundle · fan kit + heatsink`
  }
  return option.public_name
}
