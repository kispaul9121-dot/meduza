"use client"

import Link from "next/link"
import { ServerModel } from "@lib/server-configurator/data"
import { formatPrice } from "@lib/server-configurator/format"
import { BarChart3, Heart, Settings2, ShoppingCart } from "lucide-react"
import { useServerLocalActions } from "./local-actions"
import { ServerIllustration } from "./server-illustration"

export function ServerProductCard({ model }: { model: ServerModel }) {
  const actions = useServerLocalActions(model.slug)
  const specs = [
    `${model.generation} / ${model.form_factor}`,
    `${model.chassis_type}, ${model.drive_bays_front} bays`,
    `${model.drive_form_factor} inch, ${model.supported_drive_interfaces.join("/")}`,
    `${model.cpu_socket}, up to ${model.max_cpu} CPU`,
    `${model.ram_slots_total} DIMM, max ${model.max_ram_capacity}`,
  ]
  const availability = ({
    in_stock: "В наличии",
    available: "Доступно без учёта остатков",
    backorder: "Под заказ",
    out_of_stock: "Нет в наличии",
  } as Record<string, string>)[model.catalog_availability || ""] || "Наличие не указано"

  return (
    <article className="server-product-card">
      <Link className="server-card-link" href={`/servers/${model.slug}`} aria-label={model.public_name}>
        <ServerIllustration />
      </Link>
      <div className="server-card-tools">
        <button
          className={actions.isFavorite ? "active" : ""}
          type="button"
          aria-label={actions.isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          aria-pressed={actions.isFavorite}
          onClick={() => actions.toggleFavorite()}
        >
          <Heart size={20} />
        </button>
        <button
          className={actions.isCompared ? "active" : ""}
          type="button"
          aria-label={actions.isCompared ? "Убрать из сравнения" : "Добавить в сравнение"}
          aria-pressed={actions.isCompared}
          onClick={() => actions.toggleCompare()}
        >
          <BarChart3 size={20} />
        </button>
      </div>
      <div className="server-product-status">{availability}</div>
      <strong className="server-product-price">{model.catalog_price !== null && model.catalog_price !== undefined ? formatPrice(model.catalog_price) : "Цена не указана"}</strong>
      <div className="server-product-copy">
        <h2>
          <Link href={`/servers/${model.slug}`}>{model.public_name}</Link>
        </h2>
      </div>
      <ul className="server-spec-list">
        {specs.map((spec) => (
          <li key={spec}>{spec}</li>
        ))}
      </ul>
      <div className="server-product-actions">
        <Link className="server-primary server-configure-button" href={`/servers/${model.slug}`}>
          <Settings2 size={17} />
          Сконфигурировать
        </Link>
        <button className="server-cart-button" type="button" aria-label={model.medusa_variant_id ? "Добавить в корзину" : "Товарный вариант не связан"} disabled={!model.medusa_variant_id} onClick={() => actions.addToCart()}>
          <ShoppingCart size={20} />
        </button>
      </div>
    </article>
  )
}
