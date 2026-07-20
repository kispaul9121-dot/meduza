"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { CatalogFacet, HelpAnnotation, ServerModel } from "@lib/server-configurator/data"
import { BarChart3, Heart, RotateCcw, ShoppingCart, SlidersHorizontal, X } from "lucide-react"
import { HelpPopover } from "./help-popover"
import { ConfiguredServerCartView } from "./cart-view"
import { useServerLocalActions } from "./local-actions"
import { ServerProductCard } from "./product-card"

type SelectedFilters = Record<string, string[]>
type FilterGroup = { label: string; key: string; category: string }

const filterGroups: FilterGroup[] = [
  { label: "Цена", key: "price_range", category: "Коммерческие" },
  { label: "Наличие", key: "availability", category: "Коммерческие" },
  { label: "Состояние", key: "condition", category: "Коммерческие" },
  { label: "Бренд", key: "brand", category: "Бренд / модель" },
  { label: "Бренд / модель", key: "family", category: "Бренд / модель" },
  { label: "Поколение", key: "generation", category: "Бренд / модель" },
  { label: "Дисковые корзины", key: "chassis_type", category: "Storage" },
  { label: "Форм-фактор", key: "form_factor", category: "Форм-фактор" },
  { label: "Сокет", key: "cpu_socket", category: "CPU" },
  { label: "Количество CPU", key: "max_cpu", category: "CPU" },
  { label: "Семейство CPU", key: "cpu_family", category: "CPU" },
  { label: "Максимальный объем RAM", key: "max_ram_capacity", category: "RAM" },
  { label: "Тип RAM", key: "supported_ram_types", category: "RAM" },
  { label: "Количество слотов", key: "ram_slots_total", category: "RAM" },
  { label: "Интерфейс дисков", key: "supported_drive_interfaces", category: "Storage" },
  { label: "Поддержка GPU", key: "gpu_support", category: "GPU" },
  { label: "Количество GPU", key: "gpu_qty", category: "GPU" },
  { label: "Глубина", key: "depth", category: "Physical" },
  { label: "Гарантия", key: "warranty", category: "Коммерческие" },
  { label: "Доставка", key: "delivery", category: "Коммерческие" },
]

function modelValues(model: ServerModel, key: string) {
  const facetValues = model.facets_json?.[key]
  if (facetValues?.length) return facetValues
  const value = (model as any)[key]
  const values = Array.isArray(value) ? value : [value]
  return values.filter(Boolean).map(String)
}

function valuesFor(models: ServerModel[], facets: CatalogFacet[], key: string) {
  const facet = facets.find((item) => item.key === key)
  if (facet?.values?.length) return facet.values.map((item) => item.value)
  return Array.from(new Set(models.flatMap((model) => modelValues(model, key)))).filter(Boolean)
}

function matches(model: ServerModel, selected: SelectedFilters) {
  return Object.entries(selected).every(([key, values]) => {
    if (!values.length) return true
    const modelValueSet = modelValues(model, key)
    return values.some((value) => modelValueSet.includes(value))
  })
}

function countFor(models: ServerModel[], selected: SelectedFilters, key: string, value: string) {
  return models.filter((model) => matches(model, { ...selected, [key]: [value] })).length
}

function toggleValue(selected: SelectedFilters, key: string, value: string) {
  const values = selected[key] || []
  return {
    ...selected,
    [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
  }
}

function compactSelection(selected: SelectedFilters) {
  return Object.fromEntries(Object.entries(selected).filter(([, values]) => values.length)) as SelectedFilters
}

function CollectionEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="server-empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
      <Link className="server-primary" href="/servers">Перейти в каталог</Link>
    </div>
  )
}

function FavoritesPage({ models }: { models: ServerModel[] }) {
  const actions = useServerLocalActions()
  const favoriteModels = actions.collections.favorites
    .map((id) => models.find((model) => model.slug === id))
    .filter(Boolean) as ServerModel[]

  return (
    <section className="server-collection-page">
      <div className="server-catalog-toolbar">
        <div>
          <h1>Избранное</h1>
          <p>{favoriteModels.length} сохранено для быстрого возврата</p>
        </div>
      </div>
      {!favoriteModels.length ? (
        <CollectionEmpty title="Избранное пусто" text="Добавьте серверы через кнопку с сердцем на карточке или в конфигураторе." />
      ) : (
        <div className="server-product-grid">
          {favoriteModels.map((model) => <ServerProductCard model={model} key={model.slug} />)}
        </div>
      )}
    </section>
  )
}

function ComparePage({ models }: { models: ServerModel[] }) {
  const actions = useServerLocalActions()
  const compareModels = actions.collections.compare
    .map((id) => models.find((model) => model.slug === id))
    .filter(Boolean) as ServerModel[]
  const rows = [
    ["Корзина", (model: ServerModel) => model.chassis_type],
    ["Отсеки", (model: ServerModel) => String(model.drive_bays_front)],
    ["Интерфейсы", (model: ServerModel) => model.supported_drive_interfaces.join(" / ")],
    ["CPU", (model: ServerModel) => `${model.cpu_socket}, до ${model.max_cpu}`],
    ["Память", (model: ServerModel) => `${model.ram_slots_total} DIMM, до ${model.max_ram_capacity}`],
    ["PSU", (model: ServerModel) => model.psu_type],
  ] as const

  return (
    <section className="server-collection-page">
      <div className="server-catalog-toolbar">
        <div>
          <h1>Сравнение</h1>
          <p>{compareModels.length} серверов в сравнении</p>
        </div>
      </div>
      {compareModels.length < 1 ? (
        <CollectionEmpty title="Сравнение пустое" text="Добавьте серверы через кнопку сравнения на карточке товара." />
      ) : (
        <div className="server-compare-table-wrap">
          <table className="server-compare-table">
            <thead>
              <tr>
                <th>Параметр</th>
                {compareModels.map((model) => (
                  <th key={model.slug}>
                    <Link href={`/servers/${model.slug}`}>{model.public_name}</Link>
                    <button type="button" onClick={() => actions.removeCompare(model.slug)}>Убрать</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, read]) => (
                <tr key={label}>
                  <td>{label}</td>
                  {compareModels.map((model) => <td key={`${label}-${model.slug}`}>{read(model)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function ServerCatalogClient({
  annotations = [],
  facets = [],
  models,
}: {
  annotations?: HelpAnnotation[]
  facets?: CatalogFacet[]
  models: ServerModel[]
}) {
  const searchParams = useSearchParams()
  const view = searchParams.get("view")
  const [selected, setSelected] = useState<SelectedFilters>({})
  const [draftSelected, setDraftSelected] = useState<SelectedFilters>({})
  const [allFiltersOpen, setAllFiltersOpen] = useState(false)
  const [expandedFilter, setExpandedFilter] = useState<string | null>("price_range")
  const filtered = useMemo(() => models.filter((model) => matches(model, selected)), [models, selected])
  const draftFilteredCount = useMemo(() => models.filter((model) => matches(model, draftSelected)).length, [models, draftSelected])
  const activeCount = Object.values(selected).reduce((sum, values) => sum + values.length, 0)
  const draftActiveCount = Object.values(draftSelected).reduce((sum, values) => sum + values.length, 0)
  const filterHelp = annotations.find((item) => item.key === "catalog.filters")

  if (view === "favorites") return <FavoritesPage models={models} />
  if (view === "compare") return <ComparePage models={models} />
  if (view === "cart") return <ConfiguredServerCartView />

  const openAllFilters = () => {
    setDraftSelected(selected)
    setAllFiltersOpen(true)
  }
  const applyAllFilters = () => {
    setSelected(compactSelection(draftSelected))
    setAllFiltersOpen(false)
  }

  return (
    <div className="server-catalog-layout">
      <aside className="server-filter-card">
        <div className="server-filter-head">
          <span className="filter-head-title">
            <SlidersHorizontal size={18} />
            <strong>Подбор параметров</strong>
            <HelpPopover annotation={filterHelp} />
          </span>
        </div>
        <div className="server-filter-scroll">
          {filterGroups.slice(3, 13).map(({ label, key }) => (
            <section className="server-filter-section" key={key}>
              <h3>{label}</h3>
              {valuesFor(models, facets, key).map((value) => (
                <label key={`${key}-${value}`}>
                  <input
                    type="checkbox"
                    checked={(selected[key] || []).includes(String(value))}
                    onChange={() => setSelected((current) => compactSelection(toggleValue(current, key, String(value))))}
                  />
                  <span>{String(value)}</span>
                  <small>{countFor(models, selected, key, String(value))}</small>
                </label>
              ))}
            </section>
          ))}
        </div>
        <div className="server-filter-actions">
          <button className="server-primary all-filters-button" type="button" onClick={openAllFilters}>
            <SlidersHorizontal size={17} />
            <span>Все фильтры</span>
            <strong>{activeCount}</strong>
          </button>
          <button className="server-secondary filter-reset-button" type="button" onClick={() => setSelected({})} disabled={!activeCount} aria-label="Сбросить фильтры">
            <RotateCcw size={17} />
          </button>
        </div>
      </aside>

      <section>
        <div className="server-catalog-toolbar">
          <div>
            <h1>Серверы HPE ProLiant DL360 Gen10</h1>
            <p>Найдено: {filtered.length} из {models.length} серверов</p>
          </div>
        </div>
        {activeCount > 0 && (
          <div className="active-filter-chips">
            {Object.entries(selected).flatMap(([key, values]) =>
              values.map((value) => (
                <button type="button" key={`${key}-${value}`} onClick={() => setSelected((current) => compactSelection(toggleValue(current, key, value)))}>
                  {value}
                  <X size={14} />
                </button>
              ))
            )}
            <button className="clear-filter-chip" type="button" onClick={() => setSelected({})}>
              Сбросить все
            </button>
          </div>
        )}
        <div className="server-product-grid">
          {filtered.map((model) => (
            <ServerProductCard model={model} key={model.slug} />
          ))}
        </div>
        {!filtered.length && (
          <CollectionEmpty title="Ничего не найдено" text="Сбросьте часть параметров или откройте все фильтры для более широкого подбора." />
        )}
      </section>

      {allFiltersOpen && (
        <div className="server-all-filters-overlay">
          <section className="server-all-filters-modal" role="dialog" aria-modal="true" aria-label="Все фильтры">
            <header>
              <div>
                <span>Подбор серверов</span>
                <h2>Все фильтры</h2>
                <p>Найдено по параметрам: {draftFilteredCount}</p>
              </div>
              <div className="server-all-filters-header-actions">
                <button className="server-secondary" type="button" onClick={() => setAllFiltersOpen(false)}>Отменить</button>
                <button className="server-primary" type="button" onClick={applyAllFilters}>Применить</button>
                <button className="server-secondary all-filters-close" type="button" onClick={() => setAllFiltersOpen(false)} aria-label="Закрыть фильтры">
                  <X size={18} />
                </button>
              </div>
            </header>
            <div className="server-all-filters-reset-row">
              <button className="server-secondary" type="button" onClick={() => setDraftSelected({})} disabled={!draftActiveCount}>
                <RotateCcw size={17} />
                Сбросить все
              </button>
            </div>
            <div className="server-all-filters-body">
              <div className="server-all-filters-grid">
                {filterGroups.map(({ label, key, category }) => {
                  const expanded = expandedFilter === key
                  return (
                    <section className={`server-filter-accordion ${expanded ? "expanded" : ""}`} key={`modal-${key}`}>
                      <button type="button" onClick={() => setExpandedFilter(expanded ? null : key)} aria-expanded={expanded}>
                        <span>
                          <strong>{label}</strong>
                          <small>{category}</small>
                        </span>
                        <span aria-hidden="true">⌄</span>
                      </button>
                      <div className="server-filter-accordion-panel">
                        {valuesFor(models, facets, key).map((value) => (
                          <label key={`modal-${key}-${value}`}>
                            <input
                              type="checkbox"
                              checked={(draftSelected[key] || []).includes(String(value))}
                              onChange={() => setDraftSelected((current) => compactSelection(toggleValue(current, key, String(value))))}
                            />
                            <span>{String(value)}</span>
                            <small>{countFor(models, draftSelected, key, String(value))}</small>
                          </label>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
