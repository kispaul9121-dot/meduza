import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { executeComponentCatalog, resolveComponentCategory } from "../../../../modules/server-configurator/component-catalog"
import { loadComponentCatalog } from "../../../../modules/server-configurator/component-catalog-loader"

function values(value: unknown) {
  const source = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return source.flatMap((entry) => String(entry).split(",")).map((entry) => entry.trim()).filter(Boolean)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const loaded = await loadComponentCatalog(service)
  const categoryInput = String(req.query.category || "").trim()
  const category = categoryInput ? resolveComponentCategory(categoryInput) : undefined
  if (categoryInput && !category) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unsupported component category ${categoryInput}`)
  const page = Number(req.query.page || 1)
  const limit = Number(req.query.limit || 24)
  const sort = String(req.query.sort || "name_asc") as "name_asc" | "name_desc" | "brand_asc"
  const q = String(req.query.q || "").trim()
  const errors: string[] = []
  if (!Number.isInteger(page) || page < 1 || page > 100000) errors.push("page must be an integer between 1 and 100000")
  if (!Number.isInteger(limit) || limit < 1 || limit > 48) errors.push("limit must be an integer between 1 and 48")
  if (!["name_asc", "name_desc", "brand_asc"].includes(sort)) errors.push(`Unsupported component sort ${sort}`)
  if (q.length > 120) errors.push("q must be at most 120 characters")
  const eligibleItems = category ? loaded.items.filter((item) => item.category_keys.includes(category.key)) : loaded.items
  const definitions = loaded.definitions.filter((definition: any) =>
    definition.filterable && eligibleItems.some((item) => item.attributes.some((attribute) => attribute.key === definition.key)),
  )
  const definitionMap = new Map(definitions.map((definition: any) => [`attr.${definition.key}`, definition]))
  const attributes: Record<string, string[]> = {}
  const ranges: Record<string, { min?: number; max?: number }> = {}
  const texts: Record<string, string> = {}
  const controls = new Set(["category", "q", "page", "limit", "sort", "brand"])
  const aliases: Record<string, string> = {
    interface: "attr.storage.protocol",
    form_factor: "attr.storage.form_factor",
  }
  for (const [rawKey, value] of Object.entries(req.query)) {
    if (controls.has(rawKey)) continue
    let key = aliases[rawKey] || rawKey
    let bound: "min" | "max" | undefined
    if (key.endsWith(".min") || key.endsWith(".max")) {
      bound = key.endsWith(".min") ? "min" : "max"
      key = key.slice(0, -4)
    }
    const definition: any = definitionMap.get(key)
    if (!definition) {
      errors.push(`Unsupported component filter ${rawKey}`)
      continue
    }
    if (definition.value_type === "number" || bound) {
      const parsed = Number(Array.isArray(value) ? value[0] : value)
      if (!Number.isFinite(parsed)) errors.push(`${rawKey} must be numeric`)
      else ranges[key] = { ...(ranges[key] || {}), [bound || "min"]: parsed }
    } else if (["text", "object"].includes(definition.value_type)) {
      const text = String(Array.isArray(value) ? value[0] : value).trim()
      if (text.length > 120) errors.push(`${rawKey} must be at most 120 characters`)
      else texts[key] = text
    } else attributes[key] = values(value)
  }
  for (const [key, range] of Object.entries(ranges)) if (range.min !== undefined && range.max !== undefined && range.min > range.max) errors.push(`${key} minimum cannot exceed maximum`)
  if (errors.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, errors.join("; "))
  const result = executeComponentCatalog({
    ...loaded,
    definitions,
    category: category?.key,
    q,
    brand: values(req.query.brand),
    attributes,
    ranges,
    texts,
    page,
    limit,
    sort,
  })
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
  res.json(result)
}
