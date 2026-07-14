export type DraftXeonCpu = {
  generation: "1st" | "2nd"
  platform_generation: "Skylake-SP" | "Cascade Lake-SP" | "Cascade Lake Refresh"
  code_name: "Skylake" | "Cascade Lake"
  processor_number: string
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  cores: number
  threads: number
  base_frequency_ghz: number
  max_turbo_frequency_ghz?: number
  cache_mb: number
  tdp_w: number
  max_memory_speed_mhz: number
  max_memory_size_gb?: number
  scalability?: string
  launch_date?: string
  suffix?: string
  special_sku_notes?: string[]
}
