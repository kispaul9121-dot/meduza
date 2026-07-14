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
}

export type ConfiguredServerCartResponse = {
  cart: HttpTypes.StoreCart | null
  configuration: Record<string, any> | null
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
  const err = error as any
  const data = err?.response?.data
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

export async function updateConfiguredCartLine(lineId: string, quantity: number) {
  const cartId = await getCartId()
  if (!cartId) return null

  const headers = { ...(await getAuthHeaders()) }
  await sdk.store.cart.updateLineItem(cartId, lineId, { quantity }, {}, headers)
  await revalidateCart()
  return retrieveConfiguredCart()
}

export async function removeConfiguredCartLine(lineId: string) {
  const cartId = await getCartId()
  if (!cartId) return null

  const headers = { ...(await getAuthHeaders()) }
  await sdk.store.cart.deleteLineItem(cartId, lineId, {}, headers)
  await revalidateCart()
  return retrieveConfiguredCart()
}
