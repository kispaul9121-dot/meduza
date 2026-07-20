import { readyDependencyFingerprints, staleReasons } from "./ready-configurations"

function selectedInput(snapshot: any) {
  return (snapshot?.selected_components || []).map((item: any) => ({
    component_id: item.component_id,
    quantity: item.quantity || 1,
    group_key: item.group_key || undefined,
    zone_id: item.zone_id || undefined,
  }))
}

export async function presentReadyConfiguration(service: any, ready: any) {
  const { source_json: _sourceJson, review_json: _reviewJson, ...publicReady } = ready
  const versionNumber = ready.published_version || ready.current_version
  const versions = await service.listReadyConfigurationVersions(
    { ready_configuration_id: ready.id, version: versionNumber },
    { take: 1 }
  )
  const version = versions[0] || null
  if (!version) {
    return { ...publicReady, version: null, stale: true, stale_reasons: ["VERSION_NOT_FOUND"], available_for_order: false }
  }
  const snapshot = version.snapshot_json as any
  const data = await service.loadCompatibilityData({
    server_model_id: ready.server_model_id,
    storage_option_id: snapshot?.topology?.storage_option_id || undefined,
    selected_components: selectedInput(snapshot),
    explicit_none: snapshot?.explicit_none || [],
    mode: "production_validation",
  })
  const reasons = staleReasons(version, readyDependencyFingerprints(data))
  const stale = reasons.length > 0
  const compatible = snapshot?.validation?.status === "compatible" && version.status === "published"
  const action = snapshot?.commerce?.price_mode === "request_quote" ? "request_quote" : "add_to_cart"
  return {
    ...publicReady,
    version: {
      version: version.version,
      snapshot_hash: version.snapshot_hash,
      engine_version: version.engine_version,
      published_at: version.published_at,
      snapshot,
    },
    stale,
    stale_reasons: reasons,
    available_for_order: ready.status === "published" && compatible && !stale,
    primary_action: action,
  }
}
