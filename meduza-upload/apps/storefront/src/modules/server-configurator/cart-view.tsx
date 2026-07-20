"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import {
  removeConfiguredCartLine,
  retrieveConfiguredCart,
  updateConfiguredCartLine,
} from "@lib/server-configurator/cart-api"
import { ConfiguredCartEmpty } from "./cart-empty"
import { ConfiguredCartLine } from "./configured-cart-line"
import { ConfiguredCartSummary } from "./cart-summary"
import { SERVER_CART_UPDATED_EVENT } from "./cart-events"

export function ConfiguredServerCartView() {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingLine, setPendingLine] = useState<string | null>(null)

  useEffect(() => {
    retrieveConfiguredCart()
      .then(setCart)
      .finally(() => setLoading(false))
  }, [])

  async function updateQuantity(lineId: string, quantity: number) {
    setPendingLine(lineId)
    const next = await updateConfiguredCartLine(lineId, quantity)
    setCart(next)
    window.dispatchEvent(new Event(SERVER_CART_UPDATED_EVENT))
    setPendingLine(null)
  }

  async function removeLine(lineId: string) {
    setPendingLine(lineId)
    const next = await removeConfiguredCartLine(lineId)
    setCart(next)
    window.dispatchEvent(new Event(SERVER_CART_UPDATED_EVENT))
    setPendingLine(null)
  }

  const items = cart?.items || []

  return (
    <section className="server-cart-page">
      <div className="server-catalog-toolbar">
        <div>
          <h1>Корзина</h1>
          <p>{loading ? "Загрузка cart..." : `${items.length} позиций в Medusa cart`}</p>
        </div>
      </div>
      {loading ? (
        <div className="server-empty-state"><strong>Загрузка cart...</strong></div>
      ) : !cart || !items.length ? (
        <ConfiguredCartEmpty />
      ) : (
        <div className="server-cart-layout">
          <div className="server-cart-items">
            {items.map((line) => (
              <ConfiguredCartLine
                key={line.id}
                line={line}
                currencyCode={cart.currency_code}
                pending={pendingLine === line.id}
                onRemove={removeLine}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>
          <ConfiguredCartSummary cart={cart} />
        </div>
      )}
    </section>
  )
}
