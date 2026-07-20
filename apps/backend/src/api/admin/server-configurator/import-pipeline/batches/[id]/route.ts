import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../../modules/server-configurator";
import { permissionFor } from "../../_shared";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const batch = await service.retrieveImportBatch(req.params.id);
  const [records, attempts, permission] = await Promise.all([
    service.listImportStagedRecords({ batch_id: batch.id }, { take: 10000, order: { sequence: "ASC" } }),
    service.listImportApplyAttempts({ batch_id: batch.id }, { take: 100, order: { created_at: "DESC" } }),
    permissionFor(req),
  ]);
  res.json({ batch, records, attempts, permission });
}
