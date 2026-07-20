"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { QueryClient, QueryClientProvider, keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  CatalogFilterDefinition,
  HelpAnnotation,
  queryServerCatalog,
  ServerCatalogResponse,
} from "@lib/server-configurator/data"
import { RotateCcw, SlidersHorizontal, X } from "lucide-react"
import { HelpPopover } from "./help-popover"
import { ServerProductCard } from "./product-card"

function CollectionEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="server-empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
      <Link className="server-primary" href="/servers">Перейти в каталог</Link>
    </div>
  )
}

export function ServerCatalogClient({
  annotations = [],
  initialCatalog,
  initialQuery,
}: {
  annotations?: HelpAnnotation[]
  initialCatalog: ServerCatalogResponse
  initialQuery: string
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }))
  return (
    <QueryClientProvider client={queryClient}>
      <CatalogContent
        annotations={annotations}
        initialCatalog={initialCatalog}
        initialQuery={initialQuery}
      />
    </QueryClientProvider>
  )
}

function CatalogContent({
  annotations,
  initialCatalog,
  initialQuery,
}: {
  annotations: HelpAnnotation[]
  initialCatalog: ServerCatalogResponse
  initialQuery: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const serialized = searchParams.toString()
  const [search, setSearch] = useState(searchParams.get("q") || searchParams.get("search") || "")
  const [allFiltersOpen, setAllFiltersOpen] = useState(false)
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ["server-catalog", serialized],
    queryFn: ({ signal }) => queryServerCatalog(new URLSearchParams(serialized), signal),
    initialData: serialized === initialQuery ? initialCatalog : undefined,
    placeholderData: keepPreviousData,
  })
  const catalog = query.data
  const definitions = catalog?.filter_schema.definitions || initialCatalog.filter_schema.definitions
  const primaryDefinitions = definitions.filter((definition) => definition.primary).slice(0, 12)
  const definitionByKey = useMemo(
    () => new Map(definitions.map((definition) => [definition.key, definition])),
    [definitions],
  )
  const activeKeys = Array.from(new Set(Array.from(searchParams.keys()).filter(
    (key) => !["q", "search", "page", "limit", "sort"].includes(key),
  )))
  const activeCount = activeKeys.reduce((sum, key) => sum + Math.max(searchParams.getAll(key).length, 1), 0)
  const filterHelp = annotations.find((item) => item.key === "catalog.filters")

  function navigate(params: URLSearchParams, replace = false) {
    const target = params.toString() ? `${pathname}?${params.toString()}` : pathname
    if (replace) router.replace(target, { scroll: false })
    else router.push(target, { scroll: false })
  }

  function updateValues(key: string, value: string) {
    const params = new URLSearchParams(serialized)
    const current = params.getAll(key)
    params.delete(key)
    for (const item of current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]) params.append(key, item)
    params.delete("page")
    navigate(params)
  }

  function updateScalar(key: string, value: string) {
    const params = new URLSearchParams(serialized)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    navigate(params)
  }

  function clearFilters() {
    const params = new URLSearchParams()
    const q = searchParams.get("q") || searchParams.get("search")
    if (q) params.set("q", q)
    navigate(params)
  }

  useEffect(() => {
    const current = searchParams.get("q") || searchParams.get("search") || ""
    if (current !== search) setSearch(current)
    // URL changes from browser navigation are the authoritative source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = searchParams.get("q") || searchParams.get("search") || ""
      if (search === current) return
      const params = new URLSearchParams(serialized)
      params.delete("search")
      if (search.trim()) params.set("q", search.trim())
      else params.delete("q")
      params.delete("page")
      navigate(params, true)
    }, 350)
    return () => window.clearTimeout(timer)
    // `serialized` intentionally makes browser back/forward cancel stale work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function filterControl(definition: CatalogFilterDefinition, prefix: string) {
    const facet = catalog?.facets.find((item) => item.key === definition.key)
    if (definition.type === "range") return (
      <div className="catalog-range-fields">
        <label>
          <span>От</span>
          <input
            key={`${definition.key}-min-${serialized}`}
            type="number"
            min={facet?.range?.min}
            max={facet?.range?.max}
            defaultValue={searchParams.get(`${definition.key}.min`) || ""}
            placeholder={facet?.range ? String(facet.range.min) : undefined}
            onBlur={(event) => updateScalar(`${definition.key}.min`, event.currentTarget.value)}
          />
        </label>
        <label>
          <span>До</span>
          <input
            key={`${definition.key}-max-${serialized}`}
            type="number"
            min={facet?.range?.min}
            max={facet?.range?.max}
            defaultValue={searchParams.get(`${definition.key}.max`) || ""}
            placeholder={facet?.range ? String(facet.range.max) : undefined}
            onBlur={(event) => updateScalar(`${definition.key}.max`, event.currentTarget.value)}
          />
        </label>
      </div>
    )
    if (definition.type === "text") return (
      <input
        key={`${definition.key}-text-${serialized}`}
        className="catalog-text-filter"
        type="search"
        defaultValue={searchParams.get(definition.key) || ""}
        placeholder={`Введите ${definition.label.toLocaleLowerCase()}`}
        onBlur={(event) => updateScalar(definition.key, event.currentTarget.value.trim())}
      />
    )
    return (facet?.values || []).map((option) => (
      <label key={`${prefix}-${definition.key}-${option.value}`}>
        <input
          type="checkbox"
          checked={searchParams.getAll(definition.key).includes(option.value)}
          onChange={() => updateValues(definition.key, option.value)}
        />
        <span>{option.label || option.value}</span>
        <small>{option.count}</small>
      </label>
    ))
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
          {primaryDefinitions.map((definition) => (
            <section className="server-filter-section" key={definition.key}>
              <h3>{definition.label}</h3>
              {filterControl(definition, "main")}
            </section>
          ))}
        </div>
        <div className="server-filter-actions">
          <button className="server-primary all-filters-button" type="button" onClick={() => setAllFiltersOpen(true)}>
            <SlidersHorizontal size={17} />
            <span>Все фильтры</span>
            <strong>{activeCount}</strong>
          </button>
          <button className="server-secondary filter-reset-button" type="button" onClick={clearFilters} disabled={!activeCount} aria-label="Сбросить фильтры">
            <RotateCcw size={17} />
          </button>
        </div>
      </aside>

      <section>
        <div className="server-catalog-toolbar">
          <div>
            <h1>Каталог серверов</h1>
            <p aria-live="polite">Найдено: {catalog?.total ?? 0} серверов</p>
          </div>
          <div className="catalog-query-controls">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по модели или семейству"
              aria-label="Поиск серверов"
            />
            <select
              value={searchParams.get("sort") || "relevance"}
              onChange={(event) => updateScalar("sort", event.target.value)}
              aria-label="Сортировка"
            >
              <option value="relevance">По релевантности</option>
              <option value="name_asc">Название: А–Я</option>
              <option value="name_desc">Название: Я–А</option>
              <option value="price_asc">Сначала дешевле</option>
              <option value="price_desc">Сначала дороже</option>
              <option value="newest">Сначала новые</option>
            </select>
          </div>
        </div>
        {activeCount > 0 && (
          <div className="active-filter-chips">
            {activeKeys.flatMap((key) => searchParams.getAll(key).map((value) => (
                <button type="button" key={`${key}-${value}`} onClick={() => updateValues(key, value)}>
                  {definitionByKey.get(key.replace(/\.(min|max)$/, ""))?.label || key}: {value}
                  <X size={14} />
                </button>
              )))}
            <button className="clear-filter-chip" type="button" onClick={clearFilters}>
              Сбросить все
            </button>
          </div>
        )}
        {query.isFetching && <p className="catalog-request-state" role="status">Обновляем каталог…</p>}
        {query.isError && (
          <div className="server-empty-state" role="alert">
            <strong>Каталог временно недоступен</strong>
            <p>{query.error instanceof Error ? query.error.message : "Не удалось получить данные каталога."}</p>
            <button className="server-primary" type="button" onClick={() => query.refetch()}>Повторить</button>
          </div>
        )}
        {!query.isError && <div className="server-product-grid">
          {(catalog?.items || []).map((model) => (
            <ServerProductCard model={model} key={model.slug} />
          ))}
        </div>}
        {!query.isError && !query.isFetching && !catalog?.items.length && (
          <CollectionEmpty title="Ничего не найдено" text="Сбросьте часть параметров или откройте все фильтры для более широкого подбора." />
        )}
        {!!catalog?.pagination.pages && catalog.pagination.pages > 1 && (
          <nav className="catalog-pagination" aria-label="Страницы каталога">
            <button type="button" disabled={!catalog.pagination.has_previous} onClick={() => updateScalar("page", String(catalog.pagination.page - 1))}>Назад</button>
            <span>{catalog.pagination.page} из {catalog.pagination.pages}</span>
            <button type="button" disabled={!catalog.pagination.has_next} onClick={() => updateScalar("page", String(catalog.pagination.page + 1))}>Дальше</button>
          </nav>
        )}
      </section>

      {allFiltersOpen && (
        <div className="server-all-filters-overlay">
          <section className="server-all-filters-modal" role="dialog" aria-modal="true" aria-label="Все фильтры">
            <header>
              <div>
                <span>Подбор серверов</span>
                <h2>Все фильтры</h2>
                <p>Найдено по параметрам: {catalog?.total ?? 0}</p>
              </div>
              <div className="server-all-filters-header-actions">
                <button className="server-primary" type="button" onClick={() => setAllFiltersOpen(false)}>Готово</button>
                <button className="server-secondary all-filters-close" type="button" onClick={() => setAllFiltersOpen(false)} aria-label="Закрыть фильтры">
                  <X size={18} />
                </button>
              </div>
            </header>
            <div className="server-all-filters-reset-row">
              <button className="server-secondary" type="button" onClick={clearFilters} disabled={!activeCount}>
                <RotateCcw size={17} />
                Сбросить все
              </button>
            </div>
            <div className="server-all-filters-body">
              <div className="server-all-filters-grid">
                {definitions.map((definition) => {
                  const expanded = expandedFilter === definition.key
                  return (
                    <section className={`server-filter-accordion ${expanded ? "expanded" : ""}`} key={`modal-${definition.key}`}>
                      <button type="button" onClick={() => setExpandedFilter(expanded ? null : definition.key)} aria-expanded={expanded}>
                        <span>
                          <strong>{definition.label}</strong>
                          <small>{definition.category}</small>
                        </span>
                        <span aria-hidden="true">⌄</span>
                      </button>
                      <div className="server-filter-accordion-panel">
                        {filterControl(definition, "modal")}
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
