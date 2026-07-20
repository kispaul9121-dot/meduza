import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { createHelpAnnotationWorkflow } from "../../../../workflows/server-configurator/help-annotations/create-help-annotation"
import { CreateHelpAnnotationBody } from "../validators"

const filterKeys = ["page", "key", "severity", "source_doc_reference", "enabled"]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const filters = Object.fromEntries(
    filterKeys
      .filter((key) => req.query[key] !== undefined && req.query[key] !== "")
      .map((key) => [key, key === "enabled" ? req.query[key] === "true" : req.query[key]])
  )
  const [rows] = await service.listAndCountHelpAnnotations(filters, {
    take: 500,
    skip: 0,
    order: { sort_order: "ASC" },
  })
  const q = String(req.query.q || "").toLowerCase()
  const annotations = q
    ? rows.filter((item: any) => [item.title, item.body, item.key].join(" ").toLowerCase().includes(q))
    : rows
  const offset = Number(req.query.offset || 0)
  const limit = Number(req.query.limit || 100)

  res.json({ annotations: annotations.slice(offset, offset + limit), count: annotations.length })
}

export async function POST(req: MedusaRequest<CreateHelpAnnotationBody>, res: MedusaResponse) {
  const { result } = await createHelpAnnotationWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json(result)
}
