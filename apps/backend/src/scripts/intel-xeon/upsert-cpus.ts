function clean(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

function cpuKey(component: any) {
  return [component.type, component.brand, component.model, component.part_number].map(clean).join(":")
}

export async function upsertCpus(service: any, components: any[]) {
  const existing = await service.listComponents({ type: "cpu", brand: "Intel" }, { take: 10000 })
  const byKey = new Map(existing.map((item: any) => [cpuKey(item), item]))
  const report = { created: 0, updated: 0, unchanged: 0, needs_review: 0, skipped: 0 }
  const imported: any[] = []

  for (const component of components) {
    if (component.specs_json?.socket !== "FCLGA3647") {
      report.skipped += 1
      continue
    }
    if (component.specs_json?.needs_review) report.needs_review += 1
    const current = byKey.get(cpuKey(component)) as any
    if (!current) {
      imported.push(await service.createComponents(component))
      report.created += 1
      continue
    }
    const next = {
      ...component,
      price: Number(current.price || 0) > 0 ? Number(current.price) : component.price,
      cost: Number(current.cost || 0) > 0 ? Number(current.cost) : component.cost,
      stock_qty: Number(current.stock_qty || 0) > 0 ? Number(current.stock_qty) : component.stock_qty,
      specs_json: { ...(current.specs_json || {}), ...(component.specs_json || {}) },
    }
    const changed = JSON.stringify(current.specs_json || {}) !== JSON.stringify(next.specs_json || {}) ||
      current.public_name !== next.public_name ||
      current.short_name !== next.short_name ||
      Boolean(current.enabled) !== Boolean(next.enabled)
    if (!changed) {
      imported.push(current)
      report.unchanged += 1
      continue
    }
    imported.push(await service.updateComponents({ id: current.id, ...next }))
    report.updated += 1
  }

  return { report, imported }
}
