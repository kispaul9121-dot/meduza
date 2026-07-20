const applicabilityKeys = {
  brand: "brands",
  generation: "generations",
  family: "families",
  server_model: "server_model_slugs",
  chassis_type: "chassis_types",
} as const

function list(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function text(value: unknown) {
  return String(value || "").trim()
}

export function packSlug(name: string) {
  return text(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function omitSystem(row: Record<string, unknown>) {
  const { id, created_at, updated_at, deleted_at, ...copy } = row
  return copy
}

export function targetApplicability(input: { target_scope: string; target_values?: string[] }) {
  if (input.target_scope === "global") return {}
  const key = applicabilityKeys[input.target_scope as keyof typeof applicabilityKeys]
  return key ? { [key]: list(input.target_values) } : {}
}

export function matchingModels(models: any[], input: { target_scope: string; target_values?: string[] }) {
  const values = new Set(list(input.target_values))
  if (input.target_scope === "global" || !values.size) return models
  return models.filter((model) => {
    if (input.target_scope === "brand") return values.has(model.brand)
    if (input.target_scope === "generation") return values.has(model.generation)
    if (input.target_scope === "family") return values.has(model.family)
    if (input.target_scope === "server_model") return values.has(model.slug)
    if (input.target_scope === "chassis_type") return values.has(model.chassis_type)
    return false
  })
}

export function mergeApplicability(component: any, pack: any, input: any) {
  const specs = component.specs_json || {}
  const current = specs.applicability || {}
  const target = targetApplicability(input)
  const mode = input.mode || "merge"
  const next = mode === "replace" ? {} : { ...current }
  const added_values: Record<string, string[]> = {}

  Object.entries(target).forEach(([key, values]) => {
    const currentValues = mode === "replace" ? [] : list(current[key])
    const merged = Array.from(new Set([...currentValues, ...list(values)]))
    added_values[key] = merged.filter((value) => !currentValues.includes(value))
    next[key] = merged
  })

  return {
    ...specs,
    applicability: next,
    pack_applications: {
      ...(specs.pack_applications || {}),
      [pack.id]: {
        pack_id: pack.id,
        pack_name: pack.name,
        applied_at: new Date().toISOString(),
        target_scope: input.target_scope,
        target_values: list(input.target_values),
        mode,
        added_values,
      },
    },
  }
}

export function detachApplicability(component: any, packId: string) {
  const specs = component.specs_json || {}
  const applications = { ...(specs.pack_applications || {}) }
  const trace = applications[packId]
  const applicability = { ...(specs.applicability || {}) }

  Object.entries(trace?.added_values || {}).forEach(([key, values]) => {
    const remove = new Set(list(values))
    applicability[key] = list(applicability[key]).filter((value) => !remove.has(value))
  })

  delete applications[packId]
  return { ...specs, applicability, pack_applications: applications }
}

export function componentMatchesFilters(component: any, filters: Record<string, unknown> = {}) {
  return Object.entries(filters).every(([key, value]) => {
    if (value === undefined || value === "" || value === null) return true
    const specs = component.specs_json || {}
    if (["type", "brand", "enabled"].includes(key)) return String(component[key]) === String(value)
    if (key === "q" || key === "model_text") {
      return [component.public_name, component.short_name, component.model, component.part_number]
        .filter(Boolean).join(" ").toLowerCase().includes(text(value).toLowerCase())
    }
    const candidate = specs[key] ?? specs.raw_source?.[key]
    if (Array.isArray(value)) return value.map(String).includes(String(candidate))
    if (key.endsWith("_min")) return Number(specs[key.replace(/_min$/, "")]) >= Number(value)
    if (key.endsWith("_max")) return Number(specs[key.replace(/_max$/, "")]) <= Number(value)
    return String(candidate || "").toLowerCase() === text(value).toLowerCase()
  })
}

export function detectConflicts(pack: any, components: any[], models: any[]) {
  const rows: any[] = []
  const modelBrands = new Set(models.map((model) => String(model.brand).toLowerCase()))
  const nvmeTargets = models.some((model) => list(model.supported_drive_interfaces).includes("NVMe"))

  components.forEach((component) => {
    const specs = component.specs_json || {}
    const body = [component.brand, component.public_name, component.short_name, component.model, specs.slot_type, specs.vendor_platform]
      .filter(Boolean).join(" ").toLowerCase()
    if (pack.component_type && component.type !== pack.component_type) rows.push({ level: "error", component_id: component.id, message: "Component type differs from pack type." })
    if ((body.includes("hpe") || body.includes("flexiblelom")) && modelBrands.has("dell")) rows.push({ level: "warning", component_id: component.id, message: "HPE/FlexibleLOM component is being previewed for Dell scope." })
    if ((body.includes("dell") || body.includes("ndc")) && modelBrands.has("hpe")) rows.push({ level: "warning", component_id: component.id, message: "Dell/NDC component is being previewed for HPE scope." })
    if (component.type === "drive" && body.includes("nvme") && !nvmeTargets) rows.push({ level: "warning", component_id: component.id, message: "NVMe component target has no NVMe chassis support." })
    if (component.type === "cpu" && specs.socket && specs.socket !== "FCLGA3647") rows.push({ level: "error", component_id: component.id, message: "CPU socket is not FCLGA3647." })
    if (component.type === "cpu" && specs.xeon_scalable_generation && !["1st", "2nd"].includes(specs.xeon_scalable_generation)) rows.push({ level: "error", component_id: component.id, message: "CPU is not Xeon Scalable 1st/2nd Gen." })
    if (component.type === "cpu" && Number(specs.tdp_w || specs.tdp || 0) > 205) rows.push({ level: "warning", component_id: component.id, message: "CPU TDP exceeds common DL360 Gen10 high-TDP ceiling." })
  })

  return rows
}
