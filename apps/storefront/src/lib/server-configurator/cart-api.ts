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

const cartFields =
  "id,currency_code,total,subtotal,*items,*items.metadata,*items.product,*items.variant,+items.total,+items.unit_price"

async function revalidateCart() {
  const cartCacheTag = await getCacheTag("carts")
  if (cartCacheTag) revalidateTag(cartCacheTag)
}

function errorPayload(error: unknown): ConfiguredServerCartResponse {
  const err = error as {
    message?: string
    response?: { data?: unknown }
  }
  const data = err.response?.data
  if (data && typeof data === "object" && "valid" in data) {
    return data as ConfiguredServerCartResponse
  }
  return {
    cart: null,
    configuration: null,
    line_item: null,
    valid: false,
    errors: [err?.message || "Не удалось добавить конфигурацию в корзину."],
    warnings: [],
    effective_specs: {},
  }
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

    if (result.cart?.id) {
      await setCartId(result.cart.id)
    }
    await revalidateCart()
    return result
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

export async function validateConfiguredCartForCheckout(): Promise<{ valid: boolean; errors: string[] }> {
  const cartId = await getCartId()
  if (!cartId) return { valid: false, errors: ["Корзина не найдена."] }
  const headers = { ...(await getAuthHeaders()) }
  try {
    const result = await sdk.client.fetch<{ valid: boolean; errors: string[] }>(
      "/store/server-configurator/cart/validate",
      { method: "POST", body: { cart_id: cartId }, headers, cache: "no-store" }
    )
    return { valid: result.valid === true, errors: result.errors || [] }
  } catch (error) {
    const data = (error as { response?: { data?: { valid?: boolean; errors?: string[] } } })?.response?.data
    return data?.errors
      ? { valid: data.valid === true, errors: data.errors }
      : { valid: false, errors: [(error as Error).message] }
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
