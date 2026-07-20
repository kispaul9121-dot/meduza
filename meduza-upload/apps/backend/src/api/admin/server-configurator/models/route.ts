import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { createServerModelWorkflow } from "../../../../workflows/server-configurator/models/create-server-model"
import { CreateServerModelBody } from "../validators"

const filterKeys = ["brand", "family", "generation", "model", "chassis_type", "form_factor", "enabled"]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const filters = Object.fromEntries(
    filterKeys
      .filter((key) => req.query[key] !== undefined && req.query[key] !== "")
      .map((key) => [key, key === "enabled" ? req.query[key] === "true" : req.query[key]])
  )
  const [rows] = await service.listAndCountServerModels(filters, {
    take: 500,
    skip: 0,
    order: { public_name: "ASC" },
  })
  const q = String(req.query.q || "").toLowerCase()
  const filtered = q
    ? rows.filter((model: any) =>
        [model.public_name, model.slug, model.brand, model.family, model.model]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : rows
  const offset = Number(req.query.offset || 0)
  const limit = Number(req.query.limit || 50)

  res.json({ models: filtered.slice(offset, offset + limit), count: filtered.length })
}

export async function POST(req: MedusaRequest<CreateServerModelBody>, res: MedusaResponse) {
  const { result } = await createServerModelWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json(result)
}
