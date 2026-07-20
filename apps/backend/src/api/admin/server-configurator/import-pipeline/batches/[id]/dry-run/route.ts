import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../../../modules/server-configurator";
import { buildImportDryRun } from "../../../../../../../modules/server-configurator/import-apply";
import { ImportBatchDryRunBody } from "../../../../validators";
import { permissionFor } from "../../../_shared";

export async function POST(req: MedusaRequest<ImportBatchDryRunBody>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const batch = await service.retrieveImportBatch(req.params.id);
  const rows = await service.listImportStagedRecords({ batch_id: batch.id }, { take: 10000 });
  const result = buildImportDryRun(rows, req.validatedBody.approved_groups);
  const updated = await service.updateImportBatches({
    id: batch.id,
    status: result.apply_available ? "dry_run_ready" : "in_review",
    dry_run: true,
    errors_json: result.blockers,
  });
  res.json({ batch: updated, result, permission: await permissionFor(req) });
}
