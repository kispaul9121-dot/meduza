import fs from "node:fs"
import path from "node:path"
import {
  applyCommerceAdjustments,
  resolveCommercePrice,
  variantAvailability,
} from "../../../workflows/server-configurator-cart/commerce-pricing"
import { AddConfiguredServerToCartSchema, RequestConfigurationQuoteSchema } from "../../../api/store/server-configurator/validators"
import { resolveValidatorKey } from "../engine/validators"

const root = path.resolve(__dirname, "../../../..")

describe("stage 12 commerce safety", () => {
  test("base, component, bundle/service and adjustments remain currency-aware", () => {
    const adjusted = applyCommerceAdjustments(1500, [
      { id: "rule-fee", name: "Assembly", action_json: { add_price: 100 } },
      { id: "rule-factor", name: "Risk", action_json: { multiply_price: 1.1 } },
    ], "eur")
    expect(adjusted.total).toBeCloseTo(1760)
    expect(adjusted.lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ currency_code: "eur", price_source: "compatibility_rule:add_price" }),
      expect.objectContaining({ currency_code: "eur", price_source: "compatibility_rule:multiply_price" }),
    ]))
  })

  test("inventory honours unmanaged stock and backorders but rejects insufficient managed stock", () => {
    expect(variantAvailability({ manage_inventory: false }, 500)).toBe("available")
    expect(variantAvailability({ manage_inventory: true, inventory_quantity: 1, allow_backorder: true }, 2)).toBe("backorder")
    expect(variantAvailability({ manage_inventory: true, inventory_quantity: 1, allow_backorder: false }, 2)).toBe("unavailable")
  })

  test("calculated pricing includes the Medusa base variant and never technical component.price", async () => {
    const components = [{
      id: "cmp_cpu",
      type: "cpu",
      public_name: "CPU",
      enabled: true,
      price: 999999,
      medusa_product_variant_id: "variant_cpu",
      normalized_specs_json: {},
    }]
    const service = {
      listComponents: jest.fn().mockResolvedValue(components),
      listCompatibilityRules: jest.fn().mockResolvedValue([]),
    }
    const query = {
      graph: jest.fn(async ({ entity }: any) => entity === "region"
        ? { data: [{ id: "reg", currency_code: "eur" }] }
        : { data: [
            { id: "variant_base", product: { status: "published" }, manage_inventory: false, calculated_price: { calculated_amount: 1000 } },
            { id: "variant_cpu", product: { status: "published" }, manage_inventory: false, calculated_price: { calculated_amount: 250 } },
          ] }),
    }
    const result = await resolveCommercePrice({
      container: { resolve: (key: string) => key === "query" ? query : service },
      request: { server_model_slug: "server", selected_components: [{ component_id: "cmp_cpu", quantity: 2 }], pricing_mode: "calculated" },
      validation: { valid: true, errors: [], warnings: [], effective_specs: {}, total_price: 999999, server_model: { id: "srv", public_name: "Server", medusa_variant_id: "variant_base" } },
    })
    expect(result.total_price).toBe(1500)
    expect(result.lines[0]).toMatchObject({ kind: "base", total_amount: 1000, currency_code: "eur" })
    expect(result.lines[1]).toMatchObject({ kind: "component", total_amount: 500 })
  })

  test("partial availability is explicit and calculated checkout cannot silently accept it", async () => {
    const service = { listComponents: jest.fn().mockResolvedValue([]), listCompatibilityRules: jest.fn().mockResolvedValue([]) }
    const query = { graph: jest.fn(async ({ entity }: any) => entity === "region"
      ? { data: [{ id: "reg", currency_code: "usd" }] }
      : { data: [{ id: "variant_base", product: { status: "published" }, manage_inventory: true, inventory_quantity: 0, allow_backorder: false, calculated_price: { calculated_amount: 1000 } }] }) }
    const result = await resolveCommercePrice({
      container: { resolve: (key: string) => key === "query" ? query : service },
      request: { server_model_slug: "server", selected_components: [], pricing_mode: "calculated" },
      validation: { valid: true, errors: [], warnings: [], effective_specs: {}, total_price: 0, server_model: { id: "srv", public_name: "Server", medusa_variant_id: "variant_base" } },
    })
    expect(result.availability_errors).toContain("Server: недостаточный доступный остаток.")
  })

  test("purchase and RFQ payloads are separate and bounded", () => {
    expect(AddConfiguredServerToCartSchema.safeParse({ server_model_slug: "s", pricing_mode: "request_quote" }).success).toBe(false)
    expect(RequestConfigurationQuoteSchema.safeParse({
      server_model_slug: "s",
      company_name: "ACME",
      contact_name: "Buyer",
      email: "buyer@example.com",
      quantity: 1,
      comments: "x".repeat(4001),
    }).success).toBe(false)
  })

  test("published versioned component validator keys resolve deterministically", () => {
    expect(resolveValidatorKey("component.cpu.v1")).toBe("cpu")
    expect(resolveValidatorKey("component.ram.v1")).toBe("memory")
    expect(resolveValidatorKey("component.drive_cage.v1")).toBe("storage")
    expect(resolveValidatorKey("component.nic.v1")).toBe("network")
  })

  test("order and RFQ snapshots have database immutability guards", () => {
    const migration = fs.readFileSync(path.join(root, "src/modules/server-configurator/migrations/Migration20260720223000.ts"), "utf8")
    expect(migration).toContain("quote_request_snapshot_immutable")
    expect(migration).toContain("configuration_order_snapshot_immutable")
    const subscriber = fs.readFileSync(path.join(root, "src/subscribers/configured-server-order-placed.ts"), "utf8")
    expect(subscriber).toContain('event: "order.placed"')
    expect(subscriber).toContain("order_snapshot_hash")
  })

  test("cart/RFQ workflows expose compensation for persisted artifacts", () => {
    const cartStep = fs.readFileSync(path.join(root, "src/workflows/server-configurator-cart/steps/add-base-variant-to-cart-step.ts"), "utf8")
    const saveStep = fs.readFileSync(path.join(root, "src/workflows/server-configurator-cart/steps/save-configuration-step.ts"), "utf8")
    const rfq = fs.readFileSync(path.join(root, "src/workflows/server-configurator-cart/request-configuration-quote.ts"), "utf8")
    expect(cartStep).toContain("deleteCarts")
    expect(cartStep).toContain("updateLineItemInCartWorkflow")
    expect(saveStep).toContain("deleteConfigurationItems")
    expect(rfq).toContain("deleteQuoteRequests")
  })
})
