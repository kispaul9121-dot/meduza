const http = require("node:http")

const json = (response, status, body) => {
  response.writeHead(status, {
    "access-control-allow-credentials": "true",
    "access-control-allow-origin": "http://127.0.0.1:8000",
    "access-control-allow-headers": "content-type,x-publishable-api-key,authorization",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "content-type": "application/json",
  })
  response.end(JSON.stringify(body))
}

const readJson = (request) => new Promise((resolve, reject) => {
  let body = ""
  request.setEncoding("utf8")
  request.on("data", (chunk) => { body += chunk })
  request.on("end", () => {
    try {
      resolve(body ? JSON.parse(body) : {})
    } catch (error) {
      reject(error)
    }
  })
  request.on("error", reject)
})

const models = [
  {
    id: "srv_hpe", medusa_product_id: "prod_hpe", medusa_variant_id: "var_hpe", brand: "HPE", family: "ProLiant", generation: "Gen10", model: "DL360", public_name: "HPE ProLiant DL360 Gen10", slug: "hpe-dl360", form_factor: "1U", chassis_type: "8SFF", drive_bays_front: 8, drive_bays_rear: 0, drive_form_factor: "2.5", supported_drive_interfaces: ["SAS", "SATA"], backplane_type: "SAS/SATA", cpu_socket: "LGA3647", max_cpu: 2, ram_slots_total: 24, ram_slots_per_cpu: 12, max_ram_capacity: "3 TB", supported_ram_types: ["DDR4"], supported_ram_speeds: ["2933"], psu_type: "Hot Plug", cooling_profile: "standard", seo_title: "HPE DL360", seo_description: "HPE server platform", source_doc_reference: "HPE QuickSpecs", enabled: true, catalog_price: 2400, catalog_availability: "in_stock", catalog_condition: null, presentation_properties: [{ key: "cpu.cores", label: "Максимум ядер CPU", value_type: "number", value: 28, unit: null, comparable: true, state: "value", compatibility_status: "engine_mapped", inherited: true }],
  },
  {
    id: "srv_dell", medusa_product_id: "prod_dell", medusa_variant_id: "var_dell", brand: "Dell", family: "PowerEdge", generation: "14G", model: "R640", public_name: "Dell PowerEdge R640", slug: "dell-r640", form_factor: "1U", chassis_type: "10SFF", drive_bays_front: 10, drive_bays_rear: 0, drive_form_factor: "2.5", supported_drive_interfaces: ["SAS", "SATA", "NVMe"], backplane_type: "Hybrid", cpu_socket: "LGA3647", max_cpu: 2, ram_slots_total: 24, ram_slots_per_cpu: 12, max_ram_capacity: "3 TB", supported_ram_types: ["DDR4"], supported_ram_speeds: ["2933"], psu_type: "Hot Plug", cooling_profile: "standard", seo_title: "Dell R640", seo_description: "Dell server platform", source_doc_reference: "Dell technical guide", enabled: true, catalog_price: null, catalog_availability: "backorder", catalog_condition: null, presentation_properties: [{ key: "cpu.cores", label: "Максимум ядер CPU", value_type: "number", value: 32, unit: null, comparable: true, state: "value", compatibility_status: "engine_mapped", inherited: true }],
  },
]

const component = {
  id: "cpu_xeon_6248", type: "cpu", category_keys: ["cpu"], brand: "Intel", model: "Xeon Gold 6248", public_name: "Intel Xeon Gold 6248", short_name: "Xeon 6248", part_number: "CD8069504194101", normalization_status: "normalized", attributes: [{ key: "cpu.cores", label: "Ядра", value_type: "number", value: 20, unit: null, comparable: true, compatibility_status: "engine_mapped", value_source: "normalized_specs" }], capabilities: { provides: { compute: true }, consumes: { socket: "LGA3647" }, requirements: { cooling: "standard" } }, product_identity: { technical_component_id: "cpu_xeon_6248", medusa_variant_id: null, sellable: false, medusa_product_id: null, medusa_product_handle: null }, commerce: { price: null, currency_code: null, availability: "not_for_individual_sale" },
}

const options = {
  options: [{ id: component.id, type: "cpu", brand: component.brand, model: component.model, public_name: component.public_name, short_name: component.short_name, specs_json: { cores: 20, tdp: 150 }, price: 0, stock_qty: 0, available: true, disabled: false, reason_codes: [], max_quantity: 2 }],
  groups: [{ key: "cpu", label: "Процессоры", title: "Процессоры", component_type: "cpu", selection_cardinality: "zero_or_many", allow_none: true, none: { value: null, label: "Не добавлять", selected_by_default: false }, options: [{ id: component.id, type: "cpu", brand: component.brand, model: component.model, public_name: component.public_name, short_name: component.short_name, specs_json: { cores: 20, tdp: 150 }, price: 0, stock_qty: 0, available: true, disabled: false, reason_codes: [], max_quantity: 2 }], derived: true }],
  storage_choices: [{ id: "base-model-storage", key: "base-model-storage", public_name: "Базовая дисковая конфигурация", source: "server_model", resolution_status: "base_model", storage_option_id: null, component_id: null, total_bays: 8, zones: ["front"], form_factors: ["2.5"], protocols: ["SAS", "SATA"], smaller_form_factor_via_adapter: "not_specified", requirements: { controller: "not_specified", cables: "not_specified", other: [] }, conflicts: [], technical_details: {}, available: true, disabled: false, reason_codes: [] }],
  drive_suggestions: [], source: "compatibility_engine",
}

const readySnapshotHash = "b".repeat(64)
const ready = {
  id: "ready_virtualization",
  slug: "virtualization-starter",
  name: "Virtualization Starter",
  description: "Validated starter configuration",
  use_case: "Виртуализация",
  server_model_id: "srv_dell",
  status: "published",
  price_mode: "request_quote",
  currency_code: null,
  base_price: null,
  components_price: null,
  total_price: null,
  featured: true,
  stale: false,
  stale_reasons: [],
  available_for_order: true,
  primary_action: "request_quote",
  version: {
    version: 2,
    snapshot_hash: readySnapshotHash,
    engine_version: "adr-011-engine-v1",
    published_at: "2026-07-20T20:00:00.000Z",
    snapshot: {
      server_model: { id: "srv_dell", slug: "dell-r640", public_name: "Dell PowerEdge R640" },
      topology: { storage_option_id: null, placements: [] },
      selected_components: [{ component_id: component.id, quantity: 1, type: component.type, public_name: component.public_name, part_number: component.part_number, unit_price: null, normalized_specs: { cores: 20 } }],
      explicit_none: [],
      effective_specs: { compute: { cores: 20 } },
      commerce: { price_mode: "request_quote", currency_code: null, total_price: null },
      validation: { status: "compatible", warnings: [], reason_codes: [] },
    },
  },
}

http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:9100")

  if (request.method === "OPTIONS") return json(response, 200, { ok: true })

  if (url.pathname === "/health") return json(response, 200, { ok: true })
  if (url.pathname === "/store/regions") {
    return json(response, 200, {
      regions: [{
        id: "reg_dk",
        name: "Denmark",
        currency_code: "dkk",
        countries: [{ iso_2: "dk", display_name: "Denmark" }],
      }],
    })
  }
  if (url.pathname === "/store/server-configurator/models") {
    return json(response, 200, { models })
  }
  if (url.pathname === "/store/server-configurator/help-annotations") {
    return json(response, 200, { annotations: [] })
  }
  if (url.pathname === "/store/server-configurator/catalog-facets") {
    return json(response, 200, { facets: [] })
  }
  if (url.pathname === "/store/ready-configurations") {
    const items = url.searchParams.get("server_model_slug") && url.searchParams.get("server_model_slug") !== "dell-r640" ? [] : [ready]
    return json(response, 200, { ready_configurations: items, count: items.length })
  }
  if (url.pathname === `/store/ready-configurations/${ready.slug}`) return json(response, 200, { ready_configuration: ready })
  if (url.pathname === `/store/ready-configurations/${ready.slug}/configurator`) return json(response, 200, {
    ready_configuration_id: ready.id,
    version: ready.version.version,
    server_model_slug: "dell-r640",
    selected_components: [{ component_id: component.id, quantity: 1 }],
    explicit_none: [],
    storage_option_id: null,
    snapshot_hash: ready.version.snapshot_hash,
  })
  if (url.pathname === "/store/server-configurator/catalog") {
    let items = models
    if (url.searchParams.get("brand")) items = items.filter((model) => model.brand === url.searchParams.get("brand"))
    if (url.searchParams.get("slugs")) {
      const slugs = url.searchParams.get("slugs").split(",")
      items = items.filter((model) => slugs.includes(model.slug))
    }
    return json(response, 200, {
      items,
      total: items.length,
      pagination: { page: 1, limit: Number(url.searchParams.get("limit") || 12), pages: items.length ? 1 : 0, has_previous: false, has_next: false },
      facets: [{ key: "brand", type: "multi_select", values: [{ value: "Dell", label: "Dell", count: 1 }, { value: "HPE", label: "HPE", count: 1 }], range: null }],
      filter_schema: { version: "catalog-smoke-v1", definitions: [{ key: "brand", label: "Бренд", category: "Бренд / модель", type: "multi_select", source: "server_model", schema_version: 1, primary: true }] },
      active_filters: {},
      applied_sort: "relevance",
      query_metadata: { duration_ms: 1, scanned_count: models.length, returned_count: items.length, query_count: 1, cache_policy: "public, max-age=30" },
    })
  }
  const modelMatch = url.pathname.match(/^\/store\/server-configurator\/models\/([^/]+)$/)
  if (modelMatch) {
    const model = models.find((entry) => entry.slug === modelMatch[1])
    return model ? json(response, 200, { model }) : json(response, 404, { message: "Not found" })
  }
  const optionsMatch = url.pathname.match(/^\/store\/server-configurator\/models\/([^/]+)\/options$/)
  if (optionsMatch) {
    const model = models.find((entry) => entry.slug === optionsMatch[1])
    return model ? json(response, 200, { model, ...options }) : json(response, 404, { message: "Not found" })
  }
  if (url.pathname === "/store/server-configurator/components") {
    const category = url.searchParams.get("category")
    const items = !category || component.category_keys.includes(category) ? [component] : []
    return json(response, 200, { items, total: items.length, pagination: { page: 1, limit: 24, pages: items.length ? 1 : 0, has_previous: false, has_next: false }, categories: [{ key: "cpu", label: "Процессоры", count: 1 }, { key: "memory", label: "Память", count: 0 }, { key: "drives", label: "Накопители", count: 0 }], facets: [{ key: "brand", type: "multi_select", values: [{ value: "Intel", label: "Intel", count: 1 }] }], filter_schema: { version: "components-smoke-v1", definitions: [{ key: "brand", label: "Бренд", category: "Компонент", type: "multi_select", source: "component", schema_version: 1, primary: true }] }, active_filters: {}, applied_sort: "name_asc" })
  }
  if (url.pathname === `/store/server-configurator/components/${component.id}`) return json(response, 200, { component })
  if (url.pathname === "/store/server-configurator/validate" && request.method === "POST") return json(response, 200, { valid: true, errors: [], warnings: [], effective_specs: {} })
  if (url.pathname === "/store/server-configurator/rfq" && request.method === "POST") {
    try {
      const body = await readJson(request)
      const includesReadyIdentity = Boolean(body.ready_configuration_id || body.ready_configuration_version || body.ready_snapshot_hash)
      const readyIdentityMatches = body.ready_configuration_id === ready.id &&
        body.ready_configuration_version === ready.version.version &&
        body.ready_snapshot_hash === ready.version.snapshot_hash
      if (includesReadyIdentity && !readyIdentityMatches) {
        return json(response, 409, { message: "Ready configuration identity mismatch." })
      }
      return json(response, 201, {
        quote_request: { id: "rfq_stage12_mock", status: "requested" },
        configuration: { id: "cfg_stage12_mock", hash: "c".repeat(64) },
        availability_warnings: [],
      })
    } catch {
      return json(response, 400, { message: "Invalid JSON body." })
    }
  }
  if (url.pathname.startsWith("/store/carts/")) {
    return json(response, 200, {
      cart: {
        id: url.pathname.split("/").at(-1),
        currency_code: "dkk",
        items: [],
        region_id: "reg_dk",
        region: { id: "reg_dk", currency_code: "dkk" },
      },
    })
  }
  if (url.pathname === "/store/shipping-options") {
    return json(response, 200, { shipping_options: [] })
  }
  if (url.pathname === "/store/collections") {
    return json(response, 200, { collections: [], count: 0, offset: 0, limit: 100 })
  }
  if (url.pathname === "/store/product-categories") {
    return json(response, 200, { product_categories: [], count: 0, offset: 0, limit: 100 })
  }
  if (url.pathname === "/store/customers/me") {
    return json(response, 200, { customer: null })
  }

  return json(response, 404, { message: `Smoke mock route not found: ${url.pathname}` })
}).listen(9100, "127.0.0.1")
