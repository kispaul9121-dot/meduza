import { normalizeGroupAnnotation, normalizeRuleAnnotation, normalizeStorageScenarioAnnotation } from "./annotation-mapper"
import { normalizeCatalogComponent, normalizeGroupComponent } from "./component-mapper"
import { extractConstArray, extractExportedArray, extractReturnedArray } from "./read-source"
import { report } from "./report"
import { normalizeDraftRule } from "./rule-mapper"
import { sourceFiles } from "./source-files"
import {
  normalizeCooling,
  normalizeExpansionOption,
  normalizeNicDefinition,
  normalizePsu,
  normalizeRiserAccessory,
} from "./source-backed-mapper"
import { CompatibilityRuleInput, ComponentInput, HelpAnnotationInput } from "./types"
import { cleanText, componentKey } from "./utils"

const iconStubs = {
  Cpu: null,
  HardDrive: null,
  KeyRound: null,
  Network: null,
  Server: null,
  ShieldCheck: null,
  Sparkles: null,
  Zap: null,
}

export async function collectComponents() {
  const components: ComponentInput[] = []
  const groups = await extractExportedArray<Record<string, unknown>>(sourceFiles.configurator, "configuratorGroups", iconStubs)
  for (const group of groups) {
    const options = Array.isArray(group.options) ? group.options as Record<string, unknown>[] : []
    for (const option of options) {
      report.components.found += 1
      const component = normalizeGroupComponent(group, option)
      if (component) components.push(component)
    }
  }

  const core = await extractExportedArray<Record<string, unknown>>(sourceFiles.componentsCore, "componentCoreProducts")
  const more = await extractExportedArray<Record<string, unknown>>(sourceFiles.componentsMore, "componentMoreProducts")
  for (const row of [...core, ...more]) {
    report.components.found += 1
    const source = core.includes(row) ? sourceFiles.componentsCore : sourceFiles.componentsMore
    const component = normalizeCatalogComponent(row, source)
    if (component) components.push(component)
  }

  await collectSourceBackedComponents(components)
  return dedupeComponents(components)
}

async function collectSourceBackedComponents(components: ComponentInput[]) {
  const nicContext = {
    pcieVerificationWarning: {
      code: "VERIFY_PCIE_SLOT",
      message: "PCIe lanes, card height, riser and power are not present in the local QuickSpecs extract for this NIC.",
    },
  }
  const nics = await extractReturnedArray<Record<string, unknown>>(sourceFiles.dl360Nics, "buildDL360NicDefinitions", nicContext)
  for (const row of nics) {
    report.components.found += 1
    components.push(normalizeNicDefinition(row))
  }

  const expansions = await extractReturnedArray<Record<string, unknown>>(sourceFiles.dl360Expansion, "buildDL360ExpansionOptionDefinitions")
  for (const row of expansions) {
    report.components.found += 1
    components.push(normalizeExpansionOption(row))
  }

  const psus = await extractReturnedArray<Record<string, unknown>>(sourceFiles.dl360PsuCooling, "buildDL360PsuDefinitions")
  for (const row of psus) {
    report.components.found += 1
    components.push(normalizePsu(row))
  }

  const cooling = await extractReturnedArray<Record<string, unknown>>(sourceFiles.dl360PsuCooling, "buildDL360CoolingDefinitions")
  for (const row of cooling) {
    report.components.found += 1
    components.push(normalizeCooling(row))
  }

  const risers = await extractReturnedArray<Record<string, unknown>>(sourceFiles.dl360Gpu, "buildDL360GpuAccessoryDefinitions")
  for (const row of risers) {
    report.components.found += 1
    const component = normalizeRiserAccessory(row)
    if (component) components.push(component)
  }
}

export async function collectAnnotations() {
  const annotations: HelpAnnotationInput[] = []
  const groups = await extractExportedArray<Record<string, unknown>>(sourceFiles.configurator, "configuratorGroups", iconStubs)
  for (const group of groups) {
    report.annotations.found += 1
    const annotation = normalizeGroupAnnotation(group)
    if (annotation && annotation.body) annotations.push(annotation)
  }

  const scenarios = await extractConstArray<Record<string, unknown>>(sourceFiles.storageScenarios, "CURRENT_SCENARIOS", {
    DL360_MEDIA_BAY_DRIVE_BAY_ID: "10sff-sas-sata-media-bay",
  })
  for (const scenario of scenarios) {
    report.annotations.found += 1
    annotations.push(normalizeStorageScenarioAnnotation(scenario))
  }

  const rules = await collectRawRules()
  for (const rule of rules) {
    report.annotations.found += 1
    const annotation = normalizeRuleAnnotation(rule)
    if (annotation.body) annotations.push(annotation)
  }

  return annotations
}

export async function collectRawRules() {
  return extractReturnedArray<Record<string, unknown>>(sourceFiles.dl360Rules, "buildDL360TestingRules", { ruleSetId: undefined })
}

export async function collectRules() {
  const rules = await collectRawRules()
  const mapped: CompatibilityRuleInput[] = []
  rules.forEach((rule, index) => {
    report.rules.found += 1
    const mappedRule = normalizeDraftRule(rule, index)
    if (mappedRule) mapped.push(mappedRule)
  })
  return mapped
}

export function collectPresets() {
  const presets = [
    ["CPU quantity limits RAM slots", "ram", "CPU population controls usable DIMM slots."],
    ["CPU limits RAM speed", "ram", "Selected CPU memory controller limits effective RAM speed."],
    ["NVMe requires NVMe backplane/media bay", "storage", "NVMe drives require NVMe-capable backplane, media bay, riser, and cable path."],
    ["RAID requires compatible cable/controller path", "raid", "RAID/HBA must match SAS/SATA/NVMe drive path and cable kit."],
    ["Storage scenario requires media bay", "storage", "Front storage scenario can require Media Bay expansion options."],
    ["Backplane limits drive interface", "backplane", "Backplane and chassis limit allowed drive interface and form factor."],
    ["PSU minimum wattage and redundancy", "psu", "PSU wattage, high-line input, and redundancy must match selected load."],
    ["Riser required by NIC/GPU", "riser", "PCIe cards can require specific riser, lane, height, or second CPU path."],
    ["Cooling required by high-risk options", "cooling", "NVMe, 100GbE, or accelerator scenarios can require high-performance cooling review."],
  ]
  report.presets.found = presets.length
  return presets.map(([name, category, description]) => ({
    name,
    category,
    description: `${description} Source: pauloud 2.`,
    conditions_template_json: { draft: true, source: "pauloud 2" },
    action_template_json: { draft: true, source: "pauloud 2" },
    enabled: true,
  }))
}

function dedupeComponents(components: ComponentInput[]) {
  const seen = new Map<string, ComponentInput>()
  for (const component of components) {
    const key = componentKey(component)
    if (seen.has(key)) {
      report.components.duplicates += 1
      report.duplicates.push({ key, source: cleanText(component.specs_json.source_file), item: component.public_name })
      continue
    }
    seen.set(key, component)
  }
  return [...seen.values()]
}
