const sourceDoc =
  "HPE QuickSpecs HPE ProLiant DL360 Gen10 Server; Payloud configurator annotations"

export const defaultHelpAnnotations = [
  {
    key: "configurator.cpu",
    page: "configurator",
    target_type: "group",
    component_type: "cpu",
    title: "Процессоры",
    body: "DL360 Gen10 поддерживает Intel Xeon Scalable 1st Gen и 2nd Gen для LGA3647. Выбор CPU задает TDP и максимальную частоту памяти: 1st Gen обычно до 2133/2400/2666 MT/s, 2nd Gen до 2400/2933 MT/s в зависимости от SKU.",
    placement: "right",
    icon: "cpu",
    severity: "info",
    sort_order: 20,
    enabled: true,
    source_doc_reference: sourceDoc,
  },
  {
    key: "configurator.cooling",
    page: "configurator",
    target_type: "group",
    component_type: "cooling",
    title: "Система охлаждения",
    body: "Охлаждение выбирается комплектом: fan kit + heatsink. Для CPU до 125W используется стандартный комплект, для CPU примерно от 150W и выше, а также для более плотных NVMe/front option конфигураций нужен performance-комплект.",
    placement: "right",
    icon: "fan",
    severity: "info",
    sort_order: 25,
    enabled: true,
    source_doc_reference: sourceDoc,
  },
  {
    key: "configurator.ram",
    page: "configurator",
    target_type: "group",
    component_type: "ram",
    title: "Память",
    body: "Память отфильтрована по частотам 2133, 2400, 2666 и 2933 MT/s. После выбора CPU можно выбрать память только на частоте, которую процессор поддерживает, или ниже; более высокая частота скрывается/отключается.",
    placement: "right",
    icon: "memory",
    severity: "info",
    sort_order: 30,
    enabled: true,
    source_doc_reference: sourceDoc,
  },
  {
    key: "configurator.drive",
    page: "configurator",
    target_type: "group",
    component_type: "drive",
    title: "Накопители",
    body: "Storage фильтруется в два шага: тип накопителя HDD/SSD и интерфейс SATA/SAS/NVMe. NVMe доступен только при соответствующем Media Bay/backplane/enablement path.",
    placement: "right",
    icon: "storage",
    severity: "info",
    sort_order: 40,
    enabled: true,
    source_doc_reference: sourceDoc,
  },
  {
    key: "configurator.raid",
    page: "configurator",
    target_type: "group",
    component_type: "raid",
    title: "RAID контроллер",
    body: "В список возвращены стандартные HPE Smart Array Gen10: S100i software RAID, E208i-a, P408i-a и P816i-a. Выбор разделен по типу контроллера, интерфейсу и кэшу/FBWC.",
    placement: "right",
    icon: "sliders",
    severity: "info",
    sort_order: 50,
    enabled: true,
    source_doc_reference: sourceDoc,
  },
  {
    key: "configurator.nic",
    page: "configurator",
    target_type: "group",
    component_type: "nic",
    title: "Сетевые карты",
    body: "DL360 Gen10 использует встроенную сеть/LOM и PCIe-слоты через riser. В конфигураторе можно выбрать несколько сетевых адаптеров; практический лимит для PCIe/FlexibleLOM зависит от riser и второго CPU, поэтому backend считает количество и типы слотов для проверки.",
    placement: "right",
    icon: "network",
    severity: "info",
    sort_order: 60,
    enabled: true,
    source_doc_reference: sourceDoc,
  },
  {
    key: "configurator.psu",
    page: "configurator",
    target_type: "group",
    component_type: "psu",
    title: "Блоки питания",
    body: "Показаны три понятных типа Flex Slot hot-plug PSU: 500W, 800W и 1600W. Название строки описывает один блок питания, а количество 1 или 2 выбирается только кнопками +/-.",
    placement: "right",
    icon: "power",
    severity: "info",
    sort_order: 70,
    enabled: true,
    source_doc_reference: sourceDoc,
  },
  {
    key: "configurator.backplane",
    page: "configurator",
    target_type: "group",
    component_type: "backplane",
    title: "Drive Bay / Media Bay",
    body: "Для 8SFF карточки базовый backplane обслуживает 8 SFF SAS/SATA. Media Bay является front option: +2 SFF SAS/SATA, +2 SFF NVMe, Dual uFF M.2 или DisplayPort/USB/Optical blank. 10SFF/4LFF остаются отдельными товарами со своими дефолтами.",
    placement: "right",
    icon: "storage",
    severity: "info",
    sort_order: 80,
    enabled: true,
    source_doc_reference: sourceDoc,
  },
  {
    key: "configurator.summary_health",
    page: "configurator",
    target_type: "summary",
    component_type: "summary",
    title: "Статус совместимости",
    body: "Статус рассчитывается backend Rules Engine по выбранным компонентам, включая CPU TDP, effective RAM speed, drive interface, NIC slot facts и расчетную нагрузку.",
    placement: "left",
    icon: "shield",
    severity: "info",
    sort_order: 90,
    enabled: true,
    source_doc_reference: sourceDoc,
  },
]

function annotationKey(annotation: any) {
  return `${annotation.page}:${annotation.target_type}:${annotation.component_type || annotation.key}`.toLowerCase()
}

export function mergeDefaultHelpAnnotations(annotations: any[]) {
  const merged = new Map<string, any>()
  for (const annotation of annotations) {
    merged.set(annotationKey(annotation), annotation)
  }
  for (const annotation of defaultHelpAnnotations) {
    merged.set(annotationKey(annotation), annotation)
  }
  return Array.from(merged.values()).sort((a, b) => Number(a.sort_order || 100) - Number(b.sort_order || 100))
}
