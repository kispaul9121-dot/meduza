import { sourceReference } from "./read-source"
import { sourceFiles, validRuleCategories } from "./source-files"
import { ComponentInput } from "./types"

export function cleanText(value: unknown) {
  return String(value ?? "").trim()
}

export function slugText(value: unknown) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "")
}

export function compactName(value: unknown, max = 54) {
  const text = cleanText(value).replace(/\s+/g, " ")
  return text.length <= max ? text : text.slice(0, max - 3).trimEnd() + "..."
}

export function numberOrZero(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function extractPartNumber(row: Record<string, unknown>) {
  return cleanText(row.partNumber || row.vendorPartNumber || row.optionPartNumber || row.sku) || null
}

export function inferBrand(row: Record<string, unknown>) {
  const explicit = cleanText(row.brand || row.manufacturer || row.vendor || row.producer)
  if (explicit) return explicit

  const name = cleanText(row.name || row.title || row.public_name)
  for (const brand of ["HPE", "Intel", "AMD", "Dell", "Broadcom", "NVIDIA", "Samsung", "Micron", "Seagate", "Generic"]) {
    if (name.toLowerCase().startsWith(brand.toLowerCase())) return brand
  }
  return "Generic"
}

export function inferDriveInterface(value: unknown) {
  const text = cleanText(value).toLowerCase()
  if (text.includes("nvme") || text.includes("u.2")) return "NVMe"
  if (text.includes("sas")) return "SAS"
  if (text.includes("sata")) return "SATA"
  return "SATA"
}

export function inferDriveFormFactor(value: unknown) {
  const text = cleanText(value).toLowerCase()
  if (text.includes("lff") || text.includes("3.5")) return "3.5"
  if (text.includes("m.2")) return "M.2"
  return "2.5"
}

export function inferCapacity(value: unknown) {
  const text = cleanText(value)
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(TB|ТБ|GB|ГБ)/i)
  return match ? `${match[1].replace(",", ".")}${match[2].toUpperCase().replace("ТБ", "TB").replace("ГБ", "GB")}` : undefined
}

export function groupToComponentType(groupId: string) {
  const map: Record<string, string | null> = {
    cpu: "cpu",
    ram: "ram",
    storage: "drive",
    raid: "raid",
    driveType: "backplane",
    rails: "rails",
    psu: "psu",
    network: "nic",
    management: "license",
    service: "service",
    trays: null,
  }
  return map[groupId] ?? null
}

export function productTypeToComponentType(productType: string) {
  const map: Record<string, string | null> = {
    cpu: "cpu",
    ram: "ram",
    raid: "raid",
    ssd: "drive",
    hdd: "drive",
    nvme: "drive",
    "network-card": "nic",
    psu: "psu",
    rails: "rails",
    cooling: "cooling",
    "interface-cable": "cable",
    backplane: "backplane",
    riser: "riser",
    service: "service",
  }
  return map[productType] ?? null
}

export function componentKey(component: Pick<ComponentInput, "type" | "part_number" | "public_name" | "model">) {
  const part = cleanText(component.part_number)
  if (part) return `${component.type}:part:${part.toLowerCase()}`
  return `${component.type}:name:${slugText(component.public_name || component.model)}`
}

export function ruleCategory(category: unknown) {
  const raw = cleanText(category).toLowerCase()
  const map: Record<string, string | null> = {
    cpu: "cpu",
    ram: "ram",
    memory: "ram",
    storage: "storage",
    nvme: "storage",
    "media-bay": "storage",
    raid: "raid",
    nic: "nic",
    network: "nic",
    pcie: "riser",
    psu: "psu",
    cooling: "cooling",
    backplane: "backplane",
    gpu: null,
  }
  const mapped = map[raw] ?? raw
  return mapped && validRuleCategories.has(mapped) ? mapped : null
}

export function ruleType(rule: Record<string, unknown>) {
  const action = cleanText(rule.action).toLowerCase()
  const type = cleanText(rule.ruleType).toLowerCase()
  if (action === "block" || type === "excludes") return "block"
  if (action === "require" || type === "requires") return "require"
  if (type === "limits") return "limit"
  if (action === "warning" || action === "recommend" || type === "recommend") return "warning"
  return "warning"
}

export function buildSpecs(
  sourceFile: string,
  sourceId: string,
  row: Record<string, unknown>,
  extra: Record<string, unknown> = {}
) {
  const sourcePrice = row.price ?? row.basePrice
  return {
    ...extra,
    source: "pauloud 2",
    source_file: sourceFile,
    source_id: sourceId,
    source_doc_reference: sourceReference(sourceFile),
    source_price: sourcePrice === undefined ? undefined : sourcePrice,
    source_price_currency: sourcePrice === undefined ? undefined : "RUB",
    original_id: row.id || row.slug || row.ruleId || sourceId,
    original_category: row.category || row.productType || row.group || extra.source_group,
    warnings: row.warnings || row.warning,
    notes: row.notes || row.note || row.summary || row.description,
    applicability_hints: row.applicability || row.compatibility || row.dl360CompatibilityStatus || row.requires || row.conflicts,
    quantity_limits: {
      min: row.minQuantity,
      max: row.maxQuantity,
    },
    ui_state: row.uiState || row.defaultSelected || row.disabled || row.hidden,
    note: row.note || row.summary || row.description,
    min_quantity: row.minQuantity,
    max_quantity: row.maxQuantity,
    unit: row.unit,
    raw_tags: row.tags,
    raw_specs: row.specs,
    raw_source: row,
  }
}

export function sourceFileLabel(key: keyof typeof sourceFiles) {
  return sourceFiles[key]
}
