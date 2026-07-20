"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { Check, Copy, RotateCcw } from "lucide-react"
import { queryServerCatalog, ServerModel } from "@lib/server-configurator/data"
import { PropertyValue, propertyText } from "./property-renderers"
import { ServerProductCard } from "./product-card"
import { MAX_COMPARE_ITEMS, useServerLocalActions } from "./local-actions"

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="server-empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
      <Link className="server-primary" href="/servers">Перейти в каталог</Link>
    </div>
  )
}

function CollectionQuery({ slugs }: { slugs: string[] }) {
  return useQuery({
    queryKey: ["server-collection", slugs.join(",")],
    queryFn: ({ signal }) => queryServerCatalog({ slugs: slugs.join(","), limit: String(Math.max(1, slugs.length)), sort: "name_asc" }, signal),
    enabled: slugs.length > 0,
    staleTime: 30_000,
  })
}

function Provider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function FavoritesCollection() {
  return <Provider><FavoritesContent /></Provider>
}

function FavoritesContent() {
  const actions = useServerLocalActions()
  const ids = actions.collections.favorites
  const query = CollectionQuery({ slugs: ids })
  const bySlug = new Map((query.data?.items || []).map((model) => [model.slug, model]))
  const models = ids.map((id) => bySlug.get(id)).filter(Boolean) as ServerModel[]
  return (
    <section className="server-collection-page">
      <div className="server-catalog-toolbar">
        <div><h1>Избранное</h1><p>{ids.length} сохранено для быстрого возврата</p></div>
      </div>
      {!actions.hydrated || query.isLoading ? <p className="catalog-request-state" role="status">Загружаем избранное…</p> : null}
      {query.isError ? <div className="server-empty-state" role="alert"><strong>Не удалось загрузить избранное</strong><button className="server-primary" onClick={() => query.refetch()} type="button">Повторить</button></div> : null}
      {actions.hydrated && !ids.length ? <Empty title="Избранное пусто" text="Добавьте серверы кнопкой с сердцем на карточке или в конфигураторе." /> : null}
      {!query.isError && models.length ? <div className="server-product-grid">{models.map((model) => <ServerProductCard model={model} key={model.slug} />)}</div> : null}
      {actions.hydrated && ids.length > models.length && !query.isLoading ? <p className="collection-note">Некоторые сохранённые позиции больше не опубликованы и поэтому не показаны.</p> : null}
      <p className="collection-note">Избранное хранится на этом устройстве. При подключении аккаунта локальный список можно будет объединить с профилем.</p>
    </section>
  )
}

type CompareRow = { group: string; key: string; label: string; read: (model: ServerModel) => string }

function comparisonRows(models: ServerModel[]): CompareRow[] {
  const base: CompareRow[] = [
    { group: "Корпус", key: "form_factor", label: "Форм-фактор", read: (model) => model.form_factor || "Не указано" },
    { group: "Корпус", key: "chassis_type", label: "Шасси", read: (model) => model.chassis_type || "Не указано" },
    { group: "Storage", key: "bays", label: "Отсеки", read: (model) => String(Number(model.drive_bays_front || 0) + Number(model.drive_bays_rear || 0)) },
    { group: "Storage", key: "interfaces", label: "Интерфейсы", read: (model) => model.supported_drive_interfaces?.join(" / ") || "Не указано" },
    { group: "CPU", key: "socket", label: "Сокет", read: (model) => model.cpu_socket || "Не указано" },
    { group: "CPU", key: "max_cpu", label: "Максимум CPU", read: (model) => model.max_cpu ? String(model.max_cpu) : "Не указано" },
    { group: "Память", key: "ram", label: "Слоты DIMM", read: (model) => model.ram_slots_total ? String(model.ram_slots_total) : "Не указано" },
    { group: "Память", key: "max_ram", label: "Максимальная память", read: (model) => model.max_ram_capacity || "Не указано" },
  ]
  const keys = new Map<string, { label: string; group: string }>()
  for (const model of models) for (const property of model.presentation_properties || []) {
    if (property.comparable) keys.set(property.key, { label: property.label, group: "Нормализованные характеристики" })
  }
  return [...base, ...Array.from(keys).map(([key, definition]) => ({
    ...definition,
    key: `property:${key}`,
    read: (model: ServerModel) => propertyText(model.presentation_properties?.find((property) => property.key === key)),
  }))]
}

function urlItems(searchParams: URLSearchParams) {
  return Array.from(new Set(searchParams.getAll("items").flatMap((entry) => entry.split(",")).map((entry) => entry.trim()).filter(Boolean))).slice(0, MAX_COMPARE_ITEMS)
}

export function CompareCollection() {
  return <Provider><CompareContent /></Provider>
}

function CompareContent() {
  const actions = useServerLocalActions()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const serialized = searchParams.toString()
  const ids = useMemo(() => urlItems(new URLSearchParams(serialized)), [serialized])
  const [differencesOnly, setDifferencesOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const query = CollectionQuery({ slugs: ids })
  const bySlug = new Map((query.data?.items || []).map((model) => [model.slug, model]))
  const models = ids.map((id) => bySlug.get(id)).filter(Boolean) as ServerModel[]
  const rows = comparisonRows(models).filter((row) => !differencesOnly || new Set(models.map(row.read)).size > 1)

  useEffect(() => {
    if (!actions.hydrated) return
    if (!searchParams.has("items") && actions.collections.compare.length) {
      const next = new URLSearchParams(serialized)
      next.set("items", actions.collections.compare.join(","))
      router.replace(`${pathname}?${next.toString()}`)
      return
    }
    if (ids.join(",") !== actions.collections.compare.join(",")) actions.replaceCompare(ids)
    // URL is the source of truth after initial local hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.hydrated, serialized])

  function replaceItems(nextIds: string[]) {
    const next = new URLSearchParams(serialized)
    if (nextIds.length) next.set("items", nextIds.join(","))
    else next.delete("items")
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname)
    actions.replaceCompare(nextIds)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="server-collection-page">
      <div className="server-catalog-toolbar compare-toolbar">
        <div><h1>Сравнение</h1><p>{models.length} из {MAX_COMPARE_ITEMS} серверов</p></div>
        <div className="compare-controls">
          <label><input type="checkbox" checked={differencesOnly} onChange={(event) => setDifferencesOnly(event.target.checked)} /> Только различия</label>
          <button className="server-secondary" type="button" disabled={!ids.length} onClick={copyLink}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Скопировано" : "Поделиться"}</button>
          <button className="server-secondary" type="button" disabled={!ids.length} onClick={() => replaceItems([])}><RotateCcw size={16} /> Очистить</button>
        </div>
      </div>
      {!actions.hydrated || query.isLoading ? <p className="catalog-request-state" role="status">Загружаем сравнение…</p> : null}
      {query.isError ? <div className="server-empty-state" role="alert"><strong>Не удалось загрузить сравнение</strong><button className="server-primary" onClick={() => query.refetch()} type="button">Повторить</button></div> : null}
      {actions.hydrated && !ids.length ? <Empty title="Сравнение пустое" text="Добавьте до четырёх серверов кнопкой сравнения на карточке." /> : null}
      {!query.isError && models.length ? (
        <div className="server-compare-table-wrap">
          <table className="server-compare-table">
            <thead><tr><th scope="col">Параметр</th>{models.map((model) => <th scope="col" key={model.slug}><Link href={`/servers/${model.slug}`}>{model.public_name}</Link><button type="button" onClick={() => replaceItems(ids.filter((id) => id !== model.slug))}>Убрать</button><Link className="compare-configure-link" href={`/servers/${model.slug}#configurator`}>Настроить</Link></th>)}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row.key} className={index === 0 || rows[index - 1]?.group !== row.group ? "compare-group-start" : ""}><th scope="row"><small>{row.group}</small>{row.label}</th>{models.map((model) => <td key={`${row.key}:${model.slug}`}><PropertyValue property={{ value: row.read(model), value_type: "text", unit: null }} /></td>)}</tr>)}</tbody>
          </table>
          {!rows.length && differencesOnly ? <p className="collection-note">У выбранных моделей нет различающихся опубликованных характеристик.</p> : null}
        </div>
      ) : null}
      {models.length > 0 && models.length < 3 ? <p className="collection-note">Для наглядного сравнения обычно выбирают 3–4 модели.</p> : null}
    </section>
  )
}
