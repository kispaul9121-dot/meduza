import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator";
import { createTechnicalImportBatch } from "../../../../../modules/server-configurator/import-batch-service";
import { ImportBatchCreateBody } from "../../validators";
import { actorId } from "../_shared";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const [batches, count] = await service.listAndCountImportBatches(
    {},
    { take: 100, order: { created_at: "DESC" } },
  );
  res.json({ batches, count });
}

export async function POST(req: MedusaRequest<ImportBatchCreateBody>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const body = req.validatedBody;
  const result = await createTechnicalImportBatch(service, body, actorId(req));
  res.status(result.reused ? 200 : 201).json(result);
}
