import {
  adapterFor,
  buildImportPreview,
  executeCompensatedImport,
  normalizeSourceRecord,
  recordsFromGeniusManifest,
} from "../import-pipeline";
import {
  buildImportDryRun,
  buildTechnicalMutation,
  hasBulkApplyPermission,
} from "../import-apply";

describe("technical import pipeline", () => {
  it.each([
    ["hpe", "FlexibleLOM", "nic"],
    ["dell", "NDC", "nic"],
    ["dell", "PERC", "raid"],
    ["supermicro", "AOC", "nic"],
  ])("normalizes %s terminology %s", (vendor, term, expected) => {
    const row = normalizeSourceRecord(
      { source_id: `${vendor}-${term}`, term, vendor },
      adapterFor(vendor),
    );
    expect(row.mapping_suggestions.terminology.canonical_kind).toBe(expected);
    expect(row.raw_payload.term).toBe(term);
  });

  it("never turns a one-item reusable record into a pack", () => {
    const row = normalizeSourceRecord(
      {
        source_id: "single-nic",
        term: "NDC",
        vendor: "Dell",
        reusable: true,
        parts: [{ part_number: "1" }],
      },
      adapterFor("dell"),
    );
    expect(row.object_class).not.toBe("component_pack");
  });

  it("keeps equal-bay storage paths distinct", () => {
    const first = normalizeSourceRecord(
      {
        source_id: "16lff-direct",
        vendor: "HPE",
        storage: {
          bays: 16,
          location: "front",
          backplane_reference: "bp-a",
          connection_mode: "direct_attach",
          controller_path: "smart-array-a",
          protocol_distribution: ["sas"],
        },
      },
      adapterFor("hpe"),
    );
    const second = normalizeSourceRecord(
      {
        source_id: "16lff-expander",
        vendor: "HPE",
        storage: {
          bays: 16,
          location: "front",
          backplane_reference: "bp-b",
          connection_mode: "expander",
          controller_path: "smart-array-b",
          protocol_distribution: ["sas", "sata"],
        },
      },
      adapterFor("hpe"),
    );
    expect(first.stable_key).not.toBe(second.stable_key);
  });

  it("preserves unknown attributes and protects commercial fields", () => {
    const row = normalizeSourceRecord(
      {
        source_id: "unknown-1",
        term: "iLO",
        attributes: { unknown_lane_mode: "x16" },
        commercial: { sku: "SKU-1", price: 100, inventory: 2 },
      },
      adapterFor("hpe"),
    );
    expect(row.raw_payload.attributes).toEqual({ unknown_lane_mode: "x16" });
    expect(row.normalized_payload).not.toHaveProperty("commercial");
    expect(row.mapping_suggestions.unknown_attributes[0]).toMatchObject({
      proposal: "draft_property_definition",
      usage_status: "informational",
    });
    expect(row.warnings.map((item) => item.code)).toContain(
      "COMMERCIAL_FIELDS_PROTECTED",
    );
  });

  it("accepts new values as data but blocks a new behavior without a validator", () => {
    const value = normalizeSourceRecord(
      {
        source_id: "new-value",
        term: "PERC",
        attributes: { controller_generation: "PERC-15" },
      },
      adapterFor("dell"),
    );
    const behavior = normalizeSourceRecord(
      {
        source_id: "new-behavior",
        term: "PERC",
        attributes: { new_resource_distribution: "split-lanes-v2" },
      },
      adapterFor("dell"),
    );
    expect(value.errors).toHaveLength(0);
    expect(behavior.errors).toContainEqual(
      expect.objectContaining({ code: "VALIDATOR_MISSING" }),
    );
  });

  it("classifies packs, bundles, direct assignments, topology and option groups", () => {
    const adapter = adapterFor("hpe");
    const rows = [
      { source_id: "pack", reusable: true, parts: [{}, {}] },
      { source_id: "bundle", required_kit: true, parts: [{}, {}] },
      { source_id: "direct", model_specific: true, parts: [{}] },
      { source_id: "topology", storage: { bays: 8 } },
      { source_id: "option", optional_type: "gpu" },
    ].map((record) => normalizeSourceRecord(record, adapter).object_class);
    expect(rows).toEqual([
      "component_pack",
      "assembly_bundle",
      "direct_assignment",
      "storage_topology",
      "option_group",
    ]);
  });

  it("produces create, unchanged, update, archive and duplicate-block previews", () => {
    const adapter = adapterFor("dell");
    const base = normalizeSourceRecord(
      { source_id: "ndc-1", term: "NDC", model: "X710" },
      adapter,
    );
    const unchanged = buildImportPreview({
      adapter,
      records: [{ source_id: "ndc-1", term: "NDC", model: "X710" }],
      existing: [{ id: "c1", object_class: "component", stable_key: base.stable_key, normalized_payload: base.normalized_payload }],
    });
    expect(unchanged.counts.unchanged).toBe(1);

    const changed = buildImportPreview({
      adapter,
      records: [{ source_id: "ndc-1", term: "NDC", model: "X710", attributes: { ports: 4 } }],
      existing: [{ id: "c1", object_class: "component", stable_key: base.stable_key, normalized_payload: base.normalized_payload }],
      previousSourceIdentities: ["ndc-1", "removed-1"],
    });
    expect(changed.counts.update).toBe(1);
    expect(changed.counts.archive).toBe(1);

    const duplicate = buildImportPreview({
      adapter,
      records: [{ source_id: "ndc-1", term: "NDC", model: "X710" }],
      existing: ["c1", "c2"].map((id) => ({ id, object_class: "component", stable_key: base.stable_key, normalized_payload: base.normalized_payload })),
    });
    expect(duplicate.counts.block).toBe(1);
  });

  it("compensates successful writes in reverse when a later write fails", async () => {
    const trace: string[] = [];
    await expect(
      executeCompensatedImport([
        { key: "concept", apply: async () => (trace.push("apply-concept"), "c"), compensate: async () => { trace.push("undo-concept"); } },
        { key: "component", apply: async () => (trace.push("apply-component"), "p"), compensate: async () => { trace.push("undo-component"); } },
        { key: "pack", apply: async () => { trace.push("apply-pack"); throw new Error("database failure"); }, compensate: async () => { trace.push("undo-pack"); } },
      ]),
    ).rejects.toThrow("database failure");
    expect(trace).toEqual([
      "apply-concept",
      "apply-component",
      "apply-pack",
      "undo-component",
      "undo-concept",
    ]);
  });

  it("reuses the stage-07 creation manifest as the Genius import source", () => {
    const records = recordsFromGeniusManifest({
      manifest_version: 1,
      planned_creates: [
        { key: "platform-1", entity_type: "technology_platform", group: "platform", payload: { key: "platform-1" } },
      ],
      planned_updates: [],
      planned_links: [],
      planned_assignments: [],
    });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      source_id: "platform-1",
      knowledge: { object_class: "technology_platform", manifest_group: "platform" },
    });
  });

  it("does not grant bulk apply to a broad admin without the exact permission", () => {
    expect(hasBulkApplyPermission({ role: "admin" })).toBe(false);
    expect(
      hasBulkApplyPermission({
        permissions: ["server-configurator-bulk-apply"],
      }),
    ).toBe(true);
  });

  it("builds disabled technical components without commercial fields", () => {
    const normalized = normalizeSourceRecord(
      {
        source_id: "safe-component",
        term: "NDC",
        vendor: "Dell",
        model: "Safe NIC",
        commercial: { sku: "NO", price: 100, inventory: 10 },
      },
      adapterFor("dell"),
    );
    const mutation = buildTechnicalMutation({
      id: "row-1",
      batch_id: "batch-1",
      object_class: normalized.object_class,
      classification_confirmed: "component",
      stable_key: normalized.stable_key,
      normalized_payload_json: normalized.normalized_payload,
      raw_payload_json: normalized.raw_payload,
      mapping_suggestions_json: normalized.mapping_suggestions,
      warnings_json: normalized.warnings,
    });
    expect(mutation.payload).toMatchObject({ enabled: false });
    expect(mutation.payload).not.toHaveProperty("price");
    expect(mutation.payload).not.toHaveProperty("cost");
    expect(mutation.payload).not.toHaveProperty("stock_qty");
    expect(mutation.payload).not.toHaveProperty("sku");
    expect(mutation.payload).not.toHaveProperty("inventory");
  });

  it("keeps dry-run free of writes and reports unresolved mutation payloads", () => {
    const result = buildImportDryRun([
      {
        id: "topology-1",
        object_class: "storage_topology",
        action: "create",
        review_status: "approved",
        normalized_payload_json: { knowledge: null },
        warnings_json: [],
        errors_json: [],
      },
    ]);
    expect(result.writes_performed).toBe(false);
    expect(result.apply_available).toBe(false);
    expect(result.blockers[0].code).toBe("MUTATION_NOT_READY");
  });
});
