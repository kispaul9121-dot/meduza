const sourceDoc =
  "HPE QuickSpecs HPE ProLiant DL360 Gen10 Server; HPE ProLiant DL360 Gen10 server data sheet PSN1010007891WWEN"

export const defaultConfiguratorComponents = [
  { id: "default-cpu-xeon-gold-6130", type: "cpu", brand: "Intel", model: "Xeon Gold 6130", public_name: "Intel Xeon Gold 6130", short_name: "Gold 6130", price: 420, stock_qty: 8, enabled: true, specs_json: { cores: 16, threads: 32, base_clock: "2.1GHz", tdp: 125, max_memory_speed: 2666, socket: "LGA3647", generation: "1st", source_doc_reference: sourceDoc } },
  { id: "default-cpu-xeon-gold-6148", type: "cpu", brand: "Intel", model: "Xeon Gold 6148", public_name: "Intel Xeon Gold 6148", short_name: "Gold 6148", price: 760, stock_qty: 6, enabled: true, specs_json: { cores: 20, threads: 40, base_clock: "2.4GHz", tdp: 150, max_memory_speed: 2666, socket: "LGA3647", generation: "1st", source_doc_reference: sourceDoc } },
  { id: "default-cpu-xeon-silver-4110", type: "cpu", brand: "Intel", model: "Xeon Silver 4110", public_name: "Intel Xeon Silver 4110", short_name: "Silver 4110", price: 210, stock_qty: 10, enabled: true, specs_json: { cores: 8, threads: 16, base_clock: "2.1GHz", tdp: 85, max_memory_speed: 2400, socket: "LGA3647", generation: "1st", source_doc_reference: sourceDoc } },
  { id: "default-cpu-xeon-bronze-3106", type: "cpu", brand: "Intel", model: "Xeon Bronze 3106", public_name: "Intel Xeon Bronze 3106", short_name: "Bronze 3106", price: 140, stock_qty: 10, enabled: true, specs_json: { cores: 8, threads: 8, base_clock: "1.7GHz", tdp: 85, max_memory_speed: 2133, socket: "LGA3647", generation: "1st", source_doc_reference: sourceDoc } },

  { id: "default-ram-32-2133", type: "ram", brand: "HPE", model: "32GB DDR4 RDIMM ECC 2133", public_name: "32GB DDR4 RDIMM ECC 2133 MT/s", short_name: "32GB RDIMM 2133", price: 95, stock_qty: 48, enabled: true, specs_json: { capacity_gb: 32, type: "DDR4 RDIMM ECC", speed: 2133, source_doc_reference: sourceDoc } },
  { id: "default-ram-32-2400", type: "ram", brand: "HPE", model: "32GB DDR4 RDIMM ECC 2400", public_name: "32GB DDR4 RDIMM ECC 2400 MT/s", short_name: "32GB RDIMM 2400", price: 105, stock_qty: 48, enabled: true, specs_json: { capacity_gb: 32, type: "DDR4 RDIMM ECC", speed: 2400, source_doc_reference: sourceDoc } },
  { id: "default-ram-32-2666", type: "ram", brand: "HPE", model: "32GB DDR4 RDIMM ECC 2666", public_name: "32GB DDR4 RDIMM ECC 2666 MT/s", short_name: "32GB RDIMM 2666", price: 112, stock_qty: 48, enabled: true, specs_json: { capacity_gb: 32, type: "DDR4 RDIMM ECC", speed: 2666, source_doc_reference: sourceDoc } },
  { id: "default-ram-32-2933", type: "ram", brand: "HPE", model: "32GB DDR4 RDIMM ECC 2933", public_name: "32GB DDR4 RDIMM ECC 2933 MT/s", short_name: "32GB RDIMM 2933", price: 120, stock_qty: 48, enabled: true, specs_json: { capacity_gb: 32, type: "DDR4 RDIMM ECC", speed: 2933, source_doc_reference: sourceDoc } },

  { id: "default-raid-s100i", type: "raid", brand: "HPE", model: "Smart Array S100i SR Gen10", public_name: "HPE Smart Array S100i SR Gen10 Software RAID", short_name: "Smart Array S100i", price: 0, stock_qty: 20, enabled: true, specs_json: { interface: "SAS/SATA", cache: "none", controller_family: "Smart Array", source_doc_reference: sourceDoc } },
  { id: "default-raid-e208ia", type: "raid", brand: "HPE", model: "Smart Array E208i-a SR Gen10", public_name: "HPE Smart Array E208i-a SR Gen10", short_name: "Smart Array E208i-a", price: 165, stock_qty: 12, enabled: true, specs_json: { interface: "SAS/SATA", cache: "none", controller_family: "Smart Array", source_doc_reference: sourceDoc } },
  { id: "default-raid-p408ia", type: "raid", brand: "HPE", model: "Smart Array P408i-a SR Gen10", public_name: "HPE Smart Array P408i-a SR Gen10, 2GB cache", short_name: "Smart Array P408i-a", price: 280, stock_qty: 10, enabled: true, specs_json: { interface: "SAS/SATA", cache: "2GB", controller_family: "Smart Array", source_doc_reference: sourceDoc } },
  { id: "default-raid-p816ia", type: "raid", brand: "HPE", model: "Smart Array P816i-a SR Gen10", public_name: "HPE Smart Array P816i-a SR Gen10, 4GB cache + FBWC", short_name: "Smart Array P816i-a", price: 420, stock_qty: 6, enabled: true, specs_json: { interface: "SAS/SATA", cache: "4GB", battery: true, controller_family: "Smart Array", source_doc_reference: sourceDoc } },

  { id: "default-nic-intel-i350-t4", type: "nic", brand: "Intel", model: "Ethernet I350-T4 1Gb 4-port BASE-T", public_name: "Intel Ethernet I350-T4 1Gb 4-port BASE-T Adapter", short_name: "Intel I350-T4", price: 90, stock_qty: 12, enabled: true, specs_json: { vendor: "Intel", ports: 4, speed: "1GbE", connector: "RJ45", slot_type: "PCIe", height: "low_profile_or_full_height", max_quantity: 2, source_doc_reference: `${sourceDoc}; HPE Ethernet 1Gb 4-port 331T Adapter 647594-B21` } },
  { id: "default-nic-intel-x710-da2", type: "nic", brand: "Intel", model: "Ethernet X710-DA2 10Gb 2-port SFP+", public_name: "Intel Ethernet X710-DA2 10Gb 2-port SFP+ Adapter", short_name: "Intel X710-DA2", price: 180, stock_qty: 10, enabled: true, specs_json: { vendor: "Intel", ports: 2, speed: "10GbE", connector: "SFP+", slot_type: "PCIe", height: "low_profile_or_full_height", max_quantity: 2, source_doc_reference: `${sourceDoc}; HPE Ethernet 10Gb 2-port SFP+ adapter family` } },
  { id: "default-nic-broadcom-631flr", type: "nic", brand: "Broadcom", model: "BCM57414 631FLR-SFP28 10/25Gb 2-port", public_name: "Broadcom BCM57414 631FLR-SFP28 10/25Gb 2-port FlexibleLOM Adapter", short_name: "Broadcom 631FLR-SFP28", price: 260, stock_qty: 8, enabled: true, specs_json: { vendor: "Broadcom", ports: 2, speed: "10/25GbE", connector: "SFP28", slot_type: "FlexibleLOM", height: "flr", max_quantity: 1, part_number: "817709-B21", source_doc_reference: `${sourceDoc}; HPE Ethernet 10/25Gb 2-port 631FLR-SFP28 Adapter 817709-B21` } },
  { id: "default-nic-broadcom-631sfp28", type: "nic", brand: "Broadcom", model: "BCM57414 631SFP28 10/25Gb 2-port", public_name: "Broadcom BCM57414 631SFP28 10/25Gb 2-port PCIe Adapter", short_name: "Broadcom 631SFP28", price: 280, stock_qty: 8, enabled: true, specs_json: { vendor: "Broadcom", ports: 2, speed: "10/25GbE", connector: "SFP28", slot_type: "PCIe", height: "low_profile_or_full_height", max_quantity: 2, part_number: "817718-B21", source_doc_reference: `${sourceDoc}; HPE Ethernet 10/25Gb 2-port 631SFP28 Adapter 817718-B21` } },

  { id: "default-cooling-standard", type: "cooling", brand: "HPE", model: "Standard fan and heatsink kit", public_name: "Standard cooling bundle", short_name: "Standard cooling", price: 0, stock_qty: 20, enabled: true, specs_json: { cooling_tier: "standard", max_cpu_tdp: 125, source_doc_reference: sourceDoc } },
  { id: "default-cooling-performance", type: "cooling", brand: "HPE", model: "Performance fan and heatsink kit", public_name: "Performance cooling bundle", short_name: "Performance cooling", price: 180, stock_qty: 12, enabled: true, specs_json: { cooling_tier: "performance", min_cpu_tdp: 150, source_doc_reference: sourceDoc } },
]

function componentDisplayKey(component: any) {
  const specs = component.specs_json || {}
  if (component.type === "cpu") return `${component.type}:${component.model}`.toLowerCase()
  if (component.type === "ram") return `${component.type}:${specs.capacity_gb}:${specs.type}:${specs.speed}`.toLowerCase()
  if (component.type === "raid") return `${component.type}:${component.model}`.toLowerCase()
  if (component.type === "nic") return `${component.type}:${component.brand}:${component.model}`.toLowerCase()
  if (component.type === "cooling") return `${component.type}:${specs.cooling_tier || component.model}`.toLowerCase()
  return `${component.type}:${component.public_name}`.toLowerCase()
}

export function mergeDefaultComponents(components: any[]) {
  const seen = new Set(components.map(componentDisplayKey))
  const merged = [...components]
  for (const component of defaultConfiguratorComponents) {
    const key = componentDisplayKey(component)
    if (!seen.has(key)) {
      merged.push(component)
      seen.add(key)
    }
  }
  return merged
}

export function defaultComponentsById(ids: string[]) {
  const wanted = new Set(ids)
  return defaultConfiguratorComponents.filter((component) => wanted.has(component.id))
}
