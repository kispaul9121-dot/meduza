import Link from "next/link"
import { Boxes, Cpu, HardDrive, MemoryStick, Network, PackageSearch, Zap } from "lucide-react"
import type { ComponentCatalogItem, ComponentCatalogResponse } from "@lib/server-configurator/data"
import { PropertyList, propertyText } from "./property-renderers"

const CATEGORY_ICONS: Record<string, typeof Cpu> = {
  cpu: Cpu,
  memory: MemoryStick,
  drives: HardDrive,
  network: Network,
  psu: Zap,
}

function availability(item: ComponentCatalogItem) {
  return item.product_identity.sellable
    ? "Связано с товарным вариантом"
    : "Техническая позиция — отдельно не продаётся"
}

function toggleQuery(current: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(current)
  const selected = next.getAll(key)
  next.delete(key)
  for (const item of selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]) next.append(key, item)
  next.delete("page")
  return next.toString()
}

export function ComponentCatalogView({
  catalog,
  category,
  query,
}: {
  catalog: ComponentCatalogResponse
  category?: string
  query: URLSearchParams
}) {
  const currentCategory = catalog.categories.find((item) => item.key === category)
  return (
    <div className="component-catalog-layout">
      <aside className="component-category-nav" aria-label="Категории комплектующих">
        <h2>Комплектующие</h2>
        {catalog.categories.map((item) => {
          const Icon = CATEGORY_ICONS[item.key] || Boxes
          return <Link className={item.key === category ? "active" : ""} href={`/components/${item.key}`} key={item.key}><Icon size={17} /><span>{item.label}</span><small>{item.count}</small></Link>
        })}
      </aside>
      <section className="component-catalog-main">
        <header className="component-page-head">
          <div><span className="eyebrow">Технический каталог</span><h1>{currentCategory?.label || "Все комплектующие"}</h1><p>Опубликованные нормализованные позиции. Товарный статус и техническая совместимость показаны раздельно.</p></div>
          <form className="component-search-form" action={category ? `/components/${category}` : "/components"}>
            <input name="q" type="search" defaultValue={query.get("q") || ""} placeholder="Название, модель или part number" aria-label="Поиск комплектующих" />
            <select name="sort" defaultValue={query.get("sort") || "name_asc"} aria-label="Сортировка комплектующих"><option value="name_asc">Название: А–Я</option><option value="name_desc">Название: Я–А</option><option value="brand_asc">Сначала по бренду</option></select>
            <button className="server-primary" type="submit">Найти</button>
          </form>
        </header>
        <div className="component-facet-row" aria-label="Фильтры комплектующих">
          {catalog.facets.filter((facet) => facet.values?.length).slice(0, 5).map((facet) => (
            <details key={facet.key}>
              <summary>{catalog.filter_schema.definitions.find((definition) => definition.key === facet.key)?.label || facet.key}</summary>
              <div>{facet.values.slice(0, 20).map((option) => {
                const active = query.getAll(facet.key).includes(option.value)
                return <Link className={active ? "active" : ""} href={`?${toggleQuery(query, facet.key, option.value)}`} key={option.value}>{active ? "✓ " : ""}{option.label || option.value} <small>{option.count}</small></Link>
              })}</div>
            </details>
          ))}
          {query.toString() ? <Link className="component-clear-filters" href={category ? `/components/${category}` : "/components"}>Сбросить</Link> : null}
        </div>
        <p className="component-result-count" aria-live="polite">Найдено: {catalog.total}</p>
        {catalog.items.length ? <div className="component-card-grid">{catalog.items.map((item) => <ComponentCard item={item} category={category || item.category_keys[0]} key={item.id} />)}</div> : <div className="server-empty-state"><PackageSearch size={30} /><strong>Позиции не найдены</strong><p>Измените запрос или сбросьте фильтры.</p></div>}
        {catalog.pagination.pages > 1 ? <nav className="catalog-pagination" aria-label="Страницы комплектующих"><Link aria-disabled={!catalog.pagination.has_previous} href={`?${new URLSearchParams({ ...Object.fromEntries(query), page: String(Math.max(1, catalog.pagination.page - 1)) })}`}>Назад</Link><span>{catalog.pagination.page} из {catalog.pagination.pages}</span><Link aria-disabled={!catalog.pagination.has_next} href={`?${new URLSearchParams({ ...Object.fromEntries(query), page: String(catalog.pagination.page + 1) })}`}>Дальше</Link></nav> : null}
      </section>
    </div>
  )
}

function ComponentCard({ item, category }: { item: ComponentCatalogItem; category: string }) {
  return (
    <article className="component-card">
      <div className="component-card-visual"><Boxes size={36} /><span>{item.type}</span></div>
      <div className="component-card-body">
        <span className="eyebrow">{item.brand}</span>
        <h2><Link href={`/components/${category}/${item.id}`}>{item.public_name}</Link></h2>
        <p className="component-part-number">Part number: {item.part_number || "не указан"}</p>
        <dl>{item.attributes.slice(0, 4).map((attribute) => <div key={attribute.key}><dt>{attribute.label}</dt><dd>{propertyText(attribute)}</dd></div>)}</dl>
        <p className={`component-commerce-state ${item.product_identity.sellable ? "sellable" : "technical"}`}>{availability(item)}</p>
        <Link className="server-secondary wide" href={`/components/${category}/${item.id}`}>Характеристики</Link>
      </div>
    </article>
  )
}

export function ComponentDetailView({ item, category }: { item: ComponentCatalogItem; category: string }) {
  return (
    <article className="component-detail">
      <nav className="server-breadcrumbs" aria-label="Breadcrumbs"><Link href="/components">Комплектующие</Link><span>/</span><Link href={`/components/${category}`}>{category}</Link><span>/</span><span>{item.short_name}</span></nav>
      <header className="component-detail-hero">
        <div className="component-detail-visual"><Boxes size={64} /><span>{item.type}</span></div>
        <div><span className="eyebrow">{item.brand} · технический компонент</span><h1>{item.public_name}</h1><p>{item.model}</p><div className="component-identity"><span>Component ID: {item.product_identity.technical_component_id}</span><span>Part number: {item.part_number || "не указан"}</span><span>Нормализация: {item.normalization_status}</span></div><p className="component-commerce-state">{availability(item)}</p>{item.product_identity.sellable && item.product_identity.medusa_product_handle ? <Link className="server-primary" href={`/products/${item.product_identity.medusa_product_handle}`}>Открыть товар</Link> : <span className="server-secondary disabled" aria-disabled="true">Отдельная покупка недоступна</span>}</div>
      </header>
      <div className="component-detail-grid">
        <section><h2>Нормализованные характеристики</h2><PropertyList properties={item.attributes} /></section>
        <section><h2>Возможности и требования</h2><PropertyList properties={[
          { key: "provides", label: "Предоставляет", value_type: "object", value: item.capabilities.provides, unit: null, comparable: false, compatibility_status: "informational", value_source: "normalized_specs" },
          { key: "consumes", label: "Потребляет", value_type: "object", value: item.capabilities.consumes, unit: null, comparable: false, compatibility_status: "informational", value_source: "normalized_specs" },
          { key: "requirements", label: "Требования", value_type: "object", value: item.capabilities.requirements, unit: null, comparable: false, compatibility_status: "informational", value_source: "normalized_specs" },
        ]} /><p className="collection-note">Только свойства со статусом engine_mapped участвуют в заявлении о совместимости. Остальные показаны информационно.</p></section>
      </div>
    </article>
  )
}
