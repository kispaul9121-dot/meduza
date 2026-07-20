export const CORE_SERVER_WIZARD_STEPS = [
  "Creation method",
  "Identification",
  "Platform & generation",
  "CPU capability",
  "Memory capability",
  "Chassis & storage",
  "Expansion topology",
  "Power & cooling",
  "Network, management & boot",
  "Optional configurator groups",
  "Product strategy",
  "Properties & coverage",
  "Simulation",
  "Draft, review & publish",
] as const;

export type CoreServerDraft = Record<string, any>;

type Finding = {
  code: string;
  step: number;
  field: string;
  message: string;
  blocking: boolean;
};

function required(
  findings: Finding[],
  value: unknown,
  step: number,
  field: string,
  message: string,
) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  ) {
    findings.push({
      code: "CORE_WIZARD_REQUIRED_FIELD",
      step,
      field,
      message,
      blocking: true,
    });
  }
}

export function validateCoreServerDraft(draft: CoreServerDraft) {
  const findings: Finding[] = [];
  required(
    findings,
    draft.creation_method,
    1,
    "creation_method",
    "Choose how this server is created.",
  );
  [
    "vendor",
    "family",
    "model",
    "public_name",
    "slug",
    "form_factor",
    "source_document",
    "chassis_type",
  ].forEach((field) =>
    required(
      findings,
      draft.identity?.[field],
      2,
      `identity.${field}`,
      `${field.replaceAll("_", " ")} is required.`,
    ),
  );
  required(
    findings,
    draft.platform?.technology_platform_id,
    3,
    "platform.technology_platform_id",
    "Select a canonical TechnologyPlatform.",
  );
  required(
    findings,
    draft.platform?.vendor_generation_template_id,
    3,
    "platform.vendor_generation_template_id",
    "Select a canonical VendorGenerationTemplate.",
  );
  required(
    findings,
    draft.cpu?.socket_concept_id,
    4,
    "cpu.socket_concept_id",
    "Select a canonical socket concept; free text is not accepted.",
  );
  if (
    !Number.isInteger(draft.cpu?.socket_quantity) ||
    draft.cpu.socket_quantity < 1
  )
    findings.push({
      code: "CORE_WIZARD_INVALID_QUANTITY",
      step: 4,
      field: "cpu.socket_quantity",
      message: "CPU socket quantity must be a positive integer.",
      blocking: true,
    });
  required(
    findings,
    draft.memory?.technology_concept_id,
    5,
    "memory.technology_concept_id",
    "Select a canonical memory technology concept.",
  );
  if (
    !Number.isInteger(draft.memory?.slots_per_cpu) ||
    draft.memory.slots_per_cpu < 1
  )
    findings.push({
      code: "CORE_WIZARD_INVALID_QUANTITY",
      step: 5,
      field: "memory.slots_per_cpu",
      message: "Memory slots per CPU must be positive.",
      blocking: true,
    });
  required(
    findings,
    draft.storage?.chassis_variants,
    6,
    "storage.chassis_variants",
    "Define at least one sourced chassis variant.",
  );
  required(
    findings,
    draft.expansion?.slots,
    7,
    "expansion.slots",
    "Define physical expansion slots or explicitly record that none exist.",
  );
  if (
    draft.power?.max_watts !== null &&
    (!Number.isFinite(draft.power?.max_watts) || draft.power.max_watts <= 0)
  )
    findings.push({
      code: "CORE_WIZARD_INVALID_POWER_BUDGET",
      step: 8,
      field: "power.max_watts",
      message: "Power budget must be positive or explicitly unknown.",
      blocking: true,
    });
  required(
    findings,
    draft.network?.management_concept_id,
    9,
    "network.management_concept_id",
    "Select a canonical management-generation concept.",
  );
  required(
    findings,
    draft.product_strategy,
    11,
    "product_strategy",
    "Choose how technical data maps to Medusa products.",
  );
  const assignments = draft.properties?.assignments || [];
  const unmapped = assignments.filter(
    (item: any) => item.mode === "unresolved_draft",
  );
  unmapped.forEach((item: any) =>
    findings.push({
      code: "CORE_WIZARD_UNMAPPED_PROPERTY",
      step: 12,
      field: item.property_definition_id || "property",
      message: "A property remains unmapped and cannot be published.",
      blocking: true,
    }),
  );
  if (!(draft.simulation?.representative_components || []).length)
    findings.push({
      code: "CORE_WIZARD_REPRESENTATIVE_CONFIGURATION_MISSING",
      step: 13,
      field: "simulation.representative_components",
      message:
        "Select a representative CPU/RAM/storage configuration for engine simulation.",
      blocking: true,
    });
  required(
    findings,
    draft.review?.reviewer,
    14,
    "review.reviewer",
    "Assign a reviewer before publication.",
  );
  return {
    ready_for_materialization: !findings.some(
      (item) => item.blocking && item.step <= 12,
    ),
    ready_for_simulation: !findings.some(
      (item) => item.blocking && item.step <= 13,
    ),
    ready_for_review: !findings.some((item) => item.blocking),
    blockers: findings.filter((item) => item.blocking),
    warnings: findings.filter((item) => !item.blocking),
    step_status: CORE_SERVER_WIZARD_STEPS.map((label, index) => ({
      step: index + 1,
      label,
      blocker_count: findings.filter(
        (item) => item.step === index + 1 && item.blocking,
      ).length,
    })),
  };
}

export function buildServerModelDraftPayload(
  draft: CoreServerDraft,
  socketConcept: { stable_key?: string; display_name?: string } | null,
) {
  const socketCount = Number(draft.cpu.socket_quantity);
  const slotsPerCpu = Number(draft.memory.slots_per_cpu);
  const chassis = draft.storage.chassis_variants[0];
  return {
    medusa_product_id: null,
    medusa_variant_id: null,
    technology_platform_id: draft.platform.technology_platform_id,
    vendor_generation_template_id: draft.platform.vendor_generation_template_id,
    server_family_id: draft.platform.server_family_id || null,
    capability_profile_id: null,
    brand: draft.identity.vendor,
    family: draft.identity.family,
    generation: draft.identity.generation || "",
    model: draft.identity.model,
    public_name: draft.identity.public_name,
    slug: draft.identity.slug,
    form_factor: draft.identity.form_factor,
    chassis_type: draft.identity.chassis_type,
    drive_bays_front: Number(chassis?.front_bays || 0),
    drive_bays_rear: Number(chassis?.rear_bays || 0),
    drive_form_factor: chassis?.drive_form_factor || "",
    supported_drive_interfaces: draft.storage.protocols || [],
    front_option_type: chassis?.key || null,
    backplane_type: chassis?.backplane_reference || "",
    cpu_socket: socketConcept?.stable_key || socketConcept?.display_name || "",
    max_cpu: socketCount,
    ram_slots_total: socketCount * slotsPerCpu,
    ram_slots_per_cpu: slotsPerCpu,
    max_ram_capacity: draft.memory.max_capacity_gb
      ? `${draft.memory.max_capacity_gb} GB`
      : "",
    supported_ram_types: draft.memory.module_types || [],
    supported_ram_speeds: draft.memory.speed_limit_mhz
      ? [String(draft.memory.speed_limit_mhz)]
      : [],
    psu_type: draft.power.psu_summary || "",
    cooling_profile: draft.power.cooling_mode || "",
    seo_title: "",
    seo_description: "",
    source_doc_reference: draft.identity.source_document,
    schema_version: 1,
    enabled: false,
  };
}

export function buildCapabilityProfileDraftPayload(
  draft: CoreServerDraft,
  serverModelId: string,
) {
  return {
    owner_type: "server_model",
    owner_id: serverModelId,
    platform_json: {
      technology_platform_id: draft.platform.technology_platform_id,
      vendor_generation_template_id:
        draft.platform.vendor_generation_template_id,
      inherited_pack_ids: draft.platform.inherited_pack_ids || [],
      exclusions: draft.platform.exclusions || [],
    },
    cpu_json: draft.cpu,
    memory_json: draft.memory,
    storage_json: draft.storage,
    expansion_json: draft.expansion,
    network_json: draft.network,
    accelerator_json: {
      option_group_ids: (draft.optional_groups?.option_group_ids || []).filter(
        (id: string) => String(id).includes("accelerator"),
      ),
    },
    boot_storage_json: { group_ids: draft.network.boot_group_ids || [] },
    power_json: draft.power,
    cooling_json: {
      mode: draft.power.cooling_mode,
      thermal_zones: draft.power.thermal_zones || [],
      fan_pack_ids: draft.power.fan_pack_ids || [],
    },
    management_json: { concept_id: draft.network.management_concept_id },
    source_json: {
      reference: draft.identity.source_document,
      wizard: "core_server",
      schema_version: 1,
    },
    schema_version: 1,
    review_status: "draft",
  };
}
