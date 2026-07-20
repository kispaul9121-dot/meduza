import { createHash } from "node:crypto";
import { MedusaError } from "@medusajs/framework/utils";

export const IMPORT_OBJECT_CLASSES = [
  "component",
  "component_pack",
  "direct_assignment",
  "assembly_bundle",
  "storage_topology",
  "option_group",
  "component_type_definition",
  "property_definition",
  "property_value",
  "technology_concept_type",
  "technology_concept",
  "concept_alias",
  "technology_relation",
  "technology_platform",
  "vendor_generation_template",
  "pack_assignment",
  "capability_profile",
  "server_model",
] as const;

export type ImportObjectClass = (typeof IMPORT_OBJECT_CLASSES)[number];

export type VendorSourceRecord = {
  source_id: string;
  kind?: string;
  term?: string;
  name?: string;
  vendor?: string;
  model?: string;
  part_number?: string;
  server_model_key?: string;
  reusable?: boolean;
  model_specific?: boolean;
  required_kit?: boolean;
  parts?: any[];
  attributes?: Record<string, unknown>;
  storage?: Record<string, any>;
  optional_type?: string;
  knowledge?: Record<string, any>;
  source?: Record<string, unknown>;
  confidence?: number;
  commercial?: Record<string, unknown>;
};

export type AdapterMapping = {
  canonical_kind: string;
  canonical_term: string;
  attributes: Record<string, unknown>;
  mapping_evidence: string;
};

export interface VendorImportAdapter {
  key: string;
  vendor: string;
  schema_version: number;
  map(record: VendorSourceRecord): AdapterMapping;
}

const terminology: Record<string, Record<string, AdapterMapping>> = {
  hpe: {
    flexiblelom: {
      canonical_kind: "nic",
      canonical_term: "network_mezzanine_adapter",
      attributes: { component_type: "nic", slot_type: "flexiblelom" },
      mapping_evidence: "HPE FlexibleLOM maps to a NIC mezzanine form factor.",
    },
    smartarray: {
      canonical_kind: "raid",
      canonical_term: "storage_controller",
      attributes: { component_type: "raid", controller_family: "smart_array" },
      mapping_evidence: "HPE Smart Array maps to a RAID/HBA controller family.",
    },
    mediabay: {
      canonical_kind: "storage_topology",
      canonical_term: "optional_media_bay",
      attributes: { location: "front" },
      mapping_evidence: "HPE Media Bay remains a source-distinct storage option.",
    },
    ilo: {
      canonical_kind: "technology_concept",
      canonical_term: "management_generation",
      attributes: { concept_family: "ilo" },
      mapping_evidence: "HPE iLO maps to the canonical management concept family.",
    },
  },
  dell: {
    ndc: {
      canonical_kind: "nic",
      canonical_term: "network_mezzanine_adapter",
      attributes: { component_type: "nic", slot_type: "ndc" },
      mapping_evidence: "Dell NDC maps to a NIC mezzanine form factor.",
    },
    perc: {
      canonical_kind: "raid",
      canonical_term: "storage_controller",
      attributes: { component_type: "raid", controller_family: "perc" },
      mapping_evidence: "Dell PERC maps to a RAID/HBA controller family.",
    },
    boss: {
      canonical_kind: "boot_storage",
      canonical_term: "boot_storage",
      attributes: { component_type: "boot_storage" },
      mapping_evidence: "Dell BOSS maps to boot storage rather than a generic drive pack.",
    },
    idrac: {
      canonical_kind: "technology_concept",
      canonical_term: "management_generation",
      attributes: { concept_family: "idrac" },
      mapping_evidence: "Dell iDRAC maps to the canonical management concept family.",
    },
    riser: {
      canonical_kind: "storage_topology",
      canonical_term: "expansion_topology",
      attributes: { topology_family: "riser" },
      mapping_evidence: "Dell riser identity includes its slot/resource topology.",
    },
  },
  supermicro: {
    aoc: {
      canonical_kind: "nic",
      canonical_term: "add_on_card",
      attributes: { component_type: "nic" },
      mapping_evidence: "Supermicro AOC is normalized as a typed add-on component.",
    },
    bpn: {
      canonical_kind: "storage_topology",
      canonical_term: "backplane_variant",
      attributes: { topology_family: "backplane" },
      mapping_evidence: "Supermicro BPN remains a distinct backplane identity.",
    },
    expander: {
      canonical_kind: "storage_topology",
      canonical_term: "expander_path",
      attributes: { connection_mode: "expander" },
      mapping_evidence: "Expander paths are not collapsed into direct-attach layouts.",
    },
    ipmi: {
      canonical_kind: "technology_concept",
      canonical_term: "management_generation",
      attributes: { concept_family: "ipmi" },
      mapping_evidence: "IPMI maps to the canonical management concept family.",
    },
  },
};

function slug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export function contentHash(value: unknown) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export class CanonicalVendorAdapter implements VendorImportAdapter {
  key: string;
  vendor: string;
  schema_version = 1;

  constructor(vendor: string) {
    this.vendor = vendor;
    this.key = `${slug(vendor)}-technical-v1`;
  }

  map(record: VendorSourceRecord): AdapterMapping {
    const key = slug(record.term || record.kind || record.name).replaceAll("-", "");
    const mapping = terminology[slug(this.vendor)]?.[key];
    if (mapping)
      return {
        ...mapping,
        attributes: { ...mapping.attributes, ...(record.attributes || {}) },
      };
    return {
      canonical_kind: record.kind || "unknown_physical_class",
      canonical_term: slug(record.term || record.name || record.source_id),
      attributes: { ...(record.attributes || {}) },
      mapping_evidence:
        "No executable mapping exists; preserved as a reviewable draft proposal.",
    };
  }
}

export const VENDOR_ADAPTERS: Record<string, VendorImportAdapter> = {
  hpe: new CanonicalVendorAdapter("HPE"),
  dell: new CanonicalVendorAdapter("Dell"),
  supermicro: new CanonicalVendorAdapter("Supermicro"),
};

export function classifyImportObject(
  record: VendorSourceRecord,
  mapping: AdapterMapping,
): ImportObjectClass {
  if (record.knowledge?.object_class)
    return record.knowledge.object_class as ImportObjectClass;
  if (
    record.storage ||
    ["storage_topology", "backplane_variant", "expander_path"].includes(
      mapping.canonical_kind,
    )
  )
    return "storage_topology";
  if (record.optional_type && ["gpu", "m2", "rails"].includes(slug(record.optional_type)))
    return "option_group";
  if (record.required_kit && (record.parts || []).length > 1)
    return "assembly_bundle";
  if (record.model_specific && (record.parts || []).length <= 1)
    return "direct_assignment";
  if (record.reusable && (record.parts || []).length > 1)
    return "component_pack";
  if (mapping.canonical_kind === "technology_concept")
    return "technology_concept";
  if (mapping.canonical_kind === "unknown_physical_class")
    return "component_type_definition";
  return "component";
}

function storageIdentity(record: VendorSourceRecord) {
  const storage = record.storage || {};
  return slug(
    [
      record.source_id,
      storage.location,
      storage.backplane_reference,
      storage.connection_mode,
      storage.controller_path,
      (storage.protocol_distribution || []).join("-"),
      (storage.cables || []).join("-"),
    ].join("-"),
  );
}

export function normalizeSourceRecord(
  record: VendorSourceRecord,
  adapter: VendorImportAdapter,
) {
  const mapping = adapter.map(record);
  const objectClass = classifyImportObject(record, mapping);
  const stableKey =
    objectClass === "storage_topology"
      ? storageIdentity(record)
      : slug(
          [
            record.vendor || adapter.vendor,
            mapping.canonical_term,
            record.part_number || record.model || record.source_id,
          ].join("-"),
        );
  const unknownAttributes = Object.entries(record.attributes || {})
    .filter(([key]) => key.startsWith("unknown_") || key.startsWith("x_"))
    .map(([key, value]) => ({
      raw_key: key,
      raw_value: value,
      proposal: "draft_property_definition",
      usage_status: "informational",
      requires_review: true,
    }));
  const newBehavior = Boolean(
    record.attributes?.new_resource_distribution ||
      record.attributes?.new_conversion_mechanism ||
      record.attributes?.new_memory_expansion_behavior,
  );
  const warnings: any[] = [];
  const errors: any[] = [];
  if (unknownAttributes.length)
    warnings.push({
      code: "UNKNOWN_ATTRIBUTES_PRESERVED",
      count: unknownAttributes.length,
    });
  if (record.commercial && Object.keys(record.commercial).length)
    warnings.push({
      code: "COMMERCIAL_FIELDS_PROTECTED",
      fields: Object.keys(record.commercial),
      message:
        "SKU, price, inventory, category and images require the Medusa commercial importer.",
    });
  if (newBehavior)
    errors.push({
      code: "VALIDATOR_MISSING",
      message:
        "A new behavior requires an implemented closed-registry validator before publication.",
      publication_blocking: true,
    });
  if (objectClass === "component_type_definition")
    warnings.push({
      code: "UNKNOWN_PHYSICAL_CLASS",
      message: "Draft ComponentTypeDefinition requires classification review.",
    });
  const normalized = {
    stable_key: stableKey,
    object_class: objectClass,
    canonical_term: mapping.canonical_term,
    vendor: record.vendor || adapter.vendor,
    name: record.name || record.term || record.source_id,
    model: record.model || record.name || record.term || record.source_id,
    part_number: record.part_number || null,
    server_model_key: record.server_model_key || null,
    attributes: mapping.attributes,
    parts: record.parts || [],
    storage: record.storage || null,
    optional_type: record.optional_type || null,
    knowledge: record.knowledge || null,
    lifecycle_status: "draft",
    enabled: false,
    source: {
      adapter: adapter.key,
      source_id: record.source_id,
      evidence: record.source || null,
      confidence: Number(record.confidence ?? 0),
    },
  };
  return {
    source_identity: record.source_id,
    stable_key: stableKey,
    object_class: objectClass,
    raw_payload: structuredClone(record),
    normalized_payload: normalized,
    mapping_suggestions: {
      terminology: mapping,
      unknown_attributes: unknownAttributes,
      alias_suggestions:
        mapping.canonical_term !== slug(record.term || record.name)
          ? [record.term || record.name].filter(Boolean)
          : [],
      drive_pack_suggestion:
        objectClass === "storage_topology"
          ? {
              suggested: true,
              reason:
                "Form factor, protocol, adapter and controller evidence must all match before assignment.",
            }
          : null,
    },
    classification_proposal: objectClass,
    warnings,
    errors,
    confidence: Number(record.confidence ?? 0),
  };
}

export type ExistingImportEntity = {
  id: string;
  object_class: string;
  stable_key: string;
  normalized_payload: Record<string, any>;
  source_identity?: string;
};

export function diffNormalizedRecord(
  normalized: ReturnType<typeof normalizeSourceRecord>,
  existing: ExistingImportEntity | undefined,
) {
  if (!existing)
    return { action: normalized.errors.length ? "block" : "create", diff: {} } as const;
  const before = stableJson(existing.normalized_payload);
  const after = stableJson(normalized.normalized_payload);
  if (before === after) return { action: "unchanged", diff: {} } as const;
  return {
    action: normalized.errors.length ? "block" : "update",
    diff: { before: existing.normalized_payload, after: normalized.normalized_payload },
  } as const;
}

export function buildImportPreview(input: {
  records: VendorSourceRecord[];
  adapter: VendorImportAdapter;
  existing?: ExistingImportEntity[];
  previousSourceIdentities?: string[];
}) {
  const existing = input.existing || [];
  const normalized = input.records.map((record, sequence) => {
    const result = normalizeSourceRecord(record, input.adapter);
    const matches = existing.filter(
      (item) =>
        item.object_class === result.object_class &&
        item.stable_key === result.stable_key,
    );
    const duplicate = matches.length > 1;
    const diff = diffNormalizedRecord(result, matches[0]);
    return {
      sequence,
      record_identity: `${input.adapter.key}:${record.source_id}`,
      ...result,
      action: duplicate ? ("block" as const) : diff.action,
      existing_entity_id: matches[0]?.id || null,
      diff: diff.diff,
      warnings: duplicate
        ? [
            ...result.warnings,
            {
              code: "DUPLICATE_CANONICAL_IDENTITY",
              ids: matches.map((item) => item.id),
            },
          ]
        : result.warnings,
      errors: duplicate
        ? [
            ...result.errors,
            {
              code: "DUPLICATE_CANONICAL_IDENTITY",
              publication_blocking: true,
            },
          ]
        : result.errors,
    };
  });
  const currentIds = new Set(input.records.map((record) => record.source_id));
  const archives = (input.previousSourceIdentities || [])
    .filter((sourceId) => !currentIds.has(sourceId))
    .map((sourceId, offset) => {
      const prior = existing.find((item) => item.source_identity === sourceId);
      return ({
      sequence: normalized.length + offset,
      record_identity: `${input.adapter.key}:${sourceId}`,
      source_identity: sourceId,
      stable_key: prior?.stable_key || slug(sourceId),
      object_class: (prior?.object_class || "component") as ImportObjectClass,
      raw_payload: { source_id: sourceId, removed_from_source: true },
      normalized_payload: {
        ...(prior?.normalized_payload || { stable_key: slug(sourceId) }),
        enabled: false,
      },
      mapping_suggestions: {},
      classification_proposal: "component",
      warnings: [
        {
          code: "REMOVED_FROM_SOURCE_ARCHIVE_PROPOSAL",
          message: "Removal is archived after review; no hard delete is planned.",
        },
      ],
      errors: [],
      confidence: 1,
      action: "archive" as const,
      existing_entity_id: prior?.id || null,
      diff: { enabled: { before: true, after: false } },
    });
    });
  const staged = [...normalized, ...archives];
  const bootstrapProposal = {
    schema_version: 1,
    existing_entities_to_reuse: staged
      .filter((row) => ["update", "unchanged"].includes(row.action))
      .map((row) => row.existing_entity_id),
    new_concepts: staged.filter((row) => row.object_class === "technology_concept"),
    aliases: staged.flatMap(
      (row) =>
        (row.mapping_suggestions as { alias_suggestions?: string[] })
          .alias_suggestions || [],
    ),
    new_properties: staged.filter((row) => row.object_class === "property_definition"),
    property_assignments: staged.filter((row) => row.object_class === "property_value"),
    relations: staged.filter((row) => row.object_class === "technology_relation"),
    platform_proposals: staged.filter((row) => row.object_class === "technology_platform"),
    generation_template_proposals: staged.filter(
      (row) => row.object_class === "vendor_generation_template",
    ),
    pack_proposals: staged.filter((row) =>
      ["component_pack", "assembly_bundle"].includes(row.object_class),
    ),
    storage_proposals: staged.filter((row) => row.object_class === "storage_topology"),
    option_group_proposals: staged.filter((row) => row.object_class === "option_group"),
    missing_validator_tasks: staged.flatMap((row) =>
      row.errors.filter((error: any) => error.code === "VALIDATOR_MISSING"),
    ),
    dependency_order: [
      "concepts_and_aliases",
      "property_definitions",
      "property_assignments",
      "relations",
      "platform",
      "generation",
      "components",
      "packs",
      "storage_options",
      "server_model",
      "product_links",
      "revalidation_tasks",
    ],
    publication_actions: [],
  };
  return {
    writes_performed: false,
    staged,
    counts: Object.fromEntries(
      ["create", "update", "unchanged", "archive", "block"].map((action) => [
        action,
        staged.filter((row) => row.action === action).length,
      ]),
    ),
    blockers: staged.flatMap((row) => row.errors),
    warnings: staged.flatMap((row) => row.warnings),
    bootstrap_proposal: bootstrapProposal,
  };
}

export function adapterFor(key: string) {
  const adapter = VENDOR_ADAPTERS[slug(key)];
  if (!adapter)
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Unsupported vendor adapter: ${key}`,
    );
  return adapter;
}

export type CompensatedImportOperation<T = unknown> = {
  key: string;
  apply: () => Promise<T>;
  compensate: (result: T) => Promise<void>;
};

/** Executes technical writes in a fixed order and compensates in reverse. */
export async function executeCompensatedImport<T>(
  operations: CompensatedImportOperation<T>[],
) {
  const completed: Array<{
    operation: CompensatedImportOperation<T>;
    result: T;
  }> = [];
  try {
    for (const operation of operations) {
      const result = await operation.apply();
      completed.push({ operation, result });
    }
    return {
      applied: completed.map((item) => item.operation.key),
      results: completed.map((item) => item.result),
    };
  } catch (error) {
    const rollbackErrors: Array<{ key: string; message: string }> = [];
    for (const item of completed.reverse()) {
      try {
        await item.operation.compensate(item.result);
      } catch (rollbackError) {
        rollbackErrors.push({
          key: item.operation.key,
          message:
            rollbackError instanceof Error
              ? rollbackError.message
              : String(rollbackError),
        });
      }
    }
    if (rollbackErrors.length && error instanceof Error)
      (error as Error & { rollback_errors?: typeof rollbackErrors }).rollback_errors =
        rollbackErrors;
    throw error;
  }
}

export function recordsFromGeniusManifest(manifest: Record<string, any>) {
  const groups = [
    ["create", manifest.planned_creates || []],
    ["update", manifest.planned_updates || []],
    ["link", manifest.planned_links || []],
    ["assignment", manifest.planned_assignments || []],
  ] as const;
  return groups.flatMap(([operation, items]) =>
    items.map((item: Record<string, any>, index: number) => ({
      source_id: item.key || item.id || `${operation}-${index + 1}`,
      kind: item.entity_type || item.node_type || "technology_concept",
      term: item.name || item.label || item.key || `${operation}-${index + 1}`,
      vendor: item.vendor,
      confidence: item.confidence ?? manifest.confidence ?? 0,
      source: {
        manifest_version: manifest.manifest_version || 1,
        operation,
        decision: item.decision || "confirmed",
      },
      knowledge: {
        object_class:
          item.entity_type || item.node_type || "technology_concept",
        payload: item.payload || item.data || item,
        manifest_group: item.group || item.entity_type || item.node_type,
      },
    })),
  );
}
