import crypto from "node:crypto"
import { QueryContext } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../modules/server-configurator"
import type {
  AddConfiguredServerToCartInput,
  CommercePriceLine,
  ConfiguredServerPriceResult,
  ConfiguredServerValidationResult,
} from "./types"

const PRICE_TTL_MS = 15 * 60 * 1000

function amount(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function variantAvailability(variant: any, required: number) {
  if (variant?.manage_inventory === false) return "available" as const
  const available = amount(variant?.inventory_quantity) || 0
  if (available >= required) return "available" as const
  if (variant?.allow_backorder) return "backorder" as const
  return "unavailable" as const
}

export function calculatedVariantAmount(variant: any) {
  return amount(
    variant?.calculated_price?.calculated_amount ??
      variant?.calculated_price?.calculated_price?.amount
  )
}

function hash(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

export function applyCommerceAdjustments(
  subtotal: number,
  rules: any[],
  currencyCode: string
) {
  const lines: CommercePriceLine[] = []
  let total = subtotal
  for (const rule of rules) {
    const action = rule.action_json || {}
    if (action.add_price !== undefined) {
      const adjustment = Number(action.add_price)
      total += adjustment
      lines.push({
        kind: "adjustment",
        reference_id: rule.id,
        label: rule.name || "Price adjustment",
        quantity: 1,
        unit_amount: adjustment,
        total_amount: adjustment,
        currency_code: currencyCode,
        price_source: "compatibility_rule:add_price",
        availability: "available",
        technical: true,
      })
    }
    if (action.multiply_price !== undefined) {
      const next = total * Number(action.multiply_price)
      const adjustment = next - total
      total = next
      lines.push({
        kind: "adjustment",
        reference_id: rule.id,
        label: rule.name || "Price multiplier",
        quantity: 1,
        unit_amount: adjustment,
        total_amount: adjustment,
        currency_code: currencyCode,
        price_source: "compatibility_rule:multiply_price",
        availability: "available",
        technical: true,
      })
    }
  }
  return { total, lines }
}

async function commerceContext(container: any, input: AddConfiguredServerToCartInput) {
  const query = container.resolve("query")
  if (input.cart_id) {
    const { data } = await query.graph({
      entity: "cart",
      fields: ["id", "region_id", "currency_code", "customer_id", "completed_at"],
      filters: { id: input.cart_id },
    })
    const cart = data?.[0]
    if (!cart || cart.completed_at) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cart is missing or already completed.")
    }
    if (cart.customer_id && cart.customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cart does not belong to the signed-in customer.")
    }
    return { cart, region_id: cart.region_id || null, currency_code: String(cart.currency_code).toLowerCase() }
  }
  const { data } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    pagination: { take: 1 },
  })
  const region = data?.[0]
  if (!region?.currency_code) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "No Medusa region is available for pricing.")
  }
  return { cart: null, region_id: region.id, currency_code: String(region.currency_code).toLowerCase() }
}

export async function resolveCommercePrice(input: {
  container: any
  request: AddConfiguredServerToCartInput
  validation: ConfiguredServerValidationResult
}): Promise<ConfiguredServerPriceResult> {
  const { container, request, validation } = input
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const query = container.resolve("query")
  const context = await commerceContext(container, request)
  const requested = new Map(
    request.selected_components.map((item) => [item.component_id, Math.max(1, item.quantity || 1)])
  )
  for (const id of validation.auto_added_components || []) {
    if (!requested.has(id)) requested.set(id, 1)
  }
  const componentIds = [...requested.keys()]
  const components = componentIds.length
    ? await service.listComponents({ id: componentIds }, { take: componentIds.length })
    : []
  const byComponentId = new Map(components.map((component: any) => [component.id, component]))
  const variantIds = [
    validation.server_model.medusa_variant_id,
    ...components.map((component: any) => component.medusa_product_variant_id).filter(Boolean),
  ]
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "manage_inventory",
      "allow_backorder",
      "inventory_quantity",
      "calculated_price.*",
      "product.status",
    ],
    filters: { id: variantIds },
    context: {
      calculated_price: QueryContext({
        region_id: context.region_id,
        currency_code: context.currency_code,
      }),
    },
    pagination: { take: Math.max(variantIds.length, 1) },
  })
  const byVariantId = new Map((variants || []).map((variant: any) => [variant.id, variant]))
  const lines: CommercePriceLine[] = []
  const errors: string[] = []
  const serverQuantity = Math.max(1, request.quantity || 1)

  const addVariantLine = (entry: {
    kind: CommercePriceLine["kind"]
    reference_id: string
    label: string
    variant_id: string | null
    quantity: number
    technical: boolean
  }) => {
    if (!entry.variant_id) {
      errors.push(`${entry.label}: отсутствует Medusa variant для продажи.`)
      return
    }
    const variant: any = byVariantId.get(entry.variant_id)
    if (!variant || variant.product?.status !== "published") {
      errors.push(`${entry.label}: вариант недоступен или товар не опубликован.`)
      return
    }
    const unitAmount = calculatedVariantAmount(variant)
    if (unitAmount === null || unitAmount < 0) {
      errors.push(`${entry.label}: нет актуальной цены ${context.currency_code.toUpperCase()}.`)
      return
    }
    const stock = variantAvailability(variant, entry.quantity * serverQuantity)
    if (stock === "unavailable") {
      errors.push(`${entry.label}: недостаточный доступный остаток.`)
    }
    lines.push({
      kind: entry.kind,
      reference_id: entry.reference_id,
      label: entry.label,
      quantity: entry.quantity,
      unit_amount: unitAmount,
      total_amount: unitAmount * entry.quantity,
      currency_code: context.currency_code,
      medusa_variant_id: entry.variant_id,
      price_source: "medusa_calculated_price",
      availability: stock,
      technical: entry.technical,
    })
  }

  addVariantLine({
    kind: "base",
    reference_id: validation.server_model.id,
    label: validation.server_model.public_name,
    variant_id: validation.server_model.medusa_variant_id,
    quantity: 1,
    technical: false,
  })
  for (const [componentId, quantity] of requested) {
    const component: any = byComponentId.get(componentId)
    if (!component || component.enabled === false) {
      errors.push(`${componentId}: компонент отключён или удалён.`)
      continue
    }
    const supplierState = String(component.normalized_specs_json?.supplier_availability || "").toLowerCase()
    if (["unavailable", "discontinued", "out_of_stock"].includes(supplierState)) {
      errors.push(`${component.public_name}: поставщик не подтверждает доступность.`)
    }
    const auto = (validation.auto_added_components || []).includes(componentId)
    addVariantLine({
      kind: component.type === "service" ? "service" : auto ? "bundle" : "component",
      reference_id: component.id,
      label: component.public_name,
      variant_id: component.medusa_product_variant_id || null,
      quantity,
      technical: auto,
    })
  }

  const triggeredIds = (validation.triggered_rules || []).map((rule: any) => rule.id).filter(Boolean)
  const rules = triggeredIds.length
    ? await service.listCompatibilityRules({ id: triggeredIds }, { take: triggeredIds.length })
    : []
  const subtotal = lines.reduce((sum, line) => sum + line.total_amount, 0)
  const adjusted = applyCommerceAdjustments(subtotal, rules, context.currency_code)
  lines.push(...adjusted.lines)
  const now = new Date()
  const expires = new Date(now.getTime() + PRICE_TTL_MS)
  const requestedQuote = request.pricing_mode === "request_quote"
  const pricePayload = {
    currency_code: context.currency_code,
    region_id: context.region_id,
    total_price: adjusted.total,
    lines,
  }
  return {
    total_price: adjusted.total,
    pricing_mode: requestedQuote ? "request_quote" : "calculated",
    request_quote: requestedQuote,
    currency_code: context.currency_code,
    region_id: context.region_id,
    priced_at: now.toISOString(),
    price_expires_at: expires.toISOString(),
    lines,
    price_hash: hash(pricePayload),
    availability_errors: errors,
  }
}
