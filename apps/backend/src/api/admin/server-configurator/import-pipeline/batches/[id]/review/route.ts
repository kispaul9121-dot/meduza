import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../../../modules/server-configurator";
import { ImportBatchReviewBody } from "../../../../validators";
import { actorId } from "../../../_shared";

export async function POST(req: MedusaRequest<ImportBatchReviewBody>, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const body = req.validatedBody;
  const batch = await service.retrieveImportBatch(req.params.id);
  if (["applying", "applied"].includes(batch.status))
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "An applying or applied batch cannot be edited.");
  const batchRows = await service.listImportStagedRecords({ batch_id: batch.id }, { take: 10000 });
  const allowed = new Set(batchRows.map((row: any) => row.id));
  for (const row of body.rows) {
    if (!allowed.has(row.id)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Record ${row.id} does not belong to this batch.`);
    await service.updateImportStagedRecords({
      id: row.id,
      review_status: row.review_status,
      classification_confirmed: row.classification_confirmed || null,
      ...(row.normalized_payload ? { normalized_payload_json: row.normalized_payload } : {}),
    });
  }
  const updatedRows = await service.listImportStagedRecords({ batch_id: batch.id }, { take: 10000, order: { sequence: "ASC" } });
  const approvedCount = updatedRows.filter((row: any) => row.review_status === "approved").length;
  const updatedBatch = await service.updateImportBatches({
    id: batch.id,
    status: "in_review",
    reviewer_id: actorId(req),
    review_status: body.review_status,
    counts_json: { ...batch.counts_json, approved: approvedCount, rejected: updatedRows.filter((row: any) => row.review_status === "rejected").length },
  });
  res.json({ batch: updatedBatch, records: updatedRows });
}
