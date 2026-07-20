import Link from "next/link"
import { ShoppingCart } from "lucide-react"

export function ConfiguredCartEmpty() {
  return (
    <div className="server-empty-state">
      <ShoppingCart size={34} />
      <strong>Корзина пуста</strong>
      <p>Соберите сервер в конфигураторе и добавьте его в корзину для подготовки КП.</p>
      <Link className="server-primary" href="/servers">Перейти в каталог</Link>
    </div>
  )
}
