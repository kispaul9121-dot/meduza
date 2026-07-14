import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(_req: MedusaRequest, res: MedusaResponse) {
  res.status(202).json({
    accepted: true,
    message: "HPE docs import endpoint is reserved for the next parser pass. Current seed uses local HPE QuickSpecs references.",
  })
}
