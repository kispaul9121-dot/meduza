"use client"

import { useState } from "react"
import Link from "next/link"
import { addConfiguredServerToCart } from "@lib/server-configurator/cart-api"
import { ReadyConfiguration } from "@lib/server-configurator/data"
import { useServerLocalActions } from "./local-actions"

export function ReadyConfigurationActions({ ready }: { ready: ReadyConfiguration }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const local = useServerLocalActions(ready.id)
  const snapshot = ready.version.snapshot

  async function addToCart() {
    setPending(true)
    const result = await addConfiguredServerToCart({
      server_model_slug: snapshot.server_model.slug,
      selected_components: snapshot.selected_components.map((item) => ({ component_id: item.component_id, quantity: item.quantity, type: item.type || undefined })),
      pricing_mode: "calculated",
      storage_option_id: snapshot.topology.storage_option_id || undefined,
      explicit_none: snapshot.explicit_none,
      ready_configuration_id: ready.id,
      ready_configuration_version: ready.version.version,
      ready_snapshot_hash: ready.version.snapshot_hash,
    })
    setMessage(result.valid ? "Готовая конфигурация добавлена в корзину." : result.errors.join(" "))
    setPending(false)
  }

  function requestQuote() {
    local.requestQuote()
    window.location.assign(`/rfq?ready=${encodeURIComponent(ready.slug)}`)
  }

  return (
    <div className="ready-actions">
      {ready.primary_action === "add_to_cart" ? (
        <button className="server-primary" type="button" disabled={!ready.available_for_order || pending} onClick={addToCart}>{pending ? "Добавляем…" : "Добавить в корзину"}</button>
      ) : (
        <button className="server-primary" type="button" disabled={!ready.available_for_order} onClick={requestQuote}>Запросить расчёт</button>
      )}
      <Link className="server-secondary" href={`/servers/${snapshot.server_model.slug}?ready=${encodeURIComponent(ready.slug)}`}>Изменить в конфигураторе</Link>
      {message ? <p role="status">{message}</p> : null}
      {!ready.available_for_order ? <p role="alert">Версия недоступна: {ready.stale_reasons.join(", ") || "не прошла публикацию"}.</p> : null}
    </div>
  )
}
