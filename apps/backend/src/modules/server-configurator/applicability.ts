type Applicability = {
  brands?: string[]
  families?: string[]
  generations?: string[]
  server_model_slugs?: string[]
  chassis_types?: string[]
  exclude_server_model_slugs?: string[]
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function matchesAny(values: string[], actual?: string | null) {
  return !values.length || (actual ? values.includes(actual) : false)
}

export function getApplicability(component: any): Applicability {
  const specs = component?.specs_json || {}
  const explicit = specs.applicability || {}
  return {
    brands: list(explicit.brands),
    families: list(explicit.families),
    generations: list(explicit.generations),
    server_model_slugs: list(explicit.server_model_slugs),
    chassis_types: list(explicit.chassis_types),
    exclude_server_model_slugs: list(explicit.exclude_server_model_slugs),
  }
}

export function componentAppliesToModel(component: any, model: any) {
  const specs = component?.specs_json || {}
  const applicability = getApplicability(component)
  const legacySlugs = [
    specs.server_model_slug,
    specs.server_model,
    specs.model_slug,
    specs.raw_source?.serverModelSlug,
  ].filter(Boolean).map(String)

  if (applicability.exclude_server_model_slugs?.includes(model.slug)) {
    return false
  }

  if (legacySlugs.length && !legacySlugs.includes(model.slug)) {
    return false
  }

  return (
    matchesAny(applicability.brands || [], model.brand) &&
    matchesAny(applicability.families || [], model.family) &&
    matchesAny(applicability.generations || [], model.generation) &&
    matchesAny(applicability.server_model_slugs || [], model.slug) &&
    matchesAny(applicability.chassis_types || [], model.chassis_type)
  )
}

export function previewApplicability(component: any, models: any[]) {
  return models
    .filter((model) => componentAppliesToModel(component, model))
    .map((model) => ({
      id: model.id,
      slug: model.slug,
      public_name: model.public_name,
      brand: model.brand,
      family: model.family,
      generation: model.generation,
      chassis_type: model.chassis_type,
    }))
}
