import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator";
import { createTechnicalImportBatch } from "../../../../../modules/server-configurator/import-batch-service";
import { recordsFromGeniusManifest } from "../../../../../modules/server-configurator/import-pipeline";
import { ImportGeniusManifestBody } from "../../validators";
import { actorId } from "../_shared";

export async function POST(req: MedusaRequest<ImportGeniusManifestBody>, res: MedusaResponse) {
  const body = req.validatedBody;
  const result = await createTechnicalImportBatch(
    req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any,
    {
      source_type: "genius_manifest",
      adapter_key: body.adapter_key,
      file_name: `genius-${body.creation_manifest_id}.json`,
      source_schema_version: Number(body.manifest.manifest_version || 1),
      records: recordsFromGeniusManifest(body.manifest),
      creation_manifest_id: body.creation_manifest_id,
      wizard_session_id: body.wizard_session_id,
    },
    actorId(req),
  );
  res.status(result.reused ? 200 : 201).json({
    ...result,
    shared_manifest: true,
    next: `/app/server-configurator/import-pipeline?batch=${result.batch.id}`,
  });
}
