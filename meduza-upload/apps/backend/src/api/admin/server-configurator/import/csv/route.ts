import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(_req: MedusaRequest, res: MedusaResponse) {
  res.status(202).json({
    accepted: true,
    message: "CSV import route is scaffolded. Upload parsing can be added without changing the module schema.",
  })
}
