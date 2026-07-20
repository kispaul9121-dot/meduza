"use client"

import { ChartBar, Heart } from "@medusajs/icons"
import { CheckCircle2, CircleHelp, Settings2 } from "lucide-react"
import type { ComponentOption, ServerModel } from "@lib/server-configurator/data"
import { formatPrice } from "@lib/server-configurator/format"
import { useServerLocalActions } from "./local-actions"

export function ConfiguratorOverview({ model, pending, selectedItems, valid, onValidate }: { model: ServerModel; pending: boolean; selectedItems: Array<{ option: ComponentOption; quantity: number }>; valid: boolean; onValidate: () => void }) {
  const actions = useServerLocalActions(model.slug)
  const bays = Number(model.drive_bays_front || 0) + Number(model.drive_bays_rear || 0)
  const availability = ({ in_stock: "В наличии", available: "Доступно без учёта остатков", backorder: "Под заказ", out_of_stock: "Нет в наличии" } as Record<string, string>)[model.catalog_availability || ""] || "Наличие не указано"
  return (
    <section className="server-overview payloud-overview" id="overview" aria-label="Обзор сервера">
      <div className="server-platform-card"><div className="server-media-copy"><div className="server-viewer"><div className="server-illustration overview-main" aria-hidden="true"><span /><span /><span /></div><div className="photo-staging"><span>{model.brand} {model.family}</span><p>Изображения этой модели пока не опубликованы.</p></div></div><div className="overview-info"><span className="eyebrow">{model.brand} · {model.generation}</span><h1>{model.public_name}</h1><p>{model.seo_description}</p><ul><li>{model.form_factor} · {model.chassis_type}</li><li>{bays ? `${bays} отсеков` : "Количество отсеков не указано"} · {model.drive_form_factor || "форм-фактор не указан"}</li><li>{model.cpu_socket || "Сокет не указан"} · до {model.max_cpu || "—"} CPU</li><li>{model.ram_slots_total || "—"} DIMM · {model.max_ram_capacity || "максимум не указан"}</li></ul></div></div></div>
      <aside className="config-commerce-card" aria-label="Коммерческий статус"><div className="commerce-labels">{model.catalog_condition ? <span>{model.catalog_condition}</span> : <span>Состояние не указано</span>}<span className={model.catalog_availability === "in_stock" ? "available" : "preorder"}>{availability}</span></div><div className="commerce-price"><small>Цена платформы</small><strong>{model.catalog_price !== null && model.catalog_price !== undefined ? formatPrice(model.catalog_price) : "Цена не указана"}</strong><p>Компоненты технического каталога не прибавляются к цене без связи с товарным вариантом.</p></div><button className="server-primary wide commerce-action-button" type="button" disabled={pending} onClick={onValidate}>{valid ? <CheckCircle2 size={18} /> : <Settings2 size={18} />}{pending ? "Проверяем…" : valid ? "Проверено" : "Проверить совместимость"}</button><div className="commerce-mini-actions"><button className={actions.isFavorite ? "active" : ""} type="button" aria-label={actions.isFavorite ? "Убрать из избранного" : "Добавить в избранное"} aria-pressed={actions.isFavorite} onClick={() => actions.toggleFavorite()}><Heart aria-hidden="true" /></button><button className={actions.isCompared ? "active" : ""} type="button" aria-label={actions.isCompared ? "Убрать из сравнения" : "Добавить в сравнение"} aria-pressed={actions.isCompared} onClick={() => actions.toggleCompare()}><ChartBar aria-hidden="true" /></button></div><div className="commerce-features"><span><CircleHelp aria-hidden="true" /> Выбрано технических позиций: {selectedItems.length}</span><span><CheckCircle2 aria-hidden="true" /> Совместимость подтверждает только backend engine</span></div></aside>
    </section>
  )
}
