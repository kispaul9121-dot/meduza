import crypto from "node:crypto"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { SERVER_CONFIGURATOR_MODULE } from "../modules/server-configurator"

export default async function configuredServerOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query") as any
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "cart_id",
      "customer_id",
      "currency_code",
      "total",
      "created_at",
      "items.id",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "items.metadata",
    ],
    filters: { id: data.id },
  })
  const order = orders?.[0]
  if (!order) return
  for (const item of order.items || []) {
    const configurationId = item.metadata?.configuration_id
    if (!configurationId) continue
    const [configuration] = await service.listConfigurations({ id: configurationId })
    if (!configuration || configuration.order_snapshot_hash) continue
    const orderSnapshot = {
      schema: "commerce.order-configuration.v1",
      order: {
        id: order.id,
        cart_id: order.cart_id,
        customer_id: order.customer_id,
        currency_code: order.currency_code,
        created_at: order.created_at,
      },
      line: {
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      },
      configuration_id: configuration.id,
      configuration_hash: configuration.hash,
      technical_snapshot: configuration.snapshot_json,
    }
    const orderSnapshotHash = crypto.createHash("sha256").update(JSON.stringify(orderSnapshot)).digest("hex")
    await service.updateConfigurations({
      id: configuration.id,
      medusa_order_id: order.id,
      medusa_customer_id: order.customer_id || configuration.medusa_customer_id,
      status: "ordered",
      order_snapshot_json: orderSnapshot,
      order_snapshot_hash: orderSnapshotHash,
      ordered_at: new Date(),
    })
  }
}

export const config: SubscriberConfig = { event: "order.placed" }
