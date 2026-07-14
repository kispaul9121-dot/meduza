"use client"

import { ComponentOption, HelpAnnotation, ServerModel } from "@lib/server-configurator/data"
import { formatPrice } from "@lib/server-configurator/format"
import { AlertTriangle, CheckCircle, Settings2 } from "lucide-react"

type SelectedItem = { option: ComponentOption; quantity: number }

function summaryLabel(item: SelectedItem) {
  if (item.option.type === "backplane" && item.option.specs_json?.media_bay) return "MEDIA BAY"
  if (item.option.type === "backplane") return "DRIVE BAY"
  if (item.option.type === "cooling") return "COOLING BUNDLE"
  return item.option.type.toUpperCase()
}

export function ConfiguratorSummaryPanel({
  model,
  pending,
  selectedItems,
  summaryAnnotation,
  total,
  validation,
  valid,
  onValidate,
  onAddToCart,
}: {
  model: ServerModel
  pending: boolean
  selectedItems: SelectedItem[]
  summaryAnnotation?: HelpAnnotation
  total: number
  validation: any
  valid: boolean
  onValidate: () => void
  onAddToCart: () => void
}) {
  return (
    <aside className="server-summary-panel">
      <div className="server-summary-head">
        <Settings2 size={22} />
        <div>
          <h2>Калькулятор</h2>
          <p>{valid ? "Конфигурация совместима" : "Требуется проверка совместимости"}</p>
        </div>
        <span className="summary-health-wrap">
          <button className={`summary-health-icon ${valid ? "valid" : "error"}`} type="button" aria-label={valid ? "Конфигурация совместима" : "Требуется проверка совместимости"}>
            {valid ? <CheckCircle size={17} /> : <AlertTriangle size={17} />}
          </button>
          <span className="summary-health-popover" role="tooltip">
            <strong>{valid ? "Конфигурация совместима" : "Требуется проверка совместимости"}</strong>
            {validation?.errors?.length > 0 ? validation.errors.map((message: string) => <span className="error" key={message}>{message}</span>) : null}
            {validation?.warnings?.length > 0 ? validation.warnings.map((message: string) => <span className="warning" key={message}>{message}</span>) : null}
            {!validation?.errors?.length && !validation?.warnings?.length && <span>{summaryAnnotation?.body || "Критических ошибок и предупреждений нет."}</span>}
          </span>
        </span>
      </div>
      <div className="server-summary-line base">
        <small>Платформа</small>
        <span>{model.public_name}</span>
      </div>
      {selectedItems.map((item) => (
        <div className="server-summary-line" key={item.option.id}>
          <small>{summaryLabel(item)}</small>
          <span>{item.quantity}x {item.option.short_name}</span>
          <strong>{formatPrice(item.option.price * item.quantity)}</strong>
        </div>
      ))}
      {validation?.errors?.length > 0 && <div className="server-summary-messages error">{validation.errors.map((message: string) => <p key={message}>{message}</p>)}</div>}
      {validation?.warnings?.length > 0 && <div className="server-summary-messages warning">{validation.warnings.map((message: string) => <p key={message}>{message}</p>)}</div>}
      <div className="server-total">
        <span>Итого</span>
        <strong>{pending ? "Расчет..." : formatPrice(total)}</strong>
      </div>
      <button className="server-primary wide" type="button" disabled={!valid || pending} onClick={onValidate}>
        Запросить КП
      </button>
      <button className="server-secondary wide" type="button" disabled={!valid || pending} onClick={onAddToCart}>
        Добавить в корзину
      </button>
    </aside>
  )
}
