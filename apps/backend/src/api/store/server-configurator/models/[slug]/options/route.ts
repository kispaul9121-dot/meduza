import { MedusaError } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../../modules/server-configurator"

function selectionFromQuery(req: MedusaRequest) {
  const selected = typeof req.query.selected === "string" ? req.query.selected.split(",").filter(Boolean) : []
  return selected.map((value) => {
    const [component_id, rawQuantity] = value.split(":")
    const quantity = Number(rawQuantity || 1)
    return { component_id, quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1 }
  })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const result = await service.getCompatibilityOptions({
    server_model_slug: req.params.slug,
    storage_option_id: typeof req.query.storage_option_id === "string" ? req.query.storage_option_id : undefined,
    selected_components: selectionFromQuery(req),
    explicit_none: typeof req.query.explicit_none === "string" ? req.query.explicit_none.split(",").filter(Boolean) : [],
  })
  if (!result.model) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Server model not found")
  res.json({ ...result, source: "compatibility_engine" })
}
