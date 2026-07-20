import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { analyzePropertyCompleteness } from "../../../../../modules/server-configurator/genius-bootstrap";
import { PropertyCompletenessBody } from "../../validators";

export async function POST(
  req: MedusaRequest<PropertyCompletenessBody>,
  res: MedusaResponse,
) {
  res.json({
    ...analyzePropertyCompleteness(req.validatedBody),
    writes_performed: false,
  });
}
