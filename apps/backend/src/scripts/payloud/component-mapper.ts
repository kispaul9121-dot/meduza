import { report } from "./report"
import { sourceFiles, validComponentTypes } from "./source-files"
import { ComponentInput } from "./types"
import {
  buildSpecs,
  cleanText,
  compactName,
  extractPartNumber,
  inferBrand,
  inferCapacity,
  inferDriveFormFactor,
  inferDriveInterface,
  groupToComponentType,
  numberOrZero,
  productTypeToComponentType,
} from "./utils"

export function normalizeGroupComponent(group: Record<string, unknown>, option: Record<string, unknown>) {
  const groupId = cleanText(group.id)
  const type = groupToComponentType(groupId)
  const itemName = cleanText(option.name || option.title)

  if (!type || !validComponentTypes.has(type)) {
    report.skipped.push({ source: sourceFiles.configurator, item: itemName || groupId, reason: `Unsupported group ${groupId}` })
    report.components.skipped += 1
    return null
  }

  const specs: Record<string, unknown> = buildSpecs(sourceFiles.configurator, cleanText(option.id || option.slug || itemName), option, {
    source_group: groupId,
    source_group_title: group.title,
  })

  if (type === "cpu") {
    specs.cores = option.cores
    specs.threads = numberOrZero(option.cores) ? numberOrZero(option.cores) * 2 : undefined
    specs.base_clock = option.baseClockGHz ? `${option.baseClockGHz}GHz` : undefined
    specs.max_turbo = option.maxTurboGHz ? `${option.maxTurboGHz}GHz` : undefined
    specs.tdp = option.tdpWatts
    specs.socket = option.socket
    specs.max_memory_speed = cleanText(option.memoryType).match(/(\d{4})/)?.[1]
      ? Number(cleanText(option.memoryType).match(/(\d{4})/)?.[1])
      : undefined
  }

  if (type === "ram") {
    specs.capacity_gb = option.capacityGB
    specs.type = [option.memoryType, option.moduleType, option.ecc ? "ECC" : ""].filter(Boolean).join(" ")
    specs.speed = option.speedMTs
    specs.ecc = option.ecc
    specs.registered = option.registered
  }

  if (type === "drive") {
    specs.capacity = inferCapacity(itemName)
    specs.interface = inferDriveInterface(itemName)
    specs.form_factor = inferDriveFormFactor(itemName)
  }

  if (type === "nic") {
    const match = itemName.match(/(\d+)x(\d+)GbE\s*([A-Z0-9+]+)?/i)
    specs.ports = match ? Number(match[1]) : undefined
    specs.speed = match ? `${match[2]}GbE` : undefined
    specs.connector = match?.[3]
    specs.slot_type = "PCIe"
  }

  if (type === "psu") {
    specs.wattage = Number(itemName.match(/(\d+)W/i)?.[1] ?? 0) || undefined
  }

  if (type === "backplane") {
    specs.interface = inferDriveInterface(itemName)
    specs.interfaces = itemName.toLowerCase().includes("hybrid") ? ["SAS", "SATA", "NVMe"] : [inferDriveInterface(itemName)]
    specs.form_factor = "2.5"
  }

  return component(type, option, itemName, specs)
}

export function normalizeCatalogComponent(row: Record<string, unknown>, sourceFile: string) {
  const type = productTypeToComponentType(cleanText(row.productType))
  const itemName = cleanText(row.name)

  if (!type || !validComponentTypes.has(type)) {
    report.skipped.push({ source: sourceFile, item: itemName, reason: `Unsupported productType ${row.productType}` })
    report.components.skipped += 1
    return null
  }

  const brand = inferBrand(row)
  const safeForDl360 = brand === "HPE" || brand === "Generic" || type === "cable"
  if (!safeForDl360) {
    report.skipped.push({ source: sourceFile, item: itemName, reason: "Not enabled for DL360 import without source-backed applicability" })
    report.components.skipped += 1
    return null
  }

  const specs: Record<string, unknown> = buildSpecs(sourceFile, cleanText(row.id || row.slug || itemName), row, {
    product_type: row.productType,
    interface: row.interfaceType || row.driveType,
    form_factor: type === "drive" ? inferDriveFormFactor(row.diskFormFactor || itemName) : row.formFactor,
    capacity: row.capacity,
    wattage: row.wattage ? Number(cleanText(row.wattage).match(/(\d+)/)?.[1] ?? 0) : undefined,
  })

  if (type === "drive") {
    specs.interface = inferDriveInterface(row.driveType || row.interfaceType || itemName)
    specs.form_factor = inferDriveFormFactor(row.diskFormFactor || itemName)
  }

  return component(type, row, itemName, specs, brand)
}

function component(
  type: string,
  row: Record<string, unknown>,
  itemName: string,
  specs: Record<string, unknown>,
  brand = inferBrand(row)
) {
  return {
    type,
    brand,
    model: itemName,
    part_number: extractPartNumber(row),
    public_name: itemName,
    short_name: compactName(itemName),
    specs_json: specs,
    price: 0,
    cost: 0,
    stock_qty: 0,
    enabled: true,
  } satisfies ComponentInput
}
