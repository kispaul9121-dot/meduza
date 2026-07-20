import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"
import {
  buildReadyConfigurationSnapshot,
  pricePublicationErrors,
  ReadyPriceMode,
  readyDependencyFingerprints,
  staleReasons,
} from "../../../modules/server-configurator/ready-configurations"
import { SelectedComponentInput } from "../../../modules/server-configurator/engine"

export type ReadyConfigurationInput = {
  id?: string
  name?: string
  slug?: string
  description?: string | null
  use_case?: string
  server_model_id?: string
  server_model_slug?: string
  selected_components?: SelectedComponentInput[]
  explicit_none?: string[]
  storage_option_id?: string | null
  price_mode?: ReadyPriceMode
  currency_code?: string | null
  base_price?: number | null
  components_price?: number | null
  total_price?: number | null
  featured?: boolean
  sort_order?: number
  media_json?: Record<string, unknown> | null
  seo_title?: string | null
  seo_description?: string | null
  source_json?: Record<string, unknown> | null
  review_json?: Record<string, unknown> | null
  created_from?: "manual" | "simulator" | "user_configuration" | "duplicate" | "revalidation"
  source_configuration_id?: string | null
  source_ready_configuration_id?: string | null
  publish?: boolean
}

function selectedFromSnapshot(snapshot: any): SelectedComponentInput[] {
  return (snapshot?.selected_components || []).map((item: any) => ({
    component_id: item.component_id,
    quantity: item.quantity || 1,
    group_key: item.group_key || undefined,
    zone_id: item.zone_id || undefined,
  }))
}

export const prepareReadyConfigurationStep = createStep(
  "prepare-ready-configuration",
  async (input: ReadyConfigurationInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    let existing: any = null
    let sourceVersion: any = null
    if (input.id) {
      existing = await service.retrieveReadyConfiguration(input.id)
      const versions = await service.listReadyConfigurationVersions(
        { ready_configuration_id: input.id },
        { take: 1, order: { version: "DESC" } }
      )
      sourceVersion = versions[0] || null
    } else if (input.source_ready_configuration_id) {
      existing = await service.retrieveReadyConfiguration(input.source_ready_configuration_id)
      const versions = await service.listReadyConfigurationVersions(
        { ready_configuration_id: input.source_ready_configuration_id },
        { take: 1, order: { version: "DESC" } }
      )
      sourceVersion = versions[0] || null
    }

    let sourceConfiguration: any = null
    let selected = input.selected_components
    if (input.source_configuration_id) {
      sourceConfiguration = await service.retrieveConfiguration(input.source_configuration_id)
      const items = await service.listConfigurationItems({ configuration_id: input.source_configuration_id })
      selected = items.map((item: any) => ({ component_id: item.component_id, quantity: item.quantity || 1 }))
    }
    selected ||= selectedFromSnapshot(sourceVersion?.snapshot_json)
    const serverModelId = input.server_model_id || sourceConfiguration?.server_model_id || existing?.server_model_id || sourceVersion?.snapshot_json?.server_model?.id
    const serverModelSlug = input.server_model_slug || sourceVersion?.snapshot_json?.server_model?.slug
    if (!serverModelId && !serverModelSlug) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "READY_CONFIGURATION_SERVER_MODEL_REQUIRED")
    }
    const explicitNone = input.explicit_none || sourceVersion?.snapshot_json?.explicit_none || []
    const storageOptionId = input.storage_option_id ?? sourceVersion?.snapshot_json?.topology?.storage_option_id ?? null
    const priceMode = input.price_mode || existing?.price_mode || sourceVersion?.snapshot_json?.commerce?.price_mode || "request_quote"
    const currencyCode = input.currency_code ?? existing?.currency_code ?? sourceVersion?.snapshot_json?.commerce?.currency_code ?? null
    const basePrice = input.base_price ?? existing?.base_price ?? sourceVersion?.snapshot_json?.commerce?.base_price ?? null
    const componentsPrice = input.components_price ?? existing?.components_price ?? sourceVersion?.snapshot_json?.commerce?.components_price ?? null
    const totalPrice = input.total_price ?? existing?.total_price ?? sourceVersion?.snapshot_json?.commerce?.total_price ?? null
    const data = await service.loadCompatibilityData({
      server_model_id: serverModelId,
      server_model_slug: serverModelSlug,
      storage_option_id: storageOptionId || undefined,
      selected_components: selected || [],
      explicit_none: explicitNone,
      mode: "production_validation",
    })
    const validation = await service.validateConfiguration({
      server_model_id: data.model?.id,
      storage_option_id: storageOptionId || undefined,
      selected_components: selected || [],
      explicit_none: explicitNone,
      mode: "production_validation",
    })
    const frozen = buildReadyConfigurationSnapshot({
      data,
      validation,
      selected_components: selected || [],
      explicit_none: explicitNone,
      storage_option_id: storageOptionId,
      price_mode: priceMode,
      currency_code: currencyCode,
      base_price: basePrice,
      components_price: componentsPrice,
      total_price: totalPrice,
    })
    const commerceErrors = pricePublicationErrors({
      price_mode: priceMode,
      currency_code: currencyCode,
      base_price: basePrice,
      components_price: componentsPrice,
      total_price: totalPrice,
      model: data.model,
      selected_components: frozen.snapshot.selected_components,
    })
    if (input.publish && (!validation.valid || commerceErrors.length)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        ["READY_CONFIGURATION_PUBLISH_BLOCKED", ...validation.reason_codes, ...commerceErrors].join(" ")
      )
    }
    return new StepResponse({
      existing,
      version: existing ? Number(existing.current_version || 0) + 1 : 1,
      row: {
        name: input.name || (input.source_ready_configuration_id ? `${existing.name} Copy` : existing?.name),
        slug: input.slug || (input.source_ready_configuration_id ? `${existing.slug}-copy-${Date.now()}` : existing?.slug),
        description: input.description ?? existing?.description ?? null,
        use_case: input.use_case || existing?.use_case || "general",
        server_model_id: data.model.id,
        price_mode: priceMode,
        currency_code: currencyCode,
        base_price: basePrice,
        components_price: componentsPrice,
        total_price: totalPrice,
        featured: input.featured ?? existing?.featured ?? false,
        sort_order: input.sort_order ?? existing?.sort_order ?? 100,
        media_json: input.media_json ?? existing?.media_json ?? null,
        seo_title: input.seo_title ?? existing?.seo_title ?? null,
        seo_description: input.seo_description ?? existing?.seo_description ?? null,
        source_json: input.source_json ?? existing?.source_json ?? null,
        review_json: input.review_json ?? existing?.review_json ?? null,
      },
      frozen,
      validation,
      created_from: input.created_from || (input.source_ready_configuration_id ? "duplicate" : input.id ? "revalidation" : input.source_configuration_id ? "user_configuration" : "manual"),
      source_configuration_id: input.source_configuration_id || null,
      publish: Boolean(input.publish),
    })
  }
)

export const createReadyConfigurationStep = createStep(
  "create-ready-configuration",
  async (input: any, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    if (!input.row.name || !input.row.slug) throw new MedusaError(MedusaError.Types.INVALID_DATA, "READY_CONFIGURATION_NAME_AND_SLUG_REQUIRED")
    const ready = await service.createReadyConfigurations({
      ...input.row,
      status: input.publish ? "published" : "draft",
      current_version: 1,
      published_version: input.publish ? 1 : null,
      stale: false,
      stale_reasons_json: [],
      published_at: input.publish ? new Date() : null,
    })
    return new StepResponse(ready, ready.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteReadyConfigurations(id)
  }
)

export const createReadyConfigurationVersionStep = createStep(
  "create-ready-configuration-version",
  async (input: any, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const version = await service.createReadyConfigurationVersions({
      ready_configuration_id: input.ready_configuration_id,
      version: input.version,
      status: input.publish ? "published" : input.validation.valid ? "valid" : "invalid",
      snapshot_json: input.frozen.snapshot,
      snapshot_hash: input.frozen.snapshot_hash,
      engine_version: input.frozen.snapshot.engine_version,
      relation_graph_hash: input.frozen.relation_graph_hash,
      property_schema_hash: input.frozen.property_schema_hash,
      pack_assignment_hash: input.frozen.pack_assignment_hash,
      dependency_hash: input.frozen.dependency_hash,
      validation_trace_json: input.validation.trace,
      validation_errors_json: input.validation.errors,
      validation_warnings_json: input.validation.warnings,
      created_from: input.created_from,
      source_configuration_id: input.source_configuration_id,
      immutable: true,
      published_at: input.publish ? new Date() : null,
    })
    return new StepResponse(version, version.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteReadyConfigurationVersions(id)
  }
)

export const updateReadyConfigurationVersionPointerStep = createStep(
  "update-ready-configuration-version-pointer",
  async (input: any, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveReadyConfiguration(input.id)
    const ready = await service.updateReadyConfigurations({
      id: input.id,
      ...input.row,
      current_version: input.version,
      status: input.publish ? "published" : previous.status === "archived" ? "archived" : previous.status,
      published_version: input.publish ? input.version : previous.published_version,
      stale: false,
      stale_reasons_json: [],
      published_at: input.publish ? new Date() : previous.published_at,
    })
    return new StepResponse(ready, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateReadyConfigurations(previous)
  }
)

export const changeReadyConfigurationStatusStep = createStep(
  "change-ready-configuration-status",
  async (input: { id: string; status: "unpublished" | "archived" }, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveReadyConfiguration(input.id)
    const ready = await service.updateReadyConfigurations({ id: input.id, status: input.status })
    return new StepResponse(ready, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateReadyConfigurations(previous)
  }
)

export const refreshReadyConfigurationStalenessStep = createStep(
  "refresh-ready-configuration-staleness",
  async (input: { id: string }, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const ready = await service.retrieveReadyConfiguration(input.id)
    const versions = await service.listReadyConfigurationVersions(
      { ready_configuration_id: input.id, version: ready.published_version || ready.current_version },
      { take: 1 }
    )
    const version = versions[0]
    if (!version) return new StepResponse({ ready, reasons: ["VERSION_NOT_FOUND"] })
    const snapshot: any = version.snapshot_json
    const data = await service.loadCompatibilityData({
      server_model_id: ready.server_model_id,
      storage_option_id: snapshot?.topology?.storage_option_id || undefined,
      selected_components: selectedFromSnapshot(snapshot),
      explicit_none: snapshot?.explicit_none || [],
      mode: "production_validation",
    })
    const reasons = staleReasons(version, readyDependencyFingerprints(data))
    const previous = ready
    const updated = await service.updateReadyConfigurations({ id: input.id, stale: reasons.length > 0, stale_reasons_json: reasons })
    return new StepResponse({ ready: updated, reasons }, previous)
  },
  async (previous, { container }) => {
    if (!previous?.id) return
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateReadyConfigurations(previous)
  }
)
