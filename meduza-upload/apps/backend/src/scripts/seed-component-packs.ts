import { MedusaContainer } from "@medusajs/framework"
import { SERVER_CONFIGURATOR_MODULE } from "../modules/server-configurator"

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function text(value: unknown) {
  return String(value || "").toLowerCase()
}

function matches(component: any, spec: any) {
  const specs = component.specs_json || {}
  const body = [component.brand, component.model, component.public_name, component.short_name, JSON.stringify(specs)].join(" ").toLowerCase()
  if (spec.type && component.type !== spec.type) return false
  if (spec.brand && !text(component.brand).includes(text(spec.brand))) return false
  if (spec.any && !spec.any.some((item: string) => body.includes(text(item)))) return false
  if (spec.generation && specs.xeon_scalable_generation !== spec.generation) return false
  return true
}

async function upsertPack(service: any, name: string, componentType: string, components: any[], scopes: any = {}) {
  const input = {
    name,
    slug: slug(name),
    description: "Sample pack generated from existing server-configurator DB components.",
    component_type: componentType,
    brand_scope: scopes.brand_scope || [],
    family_scope: scopes.family_scope || [],
    generation_scope: scopes.generation_scope || [],
    chassis_scope: scopes.chassis_scope || [],
    tags_json: scopes.tags_json || ["sample"],
    applicability_template_json: scopes.applicability_template_json || {},
    enabled: true,
    source_doc_reference: "seed-component-packs.ts",
  }
  const [current] = await service.listComponentPacks({ slug: input.slug })
  const pack = current
    ? await service.updateComponentPacks({ id: current.id, ...input })
    : await service.createComponentPacks(input)
  const existing = await service.listComponentPackItems({ component_pack_id: pack.id }, { take: 10000 })
  const existingIds = new Set(existing.map((item: any) => item.component_id))
  let added = 0
  for (const component of components) {
    if (existingIds.has(component.id)) continue
    await service.createComponentPackItems({
      component_pack_id: pack.id,
      component_id: component.id,
      sort_order: added + 100,
      enabled: true,
      note: null,
    })
    added += 1
  }
  return { name, total: existing.length + added, added }
}

export default async function seedComponentPacks({ container }: { container: MedusaContainer }) {
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const components = await service.listComponents({}, { take: 10000 })
  const specs = [
    ["Intel Xeon Scalable 1st Gen", "cpu", { type: "cpu", brand: "Intel", generation: "1st" }],
    ["Intel Xeon Scalable 2nd Gen", "cpu", { type: "cpu", brand: "Intel", generation: "2nd" }],
    ["Intel Xeon Scalable 1st/2nd Gen for HPE Gen10", "cpu", { type: "cpu", brand: "Intel", any: ["xeon scalable"] }, { brand_scope: ["HPE"], family_scope: ["ProLiant DL360"], generation_scope: ["Gen10"] }],
    ["DDR4 RDIMM ECC", "ram", { type: "ram", any: ["ddr4", "rdimm", "ecc"] }],
    ["HPE Smart Array Gen10", "raid", { type: "raid", brand: "HPE", any: ["smart array"] }],
    ["Intel/Broadcom PCIe NIC", "nic", { type: "nic", any: ["intel", "broadcom", "pcie"] }],
    ["HPE FlexibleLOM NIC", "nic", { type: "nic", any: ["flexiblelom", "flr"] }, { brand_scope: ["HPE"] }],
    ["2.5 SAS/SATA Drives", "drive", { type: "drive", any: ["2.5", "sas", "sata"] }],
    ["2.5 NVMe U.2 Drives", "drive", { type: "drive", any: ["2.5", "nvme"] }],
    ["3.5 LFF Drives", "drive", { type: "drive", any: ["3.5", "lff"] }],
    ["HPE DL360 Gen10 Media Bay Options", "backplane", { type: "backplane", any: ["media_bay", "media bay"] }, { brand_scope: ["HPE"], family_scope: ["ProLiant DL360"], generation_scope: ["Gen10"] }],
    ["Standard/Performance Cooling", "cooling", { type: "cooling", any: ["cooling", "standard", "performance"] }],
  ] as const
  const result: any[] = []
  for (const [name, type, filter, scopes] of specs) {
    result.push(await upsertPack(service, name, type, components.filter((component: any) => matches(component, filter)), scopes || {}))
  }

  console.log(JSON.stringify({ component_packs: result }, null, 2))
}
