export const catalogFacetDefinitions = [
  { key: "price_range", label: "Цена", category: "Коммерческие" },
  { key: "availability", label: "Наличие", category: "Коммерческие" },
  { key: "condition", label: "Состояние", category: "Коммерческие" },
  { key: "brand", label: "Бренд", category: "Бренд / модель" },
  { key: "family", label: "Бренд / модель", category: "Бренд / модель" },
  { key: "generation", label: "Поколение", category: "Бренд / модель" },
  { key: "chassis_type", label: "Дисковые корзины", category: "Storage" },
  { key: "form_factor", label: "Форм-фактор", category: "Форм-фактор" },
  { key: "cpu_socket", label: "Сокет", category: "CPU" },
  { key: "max_cpu", label: "Количество CPU", category: "CPU" },
  { key: "cpu_family", label: "Семейство CPU", category: "CPU" },
  { key: "max_ram_capacity", label: "Максимальный объем RAM", category: "RAM" },
  { key: "supported_ram_types", label: "Тип RAM", category: "RAM" },
  { key: "ram_slots_total", label: "Количество слотов", category: "RAM" },
  { key: "supported_drive_interfaces", label: "Интерфейс дисков", category: "Storage" },
  { key: "gpu_support", label: "Поддержка GPU", category: "GPU" },
  { key: "gpu_qty", label: "Количество GPU", category: "GPU" },
  { key: "depth", label: "Глубина", category: "Physical" },
  { key: "warranty", label: "Гарантия", category: "Коммерческие" },
  { key: "delivery", label: "Доставка", category: "Коммерческие" },
]

export function modelFacetValues(model: any, key: string) {
  if (key === "price_range") return ["Под проект"]
  if (key === "availability") return ["В наличии"]
  if (key === "condition") return ["Восстановленный"]
  if (key === "cpu_family") return ["Intel Xeon Scalable"]
  if (key === "gpu_support") return ["Опционально через PCIe riser"]
  if (key === "gpu_qty") return ["0-1"]
  if (key === "depth") return ["~70 см"]
  if (key === "warranty") return ["1 год"]
  if (key === "delivery") return ["Москва и регионы", "СДЭК"]

  const value = model[key]
  const values = Array.isArray(value) ? value : [value]
  return values.filter((item) => item !== undefined && item !== null && item !== "").map(String)
}

export function modelFacetsJson(model: any) {
  return Object.fromEntries(
    catalogFacetDefinitions.map((definition) => [
      definition.key,
      modelFacetValues(model, definition.key),
    ])
  )
}

export function decorateModelWithFacets(model: any) {
  return {
    ...model,
    facets_json: modelFacetsJson(model),
  }
}
