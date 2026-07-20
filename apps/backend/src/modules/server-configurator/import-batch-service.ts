import {
  adapterFor,
  buildImportPreview,
  contentHash,
  normalizeSourceRecord,
  VendorSourceRecord,
} from "./import-pipeline";

export type CreateTechnicalBatchInput = {
  source_type: "json" | "csv" | "document" | "genius_manifest";
  adapter_key: string;
  file_name?: string;
  source_schema_version: number;
  records: VendorSourceRecord[];
  previous_source_identities?: string[];
  creation_manifest_id?: string;
  wizard_session_id?: string;
};

export async function loadTechnicalImportBatch(service: any, batch: any, reused = false) {
  const records = await service.listImportStagedRecords(
    { batch_id: batch.id },
    { take: 10000, order: { sequence: "ASC" } },
  );
  return { batch, records, reused };
}

export async function createTechnicalImportBatch(
  service: any,
  input: CreateTechnicalBatchInput,
  actorId: string,
) {
  const adapter = adapterFor(input.adapter_key);
  const fileHash = contentHash({ schema_version: input.source_schema_version, records: input.records });
  const fileIdentity = `${adapter.key}:${input.source_schema_version}:${fileHash}`;
  const [existingBatch] = await service.listImportBatches({ file_identity: fileIdentity });
  if (existingBatch) return loadTechnicalImportBatch(service, existingBatch, true);

  const stableKeys = input.records.map((record) => normalizeSourceRecord(record, adapter).stable_key);
  const matchingRows = await service.listImportStagedRecords(
    { stable_key: stableKeys },
    { take: 10000 },
  ).catch(() => []);
  const removedRows = input.previous_source_identities?.length
    ? await service.listImportStagedRecords(
        { source_identity: input.previous_source_identities },
        { take: 10000 },
      ).catch(() => [])
    : [];
  const priorRows = [
    ...new Map(
      [...matchingRows, ...removedRows].map((row: any) => [row.id, row]),
    ).values(),
  ];
  const existing = priorRows
    .filter(
      (row: any) =>
        row.apply_status === "applied" &&
        row.applied_entity_id &&
        row.after_json,
    )
    .map((row: any) => ({
      id: row.applied_entity_id,
      object_class: row.applied_entity_type || row.object_class,
      stable_key: row.stable_key,
      normalized_payload: row.normalized_payload_json,
      source_identity: row.source_identity,
    }));
  const preview = buildImportPreview({
    records: input.records,
    adapter,
    existing,
    previousSourceIdentities: input.previous_source_identities || [],
  });
  const batch = await service.createImportBatches({
    source_type: input.source_type,
    adapter_key: adapter.key,
    file_name: input.file_name || null,
    file_hash: fileHash,
    file_identity: fileIdentity,
    dry_run: true,
    status: "extracted",
    counts_json: preview.counts,
    warnings_json: preview.warnings,
    errors_json: preview.blockers,
    reviewer_id: null,
    review_status: "pending",
    applied_at: null,
    rolled_back_at: null,
    rollback_reference: null,
    source_schema_version: input.source_schema_version,
    target_schema_version: 1,
    actor_id: actorId,
    creation_manifest_id: input.creation_manifest_id || null,
    wizard_session_id: input.wizard_session_id || null,
    bootstrap_proposal_json: preview.bootstrap_proposal,
  });
  const created: any[] = [];
  try {
    for (const row of preview.staged) {
      created.push(await service.createImportStagedRecords({
        batch_id: batch.id,
        sequence: row.sequence,
        record_identity: `${fileHash}:${row.record_identity}`,
        source_identity: row.source_identity,
        stable_key: row.stable_key,
        object_class: row.object_class,
        raw_payload_json: row.raw_payload,
        normalized_payload_json: row.normalized_payload,
        mapping_suggestions_json: row.mapping_suggestions,
        classification_proposal: row.classification_proposal,
        classification_confirmed: null,
        action: row.action,
        existing_entity_id: row.existing_entity_id,
        diff_json: row.diff,
        warnings_json: row.warnings,
        errors_json: row.errors,
        source_evidence_json: (row.normalized_payload as Record<string, any>)?.source || null,
        confidence: row.confidence,
        review_status: row.action === "block" ? "unresolved" : "suggested",
        apply_status: "pending",
        applied_entity_type: null,
        applied_entity_id: null,
        before_json: null,
        after_json: null,
      }));
    }
    const normalizedBatch = await service.updateImportBatches({ id: batch.id, status: "in_review" });
    return loadTechnicalImportBatch(service, normalizedBatch);
  } catch (error) {
    for (const row of created.reverse()) await service.deleteImportStagedRecords(row.id).catch(() => undefined);
    await service.deleteImportBatches(batch.id).catch(() => undefined);
    throw error;
  }
}
