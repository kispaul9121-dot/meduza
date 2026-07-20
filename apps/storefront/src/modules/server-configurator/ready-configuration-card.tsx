import Link from "next/link"
import { ReadyConfiguration } from "@lib/server-configurator/data"

function priceLabel(ready: ReadyConfiguration) {
  if (ready.price_mode === "request_quote" || ready.total_price == null) return "Цена по запросу"
  const price = new Intl.NumberFormat("ru-RU", { style: "currency", currency: ready.currency_code || "RUB", maximumFractionDigits: 0 }).format(ready.total_price)
  return ready.price_mode === "from" ? `от ${price}` : price
}

export function ReadyConfigurationCard({ ready }: { ready: ReadyConfiguration }) {
  const components = ready.version.snapshot.selected_components
  return (
    <article className="server-product-card">
      <div className="server-product-copy">
        <span className="server-product-kicker">{ready.use_case}</span>
        <h2><Link href={`/solutions/${ready.slug}`}>{ready.name}</Link></h2>
        <p>{ready.description || `Готовая конфигурация ${ready.version.snapshot.server_model.public_name}`}</p>
        <ul className="ready-component-preview">
          {components.slice(0, 4).map((item) => <li key={item.component_id}>{item.quantity} × {item.public_name || item.component_id}</li>)}
        </ul>
      </div>
      <div className="server-product-actions">
        <strong>{priceLabel(ready)}</strong>
        <Link className="server-primary" href={`/solutions/${ready.slug}`}>Подробнее</Link>
      </div>
    </article>
  )
}
