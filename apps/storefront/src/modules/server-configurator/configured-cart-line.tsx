"use client"

import { HttpTypes } from "@medusajs/types"
import { Minus, Plus, Trash2 } from "lucide-react"
import {
  componentLine,
  configuredMetadata,
  formatCartPrice,
  isConfiguredServerLine,
} from "./cart-format"

export function ConfiguredCartLine({
  line,
  currencyCode,
  onRemove,
  onUpdateQuantity,
  pending,
}: {
  line: HttpTypes.StoreCartLineItem
  currencyCode: string
  onRemove: (lineId: string) => void
  onUpdateQuantity: (lineId: string, quantity: number) => void
  pending: boolean
}) {
  const metadata = configuredMetadata(line)
  const configured = isConfiguredServerLine(line)
  const quantity = Number(line.quantity || 1)
  const title = metadata.server_public_name || line.product_title || line.title
  const requestQuote = metadata.request_quote || metadata.pricing_mode === "request_quote"

  return (
    <article className="server-cart-line configured">
      <div className="server-cart-line-main">
        <strong>{title}</strong>
        <span>{configured ? `Configuration ${metadata.configuration_id}` : line.variant_title}</span>
        {configured ? (
          <dl className="configured-line-specs">
            <div><dt>CPU</dt><dd>{componentLine(metadata, "cpu")}</dd></div>
            <div><dt>RAM</dt><dd>{componentLine(metadata, "ram")}</dd></div>
            <div><dt>Storage</dt><dd>{componentLine(metadata, "drive")}</dd></div>
            <div><dt>RAID</dt><dd>{componentLine(metadata, "raid")}</dd></div>
            <div><dt>NIC</dt><dd>{componentLine(metadata, "nic")}</dd></div>
            <div><dt>PSU</dt><dd>{componentLine(metadata, "psu")}</dd></div>
            <div><dt>Cooling</dt><dd>{componentLine(metadata, "cooling")}</dd></div>
            <div><dt>Media Bay</dt><dd>{componentLine(metadata, "backplane")}</dd></div>
          </dl>
        ) : (
          <p>Обычный товар Medusa без snapshot конфигуратора.</p>
        )}
        {metadata.warnings?.length ? (
          <div className="server-summary-messages warning">
            {metadata.warnings.map((message) => <p key={message}>{message}</p>)}
          </div>
        ) : null}
      </div>
      <div className="server-cart-quantity">
        <button
          type="button"
          aria-label="Уменьшить количество"
          disabled={pending || quantity <= 1}
          onClick={() => onUpdateQuantity(line.id, quantity - 1)}
        >
          <Minus size={14} />
        </button>
        <b>{quantity}</b>
        <button
          type="button"
          aria-label="Увеличить количество"
          disabled={pending}
          onClick={() => onUpdateQuantity(line.id, quantity + 1)}
        >
          <Plus size={14} />
        </button>
      </div>
      <strong className="server-cart-line-price">
        {requestQuote ? "по запросу" : formatCartPrice(metadata.total_price ?? line.total, currencyCode)}
      </strong>
      <button
        type="button"
        aria-label="Удалить позицию"
        disabled={pending}
        onClick={() => onRemove(line.id)}
      >
        <Trash2 size={17} />
      </button>
    </article>
  )
}
