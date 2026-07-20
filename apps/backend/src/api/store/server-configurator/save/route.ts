import crypto from "node:crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { ValidateServerConfigurationSchemaType } from "../validators"

export async function POST(req: MedusaRequest<ValidateServerConfigurationSchemaType>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const body = req.validatedBody as any
  const result = await service.validateConfiguration(body)
  const [serverModel] = await service.listServerModels({ slug: body.server_model_slug })
  const snapshot = {
    server_model: serverModel,
    selected_components: body.selected_components || [],
    validation: result,
  }
  const hash = crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")
  const configuration = await service.createConfigurations({
    server_model_id: serverModel.id,
    medusa_cart_id: body.medusa_cart_id || null,
    medusa_line_item_id: null,
    status: result.valid ? "valid" : "invalid",
    total_price: result.total_price,
    effective_specs_json: result.effective_specs,
    warnings_json: result.warnings,
    errors_json: result.errors,
    snapshot_json: snapshot,
    hash,
  })

  res.status(201).json({ configuration, snapshot })
}
