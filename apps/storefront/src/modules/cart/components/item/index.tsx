"use client"

import { Table, Text, clx } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"
import { removeConfiguredCartLine, updateConfiguredCartLine } from "@lib/server-configurator/cart-api"
import {
  componentLine,
  configuredMetadata,
  customerChoice,
  isConfiguredServerLine,
} from "@modules/server-configurator/cart-format"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await (configured
      ? updateConfiguredCartLine(item.id, quantity)
      : updateLineItem({ lineId: item.id, quantity }))
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory
  const configured = isConfiguredServerLine(item)
  const metadata = configuredMetadata(item)

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={configured ? `/servers/${metadata.server_model_slug}` : `/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
        {configured ? (
          <div className="mt-3 space-y-2 text-sm" data-testid="configured-server-snapshot">
            <p className="text-ui-fg-subtle">
              Конфигурация {metadata.configuration_id} · hash {metadata.configuration_hash?.slice(0, 12)}… · {metadata.pricing_mode}
            </p>
            <p><strong>Топология:</strong> {metadata.storage?.public_name || "не выбрана"}</p>
            <dl className="grid grid-cols-1 small:grid-cols-2 gap-x-4">
              <div><dt>CPU</dt><dd>{componentLine(metadata, "cpu")}</dd></div>
              <div><dt>Память</dt><dd>{componentLine(metadata, "ram")}</dd></div>
              <div><dt>Диски</dt><dd>{componentLine(metadata, "drive")}</dd></div>
              <div><dt>RAID / HBA</dt><dd>{componentLine(metadata, "raid")}</dd></div>
              <div><dt>Сеть</dt><dd>{componentLine(metadata, "nic")}</dd></div>
              <div><dt>Питание</dt><dd>{componentLine(metadata, "psu")}</dd></div>
            </dl>
            <p>{customerChoice(metadata, "m2", "M.2 board")}</p>
            <p>{customerChoice(metadata, "gpu", "GPU")}</p>
            <p>{customerChoice(metadata, "rails", "Rails")}</p>
            {metadata.optional_groups?.length ? (
              <p>Опции: {metadata.optional_groups.map((group) => `${group.title} — ${group.state === "explicit_none" ? "явно не выбрано" : group.state === "selected" ? "выбрано" : "не применяется"}`).join("; ")}</p>
            ) : null}
            {metadata.auto_added_components?.length ? (
              <details><summary>Технические auto-added позиции ({metadata.auto_added_components.length})</summary><ul>{metadata.auto_added_components.map((component) => <li key={component.component_id}>{component.quantity} × {component.public_name}</li>)}</ul></details>
            ) : null}
            {metadata.effective_specs ? <details><summary>Эффективные характеристики</summary><pre className="whitespace-pre-wrap">{JSON.stringify(metadata.effective_specs, null, 2)}</pre></details> : null}
            {metadata.warnings?.map((warning) => <p className="text-amber-700" key={warning}>⚠ {warning}</p>)}
            <p className="text-ui-fg-muted">Проверка: {metadata.validation_engine_version}; price hash {metadata.price_hash?.slice(0, 12)}…</p>
          </div>
        ) : null}
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-2 items-center w-28">
            {configured ? (
              <button type="button" data-testid="product-delete-button" aria-label="Удалить конфигурацию" onClick={() => removeConfiguredCartLine(item.id)}>
                Удалить
              </button>
            ) : <DeleteButton id={item.id} data-testid="product-delete-button" />}
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-14 h-10 p-4"
              data-testid="product-select-button"
            >
              {/* TODO: Update this with the v2 way of managing inventory */}
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}

              <option value={1} key={1}>
                1
              </option>
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
