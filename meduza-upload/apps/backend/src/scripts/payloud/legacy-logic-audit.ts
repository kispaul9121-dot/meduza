export type LegacyAuditSection = {
  key: string
  title: string
  status: "ok" | "partial" | "missing" | "needs review"
  source_files: string[]
  imported_count: number
  found: string[]
  current_medusa: string[]
  missing: string[]
  recommended_next_action: string
}

export const legacyAuditSections: LegacyAuditSection[] = [
  {
    key: "cpu",
    title: "CPU generation logic",
    status: "partial",
    source_files: ["src/data/configurator.js", "src/lib/configuratorOptionFilters.js", "src/components/configurator/ConfiguratorFilterSwitches.jsx", "payload-cms/src/collections/CPUs.ts", "payload-cms/src/collections/CPUFamilies.ts"],
    imported_count: 6,
    found: [
      "Legacy local configurator offered Intel Xeon Silver 4210R, Silver 4214R, Gold 5218R, and Gold 6248R.",
      "CPU rows carried socket LGA3647, cores, turbo/base clock, TDP, DDR4-2933 memory type, and min/max quantity 1-2.",
      "Configurator filters inferred Xeon Scalable 1st/2nd generation from CPU model numbers and rendered buttons for All, 1st Gen, and 2nd Gen.",
      "Payload collections had CPU socket/family modeling, so different CPU lists per platform were intended.",
    ],
    current_medusa: [
      "Medusa imports CPU components with cores, threads, TDP, socket and max_memory_speed in specs_json.",
      "Storefront now has a safe inferred CPU generation filter based on imported option labels/specs.",
      "Enabled rules currently enforce active compatibility only from normalized enabled rules, not imported draft rules.",
    ],
    missing: [
      "No explicit per-platform CPU applicability table beyond specs_json/import provenance.",
      "No persisted CPU generation field; current storefront filter is inferred from model text.",
    ],
    recommended_next_action: "Keep CPU rows enabled, then normalize CPU/platform applicability before adding generation filters.",
  },
  {
    key: "ram",
    title: "RAM dependency logic",
    status: "partial",
    source_files: ["src/data/configurator.js", "src/lib/configuratorOptionFilters.js", "src/components/configurator/ConfiguratorFilterSwitches.jsx", "payload-cms/src/collections/RAMModules.ts", "payload-cms/src/collections/MemoryRules.ts", "payload-cms/src/lib/rulesEngine/facts.ts"],
    imported_count: 6,
    found: [
      "Legacy RAM options included 32GB/64GB RDIMM ECC and 128GB LRDIMM ECC at DDR4-2933.",
      "Configurator filters extracted memory speeds such as 2133, 2400, 2666, 2933, and 3200 from specs/text and rendered speed buttons.",
      "Rules facts calculated selectedRamTotalModules, selectedRamTotalGB, selectedRamSpeeds, selectedCpuMemorySpeedLimit.",
      "Legacy engine supported warnings when selected memory speed exceeds CPU memory speed.",
    ],
    current_medusa: [
      "Medusa service calculates cpu_max_memory_speed, ram_speed and effective_specs.ram_speed.",
      "Storefront now filters RAM by memory speed and hides RAM above the selected CPU memory-speed limit when that limit is present.",
      "An enabled normalized rule still blocks more than 12 DIMMs with one CPU.",
    ],
    missing: [
      "No explicit 3200-to-2933 downgrade warning in current active rule set.",
      "No persisted CPU-to-RAM compatibility matrix beyond inferred option specs.",
    ],
    recommended_next_action: "Normalize RAM speed downgrade rules after adding CPU-specific facts and test them in Rule Simulator.",
  },
  {
    key: "storage",
    title: "Storage hierarchy",
    status: "partial",
    source_files: ["src/data/configurator.js", "src/lib/configuratorOptionFilters.js", "src/pages/ConfiguratorPage.jsx", "src/lib/dl360StorageScenarios.js", "src/lib/configuratorBackplaneSync.js"],
    imported_count: 4,
    found: [
      "Legacy separated drive media into SATA/SAS/NVMe and drive classes HDD/SSD/NVMe U.2.",
      "ConfiguratorPage rendered Storage filter panels for drive kind All/HDD/SSD and interface All/SATA/SAS/NVMe.",
      "Storage scenarios distinguished 8SFF standard and 8SFF + Media Bay.",
      "Drive bay scenarios affected front bay count, supported interfaces and diagnostics.",
    ],
    current_medusa: [
      "Store API returns drive options and four DL360 model variants with front drive bay metadata.",
      "Storefront shows storage scenario cards from server models.",
      "Storefront now exposes safe storage filters for HDD, SSD, SATA, SAS and NVMe over the imported drive options.",
    ],
    missing: [
      "Backplane and media bay are currently collapsed into the backplane component type.",
    ],
    recommended_next_action: "Split logical grouping in options UI now; add first-class media_bay type after migration approval.",
  },
  {
    key: "backplane-media-bay",
    title: "Backplane vs MediaBay",
    status: "needs review",
    source_files: ["src/lib/dl360StorageScenarios.js", "payload-cms/src/lib/rules/dl360ExpansionOptionsSeed.ts", "src/lib/dl360StorageScenarios.test.js"],
    imported_count: 7,
    found: [
      "Legacy used driveBayOptions for base backplane/scenario and mediaBayOptions for optional expansion.",
      "Media Bay part numbers 867966-B21, 871242-B21, 867970-B21, and 868000-B21 had different provided bays/interfaces.",
      "Tests explicitly state that Media Bay options stay outside top-level scenario cards.",
    ],
    current_medusa: [
      "Imported expansion options are represented as type backplane with specs_json.media_bay=true for Media Bay rows.",
      "Storefront currently labels one group as Backplanes / Media Bay.",
    ],
    missing: [
      "No first-class media_bay component enum.",
      "No separate options API group layer for base backplane vs optional Media Bay.",
    ],
    recommended_next_action: "Use specs_json.media_bay for logical grouping in admin/storefront; plan media_bay enum migration separately.",
  },
  {
    key: "raid",
    title: "RAID placement logic",
    status: "needs review",
    source_files: ["src/data/configurator.js", "payload-cms/src/collections/RAIDControllers.ts", "payload-cms/src/lib/rules/dl360TestingRulesetSeed.ts"],
    imported_count: 3,
    found: [
      "Legacy local rows had HBA/software RAID, 12G SAS RAID 2GB cache, and 12G SAS RAID 8GB cache + BBU.",
      "Payload had a dedicated RAIDControllers collection for richer controller metadata.",
      "Legacy text referenced HPE Smart Array and Dell PERC class controllers.",
    ],
    current_medusa: [
      "RAID imports currently carry mostly text/interface notes in specs_json.",
    ],
    missing: [
      "No structured placement field embedded/pci/mezzanine/ocp.",
      "No vendor_platform split for HPE/Dell/Broadcom.",
      "No requires_cable/requires_riser fields normalized for RAID.",
    ],
    recommended_next_action: "Normalize RAID specs_json first; then consider schema fields if filtering/simulator needs database-level access.",
  },
  {
    key: "nic",
    title: "NIC capacity logic",
    status: "partial",
    source_files: ["payload-cms/src/lib/rules/dl360NicsSeed.ts", "payload-cms/src/lib/rulesEngine/facts.ts", "payload-cms/src/collections/NetworkCards.ts"],
    imported_count: 12,
    found: [
      "Legacy NIC seed carried ports, speedGbps, connector, interfaceType, height, requirements and verification warnings.",
      "Configurator filters separated embedded/NDC, FlexibleLOM and PCIe network options from option text/specs.",
      "Facts engine modeled serverSupportsOcp, serverSupportsFlexibleLom, availablePcieSlots, selectedPcieSlots and selectedRiserType.",
    ],
    current_medusa: [
      "NIC options import slot_type, connector, ports, speed and warnings in specs_json.",
      "Storefront now exposes safe network slot filters for Embedded, FlexibleLOM, OCP and PCIe where imported specs/text support them.",
    ],
    missing: [
      "No active facts for available_pcie_slots, used_pcie_slots, required_riser or max NIC count.",
      "No OCP/FlexibleLOM/embedded distinction in current component type.",
    ],
    recommended_next_action: "Add NIC fact extraction to Medusa service before enabling imported NIC draft rules.",
  },
  {
    key: "psu",
    title: "PSU selection and capacity logic",
    status: "partial",
    source_files: ["src/data/configurator.js", "payload-cms/src/lib/rules/dl360PsuCoolingSeed.ts", "payload-cms/src/lib/rulesEngine/facts.ts", "payload-cms/src/lib/rulesEngine/ruleCoverageReport.ts"],
    imported_count: 12,
    found: [
      "Legacy local configurator had PSU bundles such as 2x 800W Platinum, 2x 1100W Platinum and 2x 1600W Titanium.",
      "Payload QuickSpecs seed added individual HPE Flex Slot PSU SKUs with wattage, efficiency, input type, high-line requirements and source references.",
      "Rules facts calculated selectedPsu, PSU wattage/capacity signals and total selected component power for validation.",
    ],
    current_medusa: [
      "Medusa currently shows both legacy PSU bundles and individual QuickSpecs PSU rows, which creates visual near-duplicates.",
      "Storefront now deduplicates RAM/PSU display rows by normalized visible characteristics without deleting imported records.",
    ],
    missing: [
      "No canonical PSU grouping that separates bundle rows from single PSU SKU rows.",
      "No active PSU capacity rule tied to total CPU/RAM/drive/NIC/GPU estimated power.",
    ],
    recommended_next_action: "Normalize PSU source rows into bundle vs single-SKU groups before enabling capacity/high-line draft rules.",
  },
  {
    key: "gpu",
    title: "GPU logic",
    status: "missing",
    source_files: ["payload-cms/src/lib/rules/dl360GpuSeed.ts", "payload-cms/src/lib/rulesEngine/facts.ts"],
    imported_count: 0,
    found: [
      "Legacy engine had GPU facts for selectedGpuCount, power watts, required power cable SKUs, high-performance fan/heatsink kits and riser requirements.",
      "GPU productionReady was explicitly false in the legacy facts engine.",
    ],
    current_medusa: [
      "GPU rows and GPU draft rules are skipped because current Medusa component enum has no gpu type.",
    ],
    missing: [
      "No gpu component type, no GPU UI group, no active GPU facts.",
    ],
    recommended_next_action: "Keep GPU skipped until gpu type, accessories and simulator facts are approved as a separate migration.",
  },
]
