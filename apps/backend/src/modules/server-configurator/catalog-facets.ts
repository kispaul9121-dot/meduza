import { SYSTEM_CATALOG_FILTERS } from "./catalog-query"

// Compatibility surface for older clients. Values are derived only from persisted
// ServerModel fields; commercial and registry-backed facets live in /catalog.
export const catalogFacetDefinitions = SYSTEM_CATALOG_FILTERS.filter(
  (definition) => definition.source === "server_model",
).map(({ key, label, category }) => ({ key, label, category }))

export function modelFacetValues(model: any, key: string) {
  const value =
    key === "drive_bays_total"
      ? Number(model.drive_bays_front || 0) + Number(model.drive_bays_rear || 0)
      : model[key]
  const values = Array.isArray(value) ? value : [value]
  return values
    .filter((item) => item !== undefined && item !== null && item !== "")
    .map(String)
}

export function modelFacetsJson(model: any) {
  return Object.fromEntries(
    catalogFacetDefinitions.map((definition) => [
      definition.key,
      modelFacetValues(model, definition.key),
    ]),
  )
}

export function decorateModelWithFacets(model: any) {
  return {
    ...model,
    facets_json: modelFacetsJson(model),
  }
}
