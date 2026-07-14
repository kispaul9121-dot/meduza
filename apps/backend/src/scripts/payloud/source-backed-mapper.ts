import { report } from "./report"
import { sourceFiles } from "./source-files"
import { ComponentInput } from "./types"
import { buildSpecs, cleanText, compactName, extractPartNumber, inferBrand } from "./utils"

export function normalizeNicDefinition(row: Record<string, unknown>) {
  const name = cleanText(row.name)
  return baseComponent("nic", inferBrand(row), cleanText(row.chipset || name), extractPartNumber(row), name, buildSpecs(sourceFiles.dl360Nics, cleanText(row.slug || name), row, {
    ports: row.ports,
    speed: row.speedGbps ? `${row.speedGbps}GbE` : undefined,
    speed_gbps: row.speedGbps,
    connector: row.connector,
    interface: row.interfaceType,
    slot_type: row.interfaceType,
    height: row.height,
    requires: row.requires,
    warnings: row.warnings,
    compatibility_status: row.dl360CompatibilityStatus,
    source_line: row.sourceLine,
  }))
}

export function normalizeExpansionOption(row: Record<string, unknown>) {
  const name = cleanText(row.name)
  const interfaces = Array.isArray(row.supportedInterfaces) ? row.supportedInterfaces : []
  const formFactors = Array.isArray(row.supportedFormFactors) ? row.supportedFormFactors : []
  return baseComponent("backplane", "HPE", name, cleanText(row.partNumber) || null, name, buildSpecs(sourceFiles.dl360Expansion, cleanText(row.slug || name), row, {
    media_bay: true,
    normalized_type: row.normalizedType,
    location: row.location,
    interface: interfaces[0] ?? null,
    interfaces,
    form_factor: formFactors.includes("SFF") ? "2.5" : formFactors[0],
    provides: row.provides,
    requires: row.requires,
    conflicts: row.conflicts,
    adds_storage_bays: row.addsStorageBays,
    added_bay_count: row.addedBayCount,
  }))
}

export function normalizePsu(row: Record<string, unknown>) {
  const name = cleanText(row.name)
  return baseComponent("psu", "HPE", name, cleanText(row.sku) || null, name, buildSpecs(sourceFiles.dl360PsuCooling, cleanText(row.slug || name), row, {
    wattage: row.wattage,
    efficiency: row.efficiencyRating,
    input_type: row.inputType,
    requires_high_line: row.requiresHighLine,
    source_page: row.sourcePage,
    source_line: row.sourceLine,
  }))
}

export function normalizeCooling(row: Record<string, unknown>) {
  const name = cleanText(row.name)
  return baseComponent("cooling", "HPE", name, cleanText(row.sku) || null, name, buildSpecs(sourceFiles.dl360PsuCooling, cleanText(row.slug || name), row, {
    cooling_type: row.coolingType,
    includes_fans: row.includesFans,
    source_page: row.sourcePage,
    source_line: row.sourceLine,
  }))
}

export function normalizeRiserAccessory(row: Record<string, unknown>) {
  if (row.componentType !== "riser") {
    report.skipped.push({ source: sourceFiles.dl360Gpu, item: cleanText(row.name), reason: "GPU accessory is not a current Medusa component type" })
    report.components.skipped += 1
    return null
  }

  const name = cleanText(row.name)
  return baseComponent("riser", "HPE", name, cleanText(row.sku) || null, name, buildSpecs(sourceFiles.dl360Gpu, cleanText(row.slug || name), row, {
    accessory_type: row.accessoryType,
    required_riser_type: row.requiredRiserType,
    provides: row.provides,
    source_page: row.sourcePage,
    source_line: row.sourceLine,
  }))
}

function baseComponent(
  type: string,
  brand: string,
  model: string,
  partNumber: string | null,
  publicName: string,
  specs: Record<string, unknown>
) {
  return {
    type,
    brand,
    model,
    part_number: partNumber,
    public_name: publicName,
    short_name: compactName(publicName),
    specs_json: specs,
    price: 0,
    cost: 0,
    stock_qty: 0,
    enabled: true,
  } satisfies ComponentInput
}
