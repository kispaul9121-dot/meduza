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
}

export type ComponentOption = {
  id: string
  type: string
  brand: string
  model: string
  public_name: string
  short_name: string
  specs_json: Record<string, any>
  price: number
  stock_qty: number
}

export type ConfiguratorOptionGroup = {
  key: string
  label: string
  options: ComponentOption[]
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
  metadata_json?: Record<string, any> | null
}

export type CatalogFacet = {
  key: string
  label: string
  category: string
  values: { value: string; count: number }[]
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
  try {
    const result = await sdk.client.fetch<{
      options: ComponentOption[]
      groups?: ConfiguratorOptionGroup[]
      source?: "db" | "dev_fallback"
    }>(
      `/store/server-configurator/models/${slug}/options`,
      { next: { revalidate: 60 } }
    )
    return result.options || []
  } catch {
    return []
  }
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
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: model.public_name,
    brand: { "@type": "Brand", name: model.brand },
    category: "Server hardware",
    sku: model.slug,
    description: model.seo_description,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/servers/${model.slug}`,
    },
  }
}
