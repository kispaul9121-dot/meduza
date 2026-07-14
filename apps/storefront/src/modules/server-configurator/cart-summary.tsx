import { HttpTypes } from "@medusajs/types"
import { configuredMetadata, formatCartPrice } from "./cart-format"

export function ConfiguredCartSummary({ cart }: { cart: HttpTypes.StoreCart }) {
  const lines = cart.items || []
  const requestQuoteCount = lines.filter((line) => configuredMetadata(line).request_quote).length
  const pricedLines = lines.filter((line) => !configuredMetadata(line).request_quote)

  return (
    <aside className="server-cart-summary">
      <h2>Итого</h2>
      <div><span>Позиции</span><strong>{lines.length}</strong></div>
      <div><span>С ценой</span><span>{pricedLines.length}</span></div>
      <div><span>По запросу</span><span>{requestQuoteCount}</span></div>
      <div><span>Сумма cart</span><strong>{requestQuoteCount ? "частично по запросу" : formatCartPrice(cart.total, cart.currency_code)}</strong></div>
      <button className="server-primary wide" type="button">Запросить КП по корзине</button>
    </aside>
  )
}
