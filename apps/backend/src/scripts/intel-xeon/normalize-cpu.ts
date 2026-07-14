import { intelXeonSources } from "./sources"
import { DraftXeonCpu } from "./types"

function suffixFlags(suffix?: string) {
  const value = suffix || ""
  return {
    suffix: value || null,
    is_refresh: value === "R",
    is_high_memory_sku: ["L", "M"].includes(value),
    is_network_sku: value === "N",
    is_single_socket_sku: value === "U",
    is_thermal_sku: value === "T",
    is_speed_select_sku: value === "Y",
    is_fabric_sku: value === "F",
  }
}

export function normalizeCpu(row: DraftXeonCpu) {
  const model = `${row.tier} ${row.processor_number}`
  const turbo = row.max_turbo_frequency_ghz
    ? `${row.base_frequency_ghz.toFixed(2)}-${row.max_turbo_frequency_ghz.toFixed(2)}GHz`
    : `${row.base_frequency_ghz.toFixed(2)}GHz`
  const needsReview = true

  return {
    type: "cpu",
    brand: "Intel",
    public_name: `Intel Xeon ${model}`,
    short_name: `Xeon ${model} · ${row.cores}C/${row.threads}T · ${turbo} · ${row.tdp_w}W · DDR4-${row.max_memory_speed_mhz}`,
    model,
    part_number: row.processor_number,
    enabled: row.tdp_w <= 205,
    price: 0,
    cost: 0,
    stock_qty: 0,
    specs_json: {
      cpu_family: "Intel Xeon Scalable",
      xeon_scalable_generation: row.generation,
      platform_generation: row.platform_generation,
      code_name: row.code_name,
      socket: "FCLGA3647",
      cores: row.cores,
      threads: row.threads,
      base_clock: `${row.base_frequency_ghz}GHz`,
      max_clock: row.max_turbo_frequency_ghz ? `${row.max_turbo_frequency_ghz}GHz` : null,
      base_frequency_ghz: row.base_frequency_ghz,
      max_turbo_frequency_ghz: row.max_turbo_frequency_ghz || null,
      cache_mb: row.cache_mb,
      tdp_w: row.tdp_w,
      tdp: row.tdp_w,
      memory_types: [`DDR4-${row.max_memory_speed_mhz}`],
      max_memory_speed_mhz: row.max_memory_speed_mhz,
      max_memory_speed: row.max_memory_speed_mhz,
      max_memory_size_gb: row.max_memory_size_gb || 768,
      memory_channels: 6,
      ecc_supported: true,
      upi_links: row.scalability === "1S" ? 0 : 2,
      pcie_revision: "3.0",
      pcie_lanes: 48,
      scalability: row.scalability || "2S",
      launch_date: row.launch_date || null,
      source_url: intelXeonSources.intelProductSpecifications,
      source_name: "Curated fallback draft; verify against Intel ARK",
      source_confidence: "fallback",
      needs_review: needsReview,
      ...suffixFlags(row.suffix),
      special_sku_notes: row.special_sku_notes || [],
    },
  }
}
