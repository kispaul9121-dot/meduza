"use server"

import { revalidateTag } from "next/cache"
import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag, getCartId, setCartId } from "@lib/data/cookies"
import { HttpTypes } from "@medusajs/types"

export type AddConfiguredServerInput = {
  server_model_slug: string
  selected_components: Array<{
    component_id: string
    quantity: number
    type?: string
  }>
  quantity?: number
  customer_email?: string
  pricing_mode?: "calculated" | "request_quote"
  storage_option_id?: string
  explicit_none?: string[]
  ready_configuration_id?: string
  ready_configuration_version?: number
  ready_snapshot_hash?: string
}

export type ConfigurationQuoteInput = Omit<AddConfiguredServerInput, "pricing_mode"> & {
  company_name: string
  contact_name: string
  email: string
  phone?: string
  comments?: string
}

export type ConfiguredServerCartResponse = {
  cart: HttpTypes.StoreCart | null
  configuration: Record<string, unknown> | null
  line_item: HttpTypes.StoreCartLineItem | null
  valid: boolean
  errors: string[]
  warnings: string[]
  effective_specs: Record<string, unknown>
}

type CheckoutValidationResponse = { valid: boolean; errors: string[] }

const cartFields =
  "id,currency_code,total,subtotal,*items,*items.metadata,*items.product,*items.variant,+items.total,+items.unit_price"

async function revalidateCart() {
  const cartCacheTag = await getCacheTag("carts")
  if (cartCacheTag) revalidateTag(cartCacheTag)
}

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  )
}

function normalizeConfiguredCartResponse(
  value: unknown,
  fallbackMessage: string
): ConfiguredServerCartResponse {
  const payload = value && typeof value === "object"
    ? value as Partial<ConfiguredServerCartResponse>
    : {}
  const valid = payload.valid === true
  const errors = stringArray(payload.errors)
  const effectiveSpecs = payload.effective_specs && typeof payload.effective_specs === "object" && !Array.isArray(payload.effective_specs)
    ? payload.effective_specs
    : {}

  return {
    cart: payload.cart ?? null,
    configuration: payload.configuration ?? null,
    line_item: payload.line_item ?? null,
    valid,
    errors: valid || errors.length ? errors : [fallbackMessage],
    warnings: stringArray(payload.warnings),
    effective_specs: effectiveSpecs,
  }
}

function normalizeCheckoutValidation(
  value: unknown,
  fallbackMessage: string
): CheckoutValidationResponse {
  const payload = value && typeof value === "object"
    ? value as Partial<CheckoutValidationResponse>
    : {}
  const valid = payload.valid === true
  const errors = stringArray(payload.errors)

  return {
    valid,
    errors: valid || errors.length ? errors : [fallbackMessage],
  }
}

function errorPayload(error: unknown): ConfiguredServerCartResponse {
  const err = error as {
    message?: string
    response?: { data?: unknown }
  }
  const fallback = messageFromError(error, "Не удалось добавить конфигурацию в корзину.")
  return normalizeConfiguredCartResponse(err.response?.data, fallback)
}

export async function addConfiguredServerToCart(
  input: AddConfiguredServerInput
): Promise<ConfiguredServerCartResponse> {
  const cartId = await getCartId()
  const headers = { ...(await getAuthHeaders()) }

  try {
    const result = await sdk.client.fetch<ConfiguredServerCartResponse>(
      "/store/server-configurator/add-to-cart",
      {
        method: "POST",
        body: {
          cart_id: cartId || undefined,
          ...input,
        },
        headers,
        cache: "no-store",
      }
    )

    const normalized = normalizeConfiguredCartResponse(
      result,
      "Backend вернул неполный результат добавления конфигурации."
    )
    if (normalized.cart?.id) {
      await setCartId(normalized.cart.id)
    }
    await revalidateCart()
    return normalized
  } catch (error) {
    return errorPayload(error)
  }
}

export async function retrieveConfiguredCart() {
  const cartId = await getCartId()
  if (!cartId) return null

  const headers = { ...(await getAuthHeaders()) }
  return sdk.store.cart
    .retrieve(cartId, { fields: cartFields }, headers)
    .then(({ cart }) => cart)
    .catch(() => null)
}

export async function validateConfiguredCartForCheckout(): Promise<CheckoutValidationResponse> {
  const cartId = await getCartId()
  if (!cartId) return { valid: false, errors: ["Корзина не найдена."] }
  const headers = { ...(await getAuthHeaders()) }
  try {
    const result = await sdk.client.fetch<CheckoutValidationResponse>(
      "/store/server-configurator/cart/validate",
      { method: "POST", body: { cart_id: cartId }, headers, cache: "no-store" }
    )
    return normalizeCheckoutValidation(
      result,
      "Backend не вернул причину блокировки оформления заказа."
    )
  } catch (error) {
    const data = (error as { response?: { data?: unknown } })?.response?.data
    return normalizeCheckoutValidation(
      data,
      messageFromError(error, "Не удалось проверить конфигурацию перед оформлением заказа.")
    )
  }
}

export async function requestConfigurationQuote(input: ConfigurationQuoteInput) {
  const cartId = await getCartId()
  const headers = { ...(await getAuthHeaders()) }
  return sdk.client.fetch<{
    quote_request: { id: string; status: string }
    configuration: { id: string; hash: string }
    availability_warnings: string[]
  }>("/store/server-configurator/rfq", {
    method: "POST",
    body: { ...input, cart_id: cartId || undefined },
    headers,
    cache: "no-store",
  })
}

export async function updateConfiguredCartLine(lineId: string, quantity: number) {
  const cartId = await getCartId()
  if (!cartId) return null

  const headers = { ...(await getAuthHeaders()) }
  await sdk.client.fetch(`/store/server-configurator/cart/lines/${encodeURIComponent(lineId)}`, {
    method: "POST",
    body: { cart_id: cartId, quantity },
    headers,
    cache: "no-store",
  })
  await revalidateCart()
  return retrieveConfiguredCart()
}

export async function removeConfiguredCartLine(lineId: string) {
  const cartId = await getCartId()
  if (!cartId) return null

  const headers = { ...(await getAuthHeaders()) }
  await sdk.client.fetch(`/store/server-configurator/cart/lines/${encodeURIComponent(lineId)}?cart_id=${encodeURIComponent(cartId)}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  })
  await revalidateCart()
  return retrieveConfiguredCart()
}
