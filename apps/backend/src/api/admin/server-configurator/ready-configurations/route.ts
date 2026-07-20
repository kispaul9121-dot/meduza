import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { createReadyConfigurationWorkflow } from "../../../../workflows/server-configurator/ready-configurations/create-ready-configuration"
import { ReadyConfigurationMutationBody } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const filters: Record<string, unknown> = {}
  for (const key of ["status", "server_model_id", "use_case", "featured"] as const) {
    if (req.query[key] !== undefined && req.query[key] !== "") {
      filters[key] = key === "featured" ? req.query[key] === "true" : req.query[key]
    }
  }
  const offset = Number(req.query.offset || 0)
  const limit = Math.min(Number(req.query.limit || 50), 200)
  const [rows, count] = await service.listAndCountReadyConfigurations(filters, {
    take: limit,
    skip: offset,
    order: { sort_order: "ASC", name: "ASC" },
  })
  res.json({ ready_configurations: rows, count, offset, limit })
}

export async function POST(req: MedusaRequest<ReadyConfigurationMutationBody>, res: MedusaResponse) {
  const { result } = await createReadyConfigurationWorkflow(req.scope).run({ input: req.validatedBody })
  res.status(201).json(result)
}
