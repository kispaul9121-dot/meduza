import { componentCategoryKeys, executeComponentCatalog, normalizedComponentValue, resolveComponentCategory } from "../component-catalog"
import { buildStorageChoices, buildStorefrontGroups } from "../storefront-presentation"

const definition = {
  id: "prop_cpu_cores",
  key: "cpu.cores",
  label: "CPU cores",
  value_type: "number",
  unit: null,
  filterable: true,
  displayable: true,
  comparable: true,
  lifecycle_status: "active",
  usage_status: "engine_mapped",
  schema_version: 1,
}

function item(id: string, brand: string, cores: number) {
  return {
    id,
    type: "cpu",
    category_keys: ["cpu"],
    brand,
    model: id,
    public_name: `${brand} ${id}`,
    short_name: id,
    part_number: null,
    normalization_status: "normalized",
    attributes: [{ key: "cpu.cores", label: "CPU cores", value_type: "number", value: cores, unit: null, comparable: true, compatibility_status: "engine_mapped", value_source: "normalized_specs" }],
    capabilities: { provides: {}, consumes: {}, requirements: {} },
    product_identity: { technical_component_id: id, medusa_variant_id: null, sellable: false, medusa_product_id: null, medusa_product_handle: null },
    commerce: { price: null, currency_code: null, availability: "not_for_individual_sale" },
  } as const
}

describe("public component catalog", () => {
  it("uses canonical categories with legacy aliases and normalized spec bridges", () => {
    expect(resolveComponentCategory("ram")?.key).toBe("memory")
    expect(resolveComponentCategory("raid")?.key).toBe("raid-hba")
    expect(componentCategoryKeys({ type: "accelerator", normalized_specs_json: {} })).toContain("accelerators")
    expect(normalizedComponentValue({ normalized_specs_json: { cores: 32 } }, definition)).toBe(32)
  })

  it("filters and facets normalized attributes without exposing legacy commerce fields", () => {
    const result = executeComponentCatalog({
      items: [item("xeon", "Intel", 32), item("epyc", "AMD", 64)] as any,
      definitions: [definition],
      category: "cpu",
      ranges: { "attr.cpu.cores": { min: 48 } },
      page: 1,
      limit: 24,
      sort: "name_asc",
      duration_ms: 1,
      query_count: 6,
    })
    expect(result.items.map((entry) => entry.id)).toEqual(["epyc"])
    expect(result.items[0].commerce).toEqual({ price: null, currency_code: null, availability: "not_for_individual_sale" })
    expect(result.facets.find((facet) => facet.key === "attr.cpu.cores")?.range).toEqual(expect.objectContaining({ min: 32, max: 64 }))
  })

  it("derives generic groups and storage choices from compatibility candidates", () => {
    const options = [
      { id: "gpu", type: "accelerator", public_name: "GPU", max_quantity: 2, source_types: ["pack"] },
      { id: "bp", type: "backplane", public_name: "8 bay backplane", normalized_specs_json: { interfaces: ["SAS", "SATA"], form_factor: "2.5", provides: { driveBays: 8 } }, requirements_json: { controller: "SAS HBA", cable: "Mini-SAS" }, available: true, reason_codes: [] },
    ]
    const data = { model: { drive_bays_front: 8, drive_form_factor: "2.5", supported_drive_interfaces: ["SAS", "SATA"] }, component_type_definitions: [], option_groups: [], storage_options: [] } as any
    const groups = buildStorefrontGroups(data, options)
    expect(groups.find((group) => group.key === "accelerator")?.none.selected_by_default).toBe(true)
    const storage = buildStorageChoices(data, options)
    expect(storage[0]).toEqual(expect.objectContaining({ resolution_status: "base_model", total_bays: 8 }))
    expect(storage[1]).toEqual(expect.objectContaining({ component_id: "bp", total_bays: 8, protocols: ["SAS", "SATA"] }))
  })
})
