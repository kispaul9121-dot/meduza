import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { createComponentWorkflow } from "../../../../workflows/server-configurator/components/create-component"
import { CreateComponentBody } from "../validators"

const directFilterKeys = ["type", "brand", "enabled"]
const specFilterKeys = [
  "source_doc_reference",
  "logical_group",
  "vendor_platform",
  "slot_type",
  "interface",
  "form_factor",
  "xeon_scalable_generation",
  "platform_generation",
  "socket",
  "cores",
  "tdp_w",
  "max_memory_speed_mhz",
  "code_name",
  "suffix",
  "needs_review",
  "cores_min",
  "cores_max",
  "tdp_w_min",
  "tdp_w_max",
  "max_memory_speed_mhz_min",
  "max_memory_speed_mhz_max",
]

function matchesSpec(component: any, key: string, value: unknown) {
  if (value === undefined || value === "") return true
  const specs = component.specs_json || {}
  const direct = specs[key]
  const nested = specs.raw_source?.[key]
  if (key.endsWith("_min")) return Number(specs[key.replace(/_min$/, "")]) >= Number(value)
  if (key.endsWith("_max")) return Number(specs[key.replace(/_max$/, "")]) <= Number(value)
  if (key === "needs_review") return String(Boolean(direct)) === String(value)
  return [direct, nested].map((item) => String(item || "").toLowerCase()).includes(String(value).toLowerCase())
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const filters = Object.fromEntries(
    directFilterKeys
      .filter((key) => req.query[key] !== undefined && req.query[key] !== "")
      .map((key) => [key, key === "enabled" ? req.query[key] === "true" : req.query[key]])
  )
  const [rows] = await service.listAndCountComponents(filters, {
    take: 1000,
    skip: 0,
    order: { type: "ASC", public_name: "ASC" },
  })
  const q = String(req.query.q || "").toLowerCase()
  const filtered = rows.filter((component: any) => {
    const text = [component.public_name, component.short_name, component.model, component.part_number, component.brand]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return (!q || text.includes(q)) && specFilterKeys.every((key) => matchesSpec(component, key, req.query[key]))
  })
  const offset = Number(req.query.offset || 0)
  const limit = Number(req.query.limit || 100)

  res.json({ components: filtered.slice(offset, offset + limit), count: filtered.length })
}

export async function POST(req: MedusaRequest<CreateComponentBody>, res: MedusaResponse) {
  const { result } = await createComponentWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json(result)
}
