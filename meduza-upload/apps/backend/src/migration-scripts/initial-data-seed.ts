import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  createStockLocationsWorkflow,
} from "@medusajs/medusa/core-flows"
import { SERVER_CONFIGURATOR_MODULE } from "../modules/server-configurator"

const sourceDoc =
  "HPE QuickSpecs HPE ProLiant DL360 Gen10 Server; HPE ProLiant DL360 Gen10 server data sheet PSN1010007891WWEN"

const hpeModels = [
  {
    title: "HPE ProLiant DL360 Gen10 8SFF",
    slug: "hpe-proliant-dl360-gen10-8sff",
    chassis_type: "8SFF",
    drive_bays_front: 8,
    drive_bays_rear: 0,
    drive_form_factor: "2.5",
    supported_drive_interfaces: ["SAS", "SATA"],
    front_option_type: null,
    backplane_type: "SAS/SATA",
    base_price: 2850,
    description:
      "1U HPE ProLiant DL360 Gen10 platform with 8 front SFF SAS/SATA bays for dense B2B server builds.",
  },
  {
    title: "HPE ProLiant DL360 Gen10 8SFF + Front Drive Option",
    slug: "hpe-proliant-dl360-gen10-8sff-front-drive-option",
    chassis_type: "8SFF + Front Drive Option",
    drive_bays_front: 10,
    drive_bays_rear: 0,
    drive_form_factor: "2.5",
    supported_drive_interfaces: ["SAS", "SATA", "NVMe"],
    front_option_type: "+2 SFF / 2 NVMe front option",
    backplane_type: "SAS/SATA + NVMe option",
    base_price: 3275,
    description:
      "DL360 Gen10 8SFF chassis with front drive expansion option for additional SFF or NVMe storage.",
  },
  {
    title: "HPE ProLiant DL360 Gen10 10SFF NVMe Premium",
    slug: "hpe-proliant-dl360-gen10-10sff-nvme-premium",
    chassis_type: "10SFF NVMe Premium",
    drive_bays_front: 10,
    drive_bays_rear: 0,
    drive_form_factor: "2.5",
    supported_drive_interfaces: ["NVMe", "SAS", "SATA"],
    front_option_type: "Premium 10SFF NVMe",
    backplane_type: "NVMe",
    base_price: 3950,
    description:
      "Premium 10SFF NVMe DL360 Gen10 chassis with NVMe-oriented storage logic and SAS/SATA mix support.",
  },
  {
    title: "HPE ProLiant DL360 Gen10 4LFF",
    slug: "hpe-proliant-dl360-gen10-4lff",
    chassis_type: "4LFF",
    drive_bays_front: 4,
    drive_bays_rear: 0,
    drive_form_factor: "3.5",
    supported_drive_interfaces: ["SAS", "SATA"],
    front_option_type: null,
    backplane_type: "SAS/SATA",
    base_price: 3050,
    description:
      "DL360 Gen10 4LFF chassis for 3.5 inch SAS/SATA capacity-oriented storage configurations.",
  },
]

const components = [
  { type: "cpu", brand: "Intel", model: "Xeon Gold 6248R", public_name: "Intel Xeon Gold 6248R", short_name: "Gold 6248R", price: 980, stock_qty: 6, specs_json: { cores: 24, threads: 48, base_clock: "3.0GHz", tdp: 205, max_memory_speed: 2933, socket: "LGA3647" } },
  { type: "cpu", brand: "Intel", model: "Xeon Gold 6230", public_name: "Intel Xeon Gold 6230", short_name: "Gold 6230", price: 620, stock_qty: 8, specs_json: { cores: 20, threads: 40, base_clock: "2.1GHz", tdp: 125, max_memory_speed: 2933, socket: "LGA3647" } },
  { type: "cpu", brand: "Intel", model: "Xeon Silver 4210", public_name: "Intel Xeon Silver 4210", short_name: "Silver 4210", price: 320, stock_qty: 10, specs_json: { cores: 10, threads: 20, base_clock: "2.2GHz", tdp: 85, max_memory_speed: 2400, socket: "LGA3647" } },
  { type: "ram", brand: "HPE", model: "32GB DDR4 RDIMM ECC 2933", public_name: "32GB DDR4 RDIMM ECC 2933 MT/s", short_name: "32GB RDIMM 2933", price: 120, stock_qty: 64, specs_json: { capacity_gb: 32, type: "DDR4 RDIMM ECC", speed: 2933 } },
  { type: "ram", brand: "HPE", model: "32GB DDR4 RDIMM ECC 3200", public_name: "32GB DDR4 RDIMM ECC 3200 MT/s", short_name: "32GB RDIMM 3200", price: 135, stock_qty: 64, specs_json: { capacity_gb: 32, type: "DDR4 RDIMM ECC", speed: 3200 } },
  { type: "ram", brand: "HPE", model: "64GB DDR4 RDIMM ECC 2933", public_name: "64GB DDR4 RDIMM ECC 2933 MT/s", short_name: "64GB RDIMM 2933", price: 240, stock_qty: 32, specs_json: { capacity_gb: 64, type: "DDR4 RDIMM ECC", speed: 2933 } },
  { type: "drive", brand: "HPE", model: "960GB SATA/SAS SSD 2.5", public_name: "960GB SATA/SAS SSD 2.5 inch", short_name: "960GB SFF SSD", price: 155, stock_qty: 30, specs_json: { capacity: "960GB", interface: "SATA", form_factor: "2.5" } },
  { type: "drive", brand: "HPE", model: "1.92TB SATA/SAS SSD 2.5", public_name: "1.92TB SATA/SAS SSD 2.5 inch", short_name: "1.92TB SFF SSD", price: 260, stock_qty: 30, specs_json: { capacity: "1.92TB", interface: "SAS", form_factor: "2.5" } },
  { type: "drive", brand: "HPE", model: "960GB NVMe U.2 2.5", public_name: "960GB NVMe U.2 2.5 inch", short_name: "960GB U.2 NVMe", price: 295, stock_qty: 20, specs_json: { capacity: "960GB", interface: "NVMe", form_factor: "2.5" } },
  { type: "drive", brand: "HPE", model: "2TB LFF SATA HDD 3.5", public_name: "2TB LFF SATA HDD 3.5 inch", short_name: "2TB LFF HDD", price: 95, stock_qty: 40, specs_json: { capacity: "2TB", interface: "SATA", form_factor: "3.5" } },
  { type: "drive", brand: "HPE", model: "4TB LFF SATA HDD 3.5", public_name: "4TB LFF SATA HDD 3.5 inch", short_name: "4TB LFF HDD", price: 140, stock_qty: 40, specs_json: { capacity: "4TB", interface: "SATA", form_factor: "3.5" } },
  { type: "raid", brand: "HPE", model: "Smart Array compatible controller placeholder", public_name: "HPE Smart Array compatible controller placeholder", short_name: "Smart Array RAID", price: 280, stock_qty: 10, specs_json: { interface: "SAS/SATA", cache: "optional" } },
  { type: "raid", brand: "Broadcom", model: "MegaRAID 9440-8i placeholder", public_name: "Broadcom MegaRAID 9440-8i placeholder", short_name: "MegaRAID 9440-8i", price: 235, stock_qty: 10, specs_json: { interface: "SAS/SATA" } },
  { type: "nic", brand: "Intel", model: "2x10GbE SFP+", public_name: "Intel NIC 2x10GbE SFP+", short_name: "2x10GbE SFP+", price: 180, stock_qty: 14, specs_json: { ports: 2, speed: "10GbE", connector: "SFP+" } },
  { type: "nic", brand: "Intel", model: "4x1GbE RJ45", public_name: "Intel NIC 4x1GbE RJ45", short_name: "4x1GbE RJ45", price: 90, stock_qty: 18, specs_json: { ports: 4, speed: "1GbE", connector: "RJ45" } },
  { type: "nic", brand: "Intel", model: "2x25GbE SFP28", public_name: "Intel NIC 2x25GbE SFP28", short_name: "2x25GbE SFP28", price: 340, stock_qty: 8, specs_json: { ports: 2, speed: "25GbE", connector: "SFP28" } },
  { type: "psu", brand: "HPE", model: "500W Hot Plug PSU", public_name: "500W Hot Plug PSU", short_name: "500W PSU", price: 120, stock_qty: 20, specs_json: { wattage: 500 } },
  { type: "psu", brand: "HPE", model: "800W Hot Plug PSU", public_name: "800W Hot Plug PSU", short_name: "800W PSU", price: 165, stock_qty: 20, specs_json: { wattage: 800 } },
  { type: "psu", brand: "HPE", model: "1600W Hot Plug PSU", public_name: "1600W Hot Plug PSU", short_name: "1600W PSU", price: 290, stock_qty: 10, specs_json: { wattage: 1600 } },
  { type: "rails", brand: "HPE", model: "Sliding Rail Kit", public_name: "Sliding Rail Kit", short_name: "Rails", price: 85, stock_qty: 20, specs_json: {} },
  { type: "cable", brand: "HPE", model: "Cable Kit", public_name: "Cable Kit", short_name: "Cable Kit", price: 45, stock_qty: 20, specs_json: {} },
  { type: "cooling", brand: "HPE", model: "High Performance Fan Kit", public_name: "High Performance Fan Kit", short_name: "HP Fan Kit", price: 180, stock_qty: 12, specs_json: {} },
  { type: "backplane", brand: "HPE", model: "Rear Drive Kit", public_name: "Rear Drive Kit", short_name: "Rear Drive Kit", price: 220, stock_qty: 8, specs_json: {} },
  { type: "backplane", brand: "HPE", model: "NVMe Enablement Kit", public_name: "NVMe Enablement Kit", short_name: "NVMe Kit", price: 260, stock_qty: 8, specs_json: { interface: "NVMe" } },
]

const rulePresets = [
  "1 CPU max RAM modules",
  "2 CPU max RAM modules",
  "CPU limits RAM speed",
  "NVMe requires NVMe backplane",
  "RAID requires cable kit",
  "Chassis limits drive form factor",
  "PSU minimum wattage",
  "High performance fan requirement",
  "Rear drive option requirement",
  "Riser required by NIC/GPU",
]

const helpAnnotations = [
  {
    key: "configurator.storage_scenario",
    page: "configurator",
    target_type: "group",
    component_type: "storage_scenario",
    title: "Сценарий корзины",
    body: "В этом конфигураторе доступны только варианты текущего DL360 шаблона. Сценарий определяет корзину, backplane и доступные типы накопителей.",
    placement: "right",
    icon: "info",
    sort_order: 10,
    source_doc_reference: "Payloud 2 / Dl360StorageScenarioCards.jsx",
  },
  {
    key: "configurator.cpu",
    page: "configurator",
    target_type: "group",
    component_type: "cpu",
    title: "Процессоры",
    body: "Выбор CPU влияет на количество доступных DIMM-слотов, частоту памяти и расчет нагрузки на блоки питания.",
    placement: "right",
    icon: "cpu",
    sort_order: 20,
    source_doc_reference: "Payloud 2 / groupInfoText cpu",
  },
  {
    key: "configurator.ram",
    page: "configurator",
    target_type: "group",
    component_type: "ram",
    title: "Память",
    body: "Для одного CPU доступно до 12 модулей, для двух CPU до 24. Effective speed рассчитывается правилами совместимости.",
    placement: "right",
    icon: "memory",
    sort_order: 30,
    source_doc_reference: "HPE QuickSpecs / Memory section",
  },
  {
    key: "configurator.drive",
    page: "configurator",
    target_type: "group",
    component_type: "drive",
    title: "Накопители",
    body: "Показываются только накопители, совместимые с форм-фактором корзины и выбранным интерфейсом SAS/SATA/NVMe.",
    placement: "right",
    icon: "storage",
    sort_order: 40,
    source_doc_reference: "HPE QuickSpecs / Chassis Types",
  },
  {
    key: "configurator.raid",
    page: "configurator",
    target_type: "group",
    component_type: "raid",
    title: "RAID контроллер",
    body: "RAID и кабельные комплекты должны соответствовать типу backplane. Несовместимые сочетания отмечаются Rules Engine.",
    placement: "right",
    icon: "sliders",
    sort_order: 50,
    source_doc_reference: "Payloud 2 / ConfiguratorOptionRow diagnostics",
  },
  {
    key: "configurator.nic",
    page: "configurator",
    target_type: "group",
    component_type: "nic",
    title: "Сетевые карты",
    body: "Проверяйте доступность PCIe/OCP слотов и требования к riser перед добавлением высокоскоростных адаптеров.",
    placement: "right",
    icon: "network",
    sort_order: 60,
    source_doc_reference: "Payloud 2 / ConfiguratorOptionRow diagnostics",
  },
  {
    key: "configurator.psu",
    page: "configurator",
    target_type: "group",
    component_type: "psu",
    title: "Блоки питания",
    body: "Панель совместимости предупреждает, если расчетная нагрузка требует большего запаса по мощности.",
    placement: "right",
    icon: "power",
    sort_order: 70,
    source_doc_reference: "HPE QuickSpecs / Power supply section",
  },
  {
    key: "configurator.backplane",
    page: "configurator",
    target_type: "group",
    component_type: "backplane",
    title: "Опции корзины",
    body: "NVMe накопители требуют NVMe backplane или enablement kit. Front/rear drive kits меняют доступные сценарии хранения.",
    placement: "right",
    icon: "storage",
    sort_order: 80,
    source_doc_reference: "HPE QuickSpecs / Chassis Types",
  },
  {
    key: "configurator.summary_health",
    page: "configurator",
    target_type: "summary",
    component_type: "summary",
    title: "Статус совместимости",
    body: "Зеленый статус означает, что блокирующих ошибок нет. Предупреждения и ошибки формируются backend Rules Engine на основе выбранных компонентов.",
    placement: "left",
    icon: "shield",
    sort_order: 90,
    source_doc_reference: "Payloud 2 / ConfiguratorSummaryPanel.jsx",
  },
  {
    key: "catalog.filters",
    page: "catalog",
    target_type: "filters",
    component_type: "filters",
    title: "Все фильтры",
    body: "Фильтры строятся по данным Medusa server_model: бренд, поколение, форм-фактор, корзина, интерфейсы, CPU socket, память и PSU.",
    placement: "top",
    icon: "sliders",
    sort_order: 100,
    source_doc_reference: "Payloud 2 / catalog filters",
  },
  {
    key: "header.catalog_menu",
    page: "global",
    target_type: "navigation",
    component_type: "catalog_menu",
    title: "Меню каталога",
    body: "Каталог в шапке перенесен из Payloud и заполняется моделями, доступными в Medusa backend.",
    placement: "bottom",
    icon: "menu",
    sort_order: 110,
    source_doc_reference: "Payloud 2 / HeaderCatalogDropdown.jsx",
  },
]

export default async function initialDataSeed({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(ModuleRegistrationName.FULFILLMENT)
  const configurator = container.resolve(SERVER_CONFIGURATOR_MODULE) as any

  logger.info("Seeding Payloud server ecommerce data...")

  const { result: [salesChannel] } = await createSalesChannelsWorkflow(container).run({
    input: { salesChannelsData: [{ name: "B2B Server Store", description: "Payloud server sales channel" }] },
  })
  const { result: [apiKey] } = await createApiKeysWorkflow(container).run({
    input: { api_keys: [{ title: "Payloud Storefront Publishable Key", type: "publishable", created_by: "" }] },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: apiKey.id, add: [salesChannel.id] } })
  logger.info(`Publishable API key token: ${apiKey.token}`)

  await createStoresWorkflow(container).run({
    input: {
      stores: [{
        name: "Payloud",
        supported_currencies: [{ currency_code: "usd", is_default: true }, { currency_code: "eur", is_default: false }],
        default_sales_channel_id: salesChannel.id,
      }],
    },
  })

  const { result: [region] } = await createRegionsWorkflow(container).run({
    input: { regions: [{ name: "Global B2B", currency_code: "usd", countries: ["dk", "de", "fr", "it", "es", "se", "gb"], payment_providers: ["pp_system_default"] }] },
  })
  await createTaxRegionsWorkflow(container).run({
    input: ["dk", "de", "fr", "it", "es", "se", "gb"].map((country_code) => ({ country_code, provider_id: "tp_system" })),
  })

  const { result: [stockLocation] } = await createStockLocationsWorkflow(container).run({
    input: { locations: [{ name: "Moscow Integration Warehouse", address: { city: "Moscow", country_code: "DK", address_1: "" } }] },
  })
  await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id }, [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" } })
  const { data: shippingProfiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const shippingProfile = shippingProfiles[0]
  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "B2B server delivery",
    type: "shipping",
    service_zones: [{ name: "Global", geo_zones: ["dk", "de", "fr", "it", "es", "se", "gb"].map((country_code) => ({ country_code, type: "country" as const })) }],
  })
  await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id }, [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id } })
  await createShippingOptionsWorkflow(container).run({
    input: [{
      name: "B2B freight quote",
      price_type: "flat",
      provider_id: "manual_manual",
      service_zone_id: fulfillmentSet.service_zones[0].id,
      shipping_profile_id: shippingProfile.id,
      type: { label: "Freight", description: "Server freight quoted by manager.", code: "freight" },
      prices: [{ currency_code: "usd", amount: 0 }, { currency_code: "usd", region_id: region.id, amount: 0 }],
      rules: [{ attribute: "enabled_in_store", value: "true", operator: "eq" }, { attribute: "is_return", value: "false", operator: "eq" }],
    }],
  })
  await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: stockLocation.id, add: [salesChannel.id] } })

  const { result: [category] } = await createProductCategoriesWorkflow(container).run({
    input: { product_categories: [{ name: "Servers", is_active: true, handle: "servers" }] },
  })
  const { result: [chassisOption] } = await createProductOptionsWorkflow(container).run({
    input: { product_options: [{ title: "Chassis", values: hpeModels.map((item) => item.chassis_type) }] },
  })
  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      products: hpeModels.map((item) => ({
        title: item.title,
        handle: item.slug,
        description: item.description,
        status: ProductStatus.PUBLISHED,
        category_ids: [category.id],
        shipping_profile_id: shippingProfile.id,
        metadata: {
          server_configurator: true,
          chassis_type: item.chassis_type,
          source_doc_reference: sourceDoc,
        },
        options: [{ id: chassisOption.id }],
        variants: [{
          title: `${item.chassis_type} base configuration`,
          sku: item.slug.toUpperCase().replace(/-/g, "_"),
          options: { Chassis: item.chassis_type },
          prices: [{ amount: item.base_price, currency_code: "usd" }, { currency_code: "usd", region_id: region.id, amount: item.base_price }],
          manage_inventory: true,
        }],
        sales_channels: [{ id: salesChannel.id }],
      })),
    },
  })

  const productByHandle = new Map(products.map((product: any) => [product.handle, product]))
  await configurator.createServerModels(hpeModels.map((item) => {
    const product = productByHandle.get(item.slug) as any
    return {
      medusa_product_id: product?.id,
      medusa_variant_id: product?.variants?.[0]?.id,
      brand: "HPE",
      family: "ProLiant DL360",
      generation: "Gen10",
      model: "DL360",
      public_name: item.title,
      slug: item.slug,
      form_factor: "1U",
      chassis_type: item.chassis_type,
      drive_bays_front: item.drive_bays_front,
      drive_bays_rear: item.drive_bays_rear,
      drive_form_factor: item.drive_form_factor,
      supported_drive_interfaces: item.supported_drive_interfaces,
      front_option_type: item.front_option_type,
      backplane_type: item.backplane_type,
      cpu_socket: "Intel LGA3647",
      max_cpu: 2,
      ram_slots_total: 24,
      ram_slots_per_cpu: 12,
      max_ram_capacity: "3.0 TB",
      supported_ram_types: ["DDR4 RDIMM ECC", "DDR4 LRDIMM ECC"],
      supported_ram_speeds: ["2400", "2666", "2933"],
      psu_type: "HPE hot plug",
      cooling_profile: item.chassis_type.includes("NVMe") ? "High Performance" : "Standard",
      seo_title: `${item.title} configurator`,
      seo_description: `${item.title} chassis/storage variant with server configuration, compatibility validation and B2B pricing.`,
      source_doc_reference: sourceDoc,
      enabled: true,
    }
  }))
  await configurator.createComponents(components.map((component) => ({ ...component, cost: Number(component.price) * 0.72, enabled: true })))
  await configurator.createRulePresets(rulePresets.map((name) => ({
    name,
    category: name.split(" ")[0].toLowerCase(),
    description: `${name} visual preset`,
    conditions_template_json: {},
    action_template_json: {},
    enabled: true,
  })))
  await configurator.createHelpAnnotations(helpAnnotations.map((annotation) => ({
    ...annotation,
    server_model_slug: null,
    enabled: true,
    severity: "info",
    metadata_json: {},
  })))
  await configurator.createCompatibilityRules([
    { name: "HPE Gen10 / 1 CPU max DIMM", enabled: true, priority: 10, scope_type: "generation", scope_value: "Gen10", category: "ram", rule_type: "limit", conditions_json: { fact: "cpu_qty", operator: "equals", value: 1 }, action_json: { set_limit: { fact: "ram_modules", max: 12 } }, message: "При одном процессоре доступно максимум 12 модулей памяти.", admin_note: "DIMM slots are split by CPU population.", source_doc_reference: "HPE QuickSpecs / Memory section", version: "1" },
    { name: "HPE Gen10 / 2 CPU max DIMM", enabled: true, priority: 20, scope_type: "generation", scope_value: "Gen10", category: "ram", rule_type: "limit", conditions_json: { fact: "cpu_qty", operator: "equals", value: 2 }, action_json: { set_limit: { fact: "ram_modules", max: 24 } }, message: "При двух процессорах доступны все 24 DIMM слота.", admin_note: "2P memory topology.", source_doc_reference: "HPE QuickSpecs / Memory section", version: "1" },
    { name: "CPU limits RAM speed", enabled: true, priority: 30, scope_type: "generation", scope_value: "Gen10", category: "ram", rule_type: "warning", conditions_json: { fact: "ram_speed", operator: "greater_than", value: 2933 }, action_json: { warning: "Частота памяти будет ограничена процессором.", set_effective_value: { field: "effective_ram_speed", value_from_fact: "cpu_max_memory_speed" } }, message: "Частота памяти будет ограничена процессором.", admin_note: "CPU memory controller cap.", source_doc_reference: "HPE QuickSpecs / Memory speed notes", version: "1" },
    { name: "NVMe requires NVMe backplane", enabled: true, priority: 40, scope_type: "generation", scope_value: "Gen10", category: "storage", rule_type: "block", conditions_json: { and: [{ fact: "selected_drive_interface", operator: "equals", value: "NVMe" }, { fact: "backplane_type", operator: "not_equals", value: "NVMe" }] }, action_json: { block: true }, message: "NVMe накопители требуют NVMe backplane или NVMe enablement option.", admin_note: "Storage backplane compatibility.", source_doc_reference: "HPE QuickSpecs / Chassis Types", version: "1" },
    { name: "4LFF chassis limits drive form factor", enabled: true, priority: 50, scope_type: "chassis_variant", scope_value: "4LFF", category: "storage", rule_type: "block", conditions_json: { fact: "drive_form_factor", operator: "not_equals", value: "3.5" }, action_json: { block: true }, message: "4LFF chassis поддерживает 3.5 inch накопители.", admin_note: "LFF bay physical limit.", source_doc_reference: "HPE QuickSpecs / Chassis Types", version: "1" },
    { name: "10SFF NVMe Premium requires NVMe storage logic", enabled: true, priority: 60, scope_type: "server_model", scope_value: "hpe-proliant-dl360-gen10-10sff-nvme-premium", category: "storage", rule_type: "warning", conditions_json: { fact: "storage_interfaces", operator: "includes", value: "NVMe" }, action_json: { warning: "Premium 10SFF NVMe chassis should be configured with NVMe-compatible storage logic." }, message: "Premium 10SFF NVMe chassis should use NVMe-compatible storage logic.", admin_note: "NVMe premium positioning.", source_doc_reference: "HPE QuickSpecs / Premium 10SFF NVMe Front View", version: "1" },
    { name: "PSU minimum wattage", enabled: true, priority: 70, scope_type: "global", scope_value: null, category: "psu", rule_type: "warning", conditions_json: { fact: "total_estimated_power", operator: "greater_than", value: 375 }, action_json: { warning: "Проверьте запас мощности PSU: расчетная нагрузка превышает 75% от 500W." }, message: "Проверьте запас мощности PSU для выбранной конфигурации.", admin_note: "Simple power budget warning.", source_doc_reference: "HPE QuickSpecs / Power supply section", version: "1" },
  ])

  const { data: inventoryItems } = await query.graph({ entity: "inventory_item", fields: ["id"] })
  await createInventoryLevelsWorkflow(container).run({
    input: { inventory_levels: inventoryItems.map((item) => ({ location_id: stockLocation.id, stocked_quantity: 25, inventory_item_id: item.id })) },
  })

  logger.info("Finished seeding Payloud server ecommerce data.")
}
