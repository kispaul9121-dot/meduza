import { sdk } from "@lib/config"

export type ServerModel = {
  id?: string
  medusa_product_id?: string
  medusa_variant_id?: string
  brand: string
  family: string
  generation: string
  model: string
  public_name: string
  slug: string
  form_factor: string
  chassis_type: string
  drive_bays_front: number
  drive_bays_rear: number
  drive_form_factor: string
  supported_drive_interfaces: string[]
  front_option_type?: string | null
  backplane_type: string
  cpu_socket: string
  max_cpu: number
  ram_slots_total: number
  ram_slots_per_cpu: number
  max_ram_capacity: string
  supported_ram_types: string[]
  supported_ram_speeds: string[]
  psu_type: string
  cooling_profile: string
  seo_title: string
  seo_description: string
  source_doc_reference: string
  enabled: boolean
  facets_json?: Record<string, string[]>
  catalog_price?: number | null
  catalog_availability?: "in_stock" | "available" | "backorder" | "out_of_stock" | null
  catalog_condition?: string | null
  presentation_properties?: PresentationProperty[]
}

export type PresentationProperty = {
  key: string
  label: string
  value_type: "text" | "number" | "boolean" | "enum" | "reference" | "list" | "object"
  value: unknown
  unit: string | null
  comparable: boolean
  state: "value" | "not_supported" | "not_specified" | "not_applicable"
  compatibility_status: "engine_mapped" | "informational"
  inherited: boolean
}

export type ComponentSpecs = Record<string, unknown> & {
  interfaces?: unknown[]
  raidLevels?: unknown[]
  provides?: {
    driveBays?: number
    devices?: number
  }
}

export type ComponentOption = {
  id: string
  type: string
  brand: string
  model: string
  public_name: string
  short_name: string
  specs_json: ComponentSpecs
  price: number
  stock_qty: number
  source_type?: "pack" | "direct" | "topology" | "bundle" | "auto_added" | "built_in"
  source_types?: string[]
  available?: boolean
  disabled?: boolean
  reason_codes?: string[]
  message?: string | null
  max_quantity?: number
  effective_specs?: Record<string, unknown>
  required_bundles?: string[]
  conflicts?: string[]
  qualification?: "vendor_qualified" | "technically_compatible" | "unsupported" | string
  triggered_rules?: unknown[]
}

export type ConfiguratorOptionGroup = {
  key: string
  label: string
  title?: string
  component_type?: string
  selection_cardinality?: "zero_or_one" | "exactly_one" | "zero_or_many" | "one_or_many"
  allow_none?: boolean
  none?: { value: null; label: string; selected_by_default: boolean } | null
  derived?: boolean
  options: ComponentOption[]
}

export type StorageChoice = {
  id: string
  key: string
  public_name: string
  source: "server_model" | "server_storage_option" | "compatibility_engine"
  resolution_status: "base_model" | "persisted" | "engine_candidate"
  storage_option_id: string | null
  component_id: string | null
  total_bays: number | null
  zones: unknown[]
  form_factors: string[]
  protocols: string[]
  smaller_form_factor_via_adapter: unknown
  requirements: { controller: unknown; cables: unknown; other: string[] }
  conflicts: string[]
  technical_details: Record<string, unknown>
  available: boolean
  disabled: boolean
  reason_codes: string[]
}

export type ConfiguratorContext = {
  model: ServerModel
  options: ComponentOption[]
  groups: ConfiguratorOptionGroup[]
  storage_choices: StorageChoice[]
  drive_suggestions: Array<{ component_id: string; status: string; reason_codes: string[]; max_quantity: number }>
  source: "compatibility_engine"
}

export type ComponentAttribute = {
  key: string
  label: string
  value_type: PresentationProperty["value_type"]
  value: unknown
  unit: string | null
  comparable: boolean
  compatibility_status: "engine_mapped" | "informational"
  value_source: "property_value" | "property_assignment" | "normalized_specs"
}

export type ComponentCatalogItem = {
  id: string
  type: string
  category_keys: string[]
  brand: string
  model: string
  public_name: string
  short_name: string
  part_number: string | null
  normalization_status: string
  attributes: ComponentAttribute[]
  capabilities: { provides: unknown; consumes: unknown; requirements: unknown }
  product_identity: {
    technical_component_id: string
    medusa_variant_id: string | null
    sellable: boolean
    medusa_product_id: string | null
    medusa_product_handle: string | null
  }
  commerce: { price: number | null; currency_code: string | null; availability: "commerce_record_linked" | "not_for_individual_sale" }
}

export type ComponentCatalogResponse = {
  items: ComponentCatalogItem[]
  total: number
  pagination: ServerCatalogResponse["pagination"]
  categories: Array<{ key: string; label: string; count: number }>
  facets: CatalogFacet[]
  filter_schema: { version: string; definitions: Array<CatalogFilterDefinition & { source: string }> }
  applied_sort: string
}

export type HelpAnnotation = {
  id?: string
  key: string
  page: string
  target_type: string
  component_type?: string | null
  server_model_slug?: string | null
  title: string
  body: string
  placement?: string
  icon?: string
  severity?: string
  sort_order?: number
  source_doc_reference?: string | null
  metadata_json?: Record<string, unknown> | null
}

export type CatalogFacet = {
  key: string
  type: CatalogFilterType
  values: { value: string; label?: string; count: number }[]
  range?: { min: number; max: number; count: number; unit?: string | null } | null
}

export type CatalogFilterType = "enum" | "boolean" | "range" | "text" | "multi_select" | "reference"

export type CatalogFilterDefinition = {
  key: string
  label: string
  category: string
  type: CatalogFilterType
  source: "server_model" | "property_registry" | "commerce"
  unit?: string | null
  schema_version: number
  primary: boolean
  options?: { value: string; label: string; aliases?: string[] }[]
}

export type ServerCatalogResponse = {
  items: ServerModel[]
  total: number
  pagination: {
    page: number
    limit: number
    pages: number
    has_previous: boolean
    has_next: boolean
  }
  facets: CatalogFacet[]
  filter_schema: { version: string; definitions: CatalogFilterDefinition[] }
  active_filters: Record<string, string[] | string | { min?: number; max?: number }>
  applied_sort: string
  query_metadata: {
    duration_ms: number
    scanned_count: number
    returned_count: number
    query_count: number
    cache_policy: string
  }
}

export type ReadyConfiguration = {
  id: string
  slug: string
  name: string
  description: string | null
  use_case: string
  server_model_id: string
  status: "published"
  price_mode: "fixed" | "from" | "request_quote"
  currency_code: string | null
  base_price: number | null
  components_price: number | null
  total_price: number | null
  featured: boolean
  stale: boolean
  stale_reasons: string[]
  available_for_order: boolean
  primary_action: "add_to_cart" | "request_quote"
  seo_title?: string | null
  seo_description?: string | null
  media_json?: Record<string, unknown> | null
  version: {
    version: number
    snapshot_hash: string
    engine_version: string
    published_at: string | null
    snapshot: {
      server_model: { id: string; slug: string; public_name: string }
      topology: { storage_option_id: string | null; placements: unknown[] }
      selected_components: Array<{
        component_id: string
        quantity: number
        type: string | null
        public_name: string | null
        part_number: string | null
        unit_price: number | null
        normalized_specs: Record<string, unknown>
      }>
      explicit_none: string[]
      effective_specs: Record<string, unknown>
      commerce: { price_mode: string; currency_code: string | null; total_price: number | null }
      validation: { status: string; warnings: string[]; reason_codes: string[] }
    }
  }
}

export type ReadyConfiguratorState = {
  ready_configuration_id: string
  version: number
  server_model_slug: string
  selected_components: Array<{ component_id: string; quantity: number; group_key?: string; zone_id?: string }>
  explicit_none: string[]
  storage_option_id: string | null
  snapshot_hash: string
}

export async function queryServerCatalog(
  parameters: URLSearchParams | Record<string, string | string[] | undefined>,
  signal?: AbortSignal,
) {
  const query = parameters instanceof URLSearchParams
    ? new URLSearchParams(parameters)
    : new URLSearchParams()
  if (!(parameters instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(parameters)) {
      for (const entry of Array.isArray(value) ? value : value ? [value] : []) query.append(key, entry)
    }
  }
  return sdk.client.fetch<ServerCatalogResponse>(
    `/store/server-configurator/catalog?${query.toString()}`,
    signal ? { signal } : { next: { revalidate: 30 } },
  )
}

export async function listServerModels() {
  try {
    const result = await sdk.client.fetch<{ models: ServerModel[] }>("/store/server-configurator/models", {
      next: { revalidate: 60 },
    })
    return result.models || []
  } catch {
    return []
  }
}

export async function listReadyConfigurations(parameters: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(parameters)) if (value) query.set(key, value)
  const result = await sdk.client.fetch<{ ready_configurations: ReadyConfiguration[] }>(
    `/store/ready-configurations${query.size ? `?${query.toString()}` : ""}`,
    { next: { revalidate: 30 } },
  )
  return result.ready_configurations || []
}

export async function retrieveReadyConfiguration(slug: string) {
  try {
    const result = await sdk.client.fetch<{ ready_configuration: ReadyConfiguration }>(
      `/store/ready-configurations/${encodeURIComponent(slug)}`,
      { next: { revalidate: 30 } },
    )
    return result.ready_configuration
  } catch {
    return null
  }
}

export async function retrieveReadyConfiguratorState(slug: string) {
  try {
    return await sdk.client.fetch<ReadyConfiguratorState>(
      `/store/ready-configurations/${encodeURIComponent(slug)}/configurator`,
      { cache: "no-store" },
    )
  } catch {
    return null
  }
}

export async function retrieveServerModel(slug: string) {
  try {
    const result = await sdk.client.fetch<{ model: ServerModel }>(`/store/server-configurator/models/${slug}`, {
      next: { revalidate: 60 },
    })
    return result.model || null
  } catch {
    return null
  }
}

export async function listConfiguratorOptions(slug: string) {
  const result = await listConfiguratorContext(slug)
  return result.options
}

export async function listConfiguratorContext(slug: string) {
  return sdk.client.fetch<ConfiguratorContext>(
    `/store/server-configurator/models/${slug}/options`,
    { next: { revalidate: 60 } },
  )
}

export async function queryComponentCatalog(
  parameters: URLSearchParams | Record<string, string | string[] | undefined>,
  signal?: AbortSignal,
) {
  const query = parameters instanceof URLSearchParams ? new URLSearchParams(parameters) : new URLSearchParams()
  if (!(parameters instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(parameters)) {
      for (const entry of Array.isArray(value) ? value : value ? [value] : []) query.append(key, entry)
    }
  }
  return sdk.client.fetch<ComponentCatalogResponse>(
    `/store/server-configurator/components?${query.toString()}`,
    signal ? { signal } : { next: { revalidate: 60 } },
  )
}

export async function retrieveComponent(id: string) {
  const result = await sdk.client.fetch<{ component: ComponentCatalogItem }>(
    `/store/server-configurator/components/${encodeURIComponent(id)}`,
    { next: { revalidate: 60 } },
  )
  return result.component
}

export async function listHelpAnnotations(page: string, slug?: string) {
  const query = new URLSearchParams({ page })
  if (slug) query.set("slug", slug)

  try {
    const result = await sdk.client.fetch<{ annotations: HelpAnnotation[] }>(
      `/store/server-configurator/help-annotations?${query.toString()}`,
      { next: { revalidate: 60 } }
    )
    return result.annotations || []
  } catch {
    return []
  }
}

export async function listCatalogFacets() {
  try {
    const result = await sdk.client.fetch<{ facets: CatalogFacet[] }>("/store/server-configurator/catalog-facets", {
      next: { revalidate: 60 },
    })
    return result.facets || []
  } catch {
    return []
  }
}

export function productJsonLd(model: ServerModel) {
  const availability = ({
    in_stock: "https://schema.org/InStock",
    available: "https://schema.org/InStock",
    backorder: "https://schema.org/BackOrder",
    out_of_stock: "https://schema.org/OutOfStock",
  } as Record<string, string>)[model.catalog_availability || ""]
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: model.public_name,
    brand: { "@type": "Brand", name: model.brand },
    category: "Server hardware",
    sku: model.slug,
    description: model.seo_description,
    ...(model.catalog_price !== null && model.catalog_price !== undefined && availability ? { offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: model.catalog_price,
      availability,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/servers/${model.slug}`,
    } } : {}),
  }
}
