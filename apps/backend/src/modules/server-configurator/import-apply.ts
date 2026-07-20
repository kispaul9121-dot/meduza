import { MedusaError } from "@medusajs/framework/utils";

export const BULK_APPLY_PERMISSION = "server-configurator-bulk-apply";

export const TECHNICAL_DEPENDENCY_ORDER = [
  "technology_concept_type",
  "technology_concept",
  "concept_alias",
  "property_definition",
  "property_value",
  "technology_relation",
  "technology_platform",
  "vendor_generation_template",
  "component_type_definition",
  "component",
  "component_pack",
  "assembly_bundle",
  "storage_topology",
  "option_group",
  "direct_assignment",
  "pack_assignment",
] as const;

type Descriptor = {
  create: string;
  retrieve: string;
  update: string;
  delete: string;
};

export const IMPORT_ENTITY_DESCRIPTORS: Record<string, Descriptor> = {
  component: { create: "createComponents", retrieve: "retrieveComponent", update: "updateComponents", delete: "deleteComponents" },
  component_pack: { create: "createComponentPacks", retrieve: "retrieveComponentPack", update: "updateComponentPacks", delete: "deleteComponentPacks" },
  assembly_bundle: { create: "createComponentPacks", retrieve: "retrieveComponentPack", update: "updateComponentPacks", delete: "deleteComponentPacks" },
  direct_assignment: { create: "createServerModelComponentAssignments", retrieve: "retrieveServerModelComponentAssignment", update: "updateServerModelComponentAssignments", delete: "deleteServerModelComponentAssignments" },
  storage_topology: { create: "createStorageTopologies", retrieve: "retrieveStorageTopology", update: "updateStorageTopologies", delete: "deleteStorageTopologies" },
  option_group: { create: "createConfiguratorOptionGroups", retrieve: "retrieveConfiguratorOptionGroup", update: "updateConfiguratorOptionGroups", delete: "deleteConfiguratorOptionGroups" },
  component_type_definition: { create: "createComponentTypeDefinitions", retrieve: "retrieveComponentTypeDefinition", update: "updateComponentTypeDefinitions", delete: "deleteComponentTypeDefinitions" },
  property_definition: { create: "createPropertyDefinitions", retrieve: "retrievePropertyDefinition", update: "updatePropertyDefinitions", delete: "deletePropertyDefinitions" },
  property_value: { create: "createPropertyValues", retrieve: "retrievePropertyValue", update: "updatePropertyValues", delete: "deletePropertyValues" },
  technology_concept_type: { create: "createTechnologyConceptTypes", retrieve: "retrieveTechnologyConceptType", update: "updateTechnologyConceptTypes", delete: "deleteTechnologyConceptTypes" },
  technology_concept: { create: "createTechnologyConcepts", retrieve: "retrieveTechnologyConcept", update: "updateTechnologyConcepts", delete: "deleteTechnologyConcepts" },
  concept_alias: { create: "createConceptAliases", retrieve: "retrieveConceptAlias", update: "updateConceptAliases", delete: "deleteConceptAliases" },
  technology_relation: { create: "createTechnologyRelations", retrieve: "retrieveTechnologyRelation", update: "updateTechnologyRelations", delete: "deleteTechnologyRelations" },
  technology_platform: { create: "createTechnologyPlatforms", retrieve: "retrieveTechnologyPlatform", update: "updateTechnologyPlatforms", delete: "deleteTechnologyPlatforms" },
  vendor_generation_template: { create: "createVendorGenerationTemplates", retrieve: "retrieveVendorGenerationTemplate", update: "updateVendorGenerationTemplates", delete: "deleteVendorGenerationTemplates" },
  pack_assignment: { create: "createPackAssignments", retrieve: "retrievePackAssignment", update: "updatePackAssignments", delete: "deletePackAssignments" },
};

const componentTypes = new Set([
  "cpu", "ram", "drive", "raid", "nic", "psu", "riser", "backplane",
  "drive_cage", "boot_storage", "accelerator", "rails", "cable", "cooling",
  "license", "service",
]);

export function hasBulkApplyPermission(metadata: unknown) {
  const value = (metadata || {}) as Record<string, unknown>;
  const permissions = Array.isArray(value.permissions) ? value.permissions : [];
  return permissions.includes(BULK_APPLY_PERMISSION) || permissions.includes("*");
}

function cleanPayload(value: Record<string, any>) {
  const { id, created_at, updated_at, deleted_at, commercial, sku, price, cost, stock_qty, inventory, images, categories, ...payload } = value;
  return payload;
}

function requiredPayload(row: any) {
  return cleanPayload(row.normalized_payload_json?.knowledge?.payload || {});
}

export function buildTechnicalMutation(row: any) {
  const objectClass = row.classification_confirmed || row.object_class;
  const descriptor = IMPORT_ENTITY_DESCRIPTORS[objectClass];
  if (!descriptor)
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unsupported technical object class ${objectClass}.`);
  const normalized = row.normalized_payload_json || {};
  const attributes = normalized.attributes || {};
  let payload: Record<string, any>;

  if (objectClass === "component") {
    const type = componentTypes.has(attributes.component_type)
      ? attributes.component_type
      : componentTypes.has(row.mapping_suggestions_json?.terminology?.canonical_kind)
        ? row.mapping_suggestions_json.terminology.canonical_kind
        : "service";
    payload = {
      type,
      brand: normalized.vendor || "Unknown",
      model: normalized.model || normalized.name || row.stable_key,
      part_number: normalized.part_number || null,
      public_name: normalized.name || normalized.model || row.stable_key,
      short_name: normalized.name || normalized.model || row.stable_key,
      specs_json: attributes,
      normalized_specs_json: attributes,
      raw_specs_json: row.raw_payload_json?.attributes || null,
      requirements_json: null,
      provides_json: null,
      consumes_json: null,
      applicability_json: null,
      source_json: { ...normalized.source, import_stable_key: row.stable_key, import_batch_id: row.batch_id },
      schema_version: 1,
      normalization_status: row.warnings_json?.some((item: any) => item.code === "UNKNOWN_ATTRIBUTES_PRESERVED") ? "partially_normalized" : "normalized",
      enabled: false,
    };
  } else if (["component_pack", "assembly_bundle"].includes(objectClass)) {
    if ((normalized.parts || []).length < 2)
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A technical pack must contain at least two proposed parts.");
    payload = {
      name: normalized.name || row.stable_key,
      slug: row.stable_key,
      description: `Draft imported from ${normalized.source?.adapter || "technical source"}`,
      component_type: componentTypes.has(attributes.component_type) ? attributes.component_type : "service",
      tags_json: { imported_parts: normalized.parts, import_batch_id: row.batch_id },
      pack_kind: objectClass === "assembly_bundle" ? "assembly_bundle" : "candidate_pool",
      schema_version: 1,
      enabled: false,
      source_doc_reference: normalized.source?.evidence?.reference || null,
    };
  } else {
    payload = requiredPayload(row);
    if (!Object.keys(payload).length)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `${objectClass} requires an explicit reviewed knowledge.payload before apply.`,
      );
    if ("enabled" in payload) payload.enabled = false;
    if ("review_status" in payload) payload.review_status = "draft";
    if ("lifecycle_status" in payload) payload.lifecycle_status = "draft";
  }
  return { object_class: objectClass, descriptor, payload: cleanPayload(payload) };
}

export function buildImportDryRun(rows: any[], approvedGroups: string[] = []) {
  const blockers: Array<{ record_id: string; code: string; message: string }> = [];
  const approved = rows.filter((row) => {
    const group = row.classification_confirmed || row.object_class;
    return row.review_status === "approved" && (!approvedGroups.length || approvedGroups.includes(group));
  });
  for (const row of approved) {
    for (const error of row.errors_json || [])
      blockers.push({ record_id: row.id, code: error.code || "ROW_ERROR", message: error.message || error.code || "Row is blocked." });
    if (["create", "update", "archive"].includes(row.action)) {
      try { buildTechnicalMutation(row); }
      catch (error) { blockers.push({ record_id: row.id, code: "MUTATION_NOT_READY", message: error instanceof Error ? error.message : String(error) }); }
    }
  }
  return {
    writes_performed: false,
    apply_available: blockers.length === 0 && approved.length > 0,
    approved_item_count: approved.length,
    counts: Object.fromEntries(["create", "update", "unchanged", "archive", "block"].map((action) => [action, approved.filter((row) => row.action === action).length])),
    blockers,
    warnings: rows.flatMap((row) => row.warnings_json || []),
    dependency_order: TECHNICAL_DEPENDENCY_ORDER,
    publication_actions: [],
  };
}

export function dependencyRank(row: any) {
  const objectClass = row.classification_confirmed || row.object_class;
  const index = TECHNICAL_DEPENDENCY_ORDER.indexOf(objectClass as any);
  return index < 0 ? TECHNICAL_DEPENDENCY_ORDER.length : index;
}
