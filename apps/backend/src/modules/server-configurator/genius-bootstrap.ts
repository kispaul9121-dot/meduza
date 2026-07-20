export const GENIUS_MODES = [
  "guided_manual",
  "assisted_draft",
  "bulk_apply",
] as const;

export type GeniusMode = (typeof GENIUS_MODES)[number];
export type DecisionStatus =
  | "suggested"
  | "confirmed"
  | "edited"
  | "rejected"
  | "unresolved";

export type GeniusIntent = {
  mode: GeniusMode;
  launch_mode: string;
  vendor?: string;
  generation_label?: string;
  platform_name?: string;
  platform_key?: string;
  socket?: string;
  memory_technology?: string;
  server_model?: string;
  source_reference?: string;
  source_type?: "manual" | "document" | "ai_suggestion" | "import";
  confidence?: number;
  reviewer?: string;
  decisions?: Record<string, DecisionStatus>;
  property_assignments?: Array<{
    id: string;
    scope_type: string;
    scope_id: string;
    property_definition_id: string;
    normalized_value: string;
    unit?: string;
    inheritance_behavior: string;
    usage: string;
    concept_id?: string;
    relation_role?: string;
    validator_key?: string;
    provider_consumer?: string;
    status: DecisionStatus;
  }>;
};

export type GeniusRegistrySnapshot = {
  platforms: any[];
  generations: any[];
  server_models: any[];
  concepts: any[];
  aliases: any[];
  packs: any[];
  storage_options: any[];
  option_groups: any[];
  properties: any[];
  relation_types: any[];
  relations: any[];
  component_types: any[];
};

export type DependencyNode = {
  id: string;
  order: number;
  node_type: string;
  label: string;
  required: boolean;
  state: "exists" | "missing" | "duplicate" | "unresolved";
  action: "reuse" | "create" | "link" | "confirm" | "defer";
  existing_ids: string[];
  source: string | null;
  confidence: number;
  blocker: string | null;
  warning: string | null;
  deferrable: boolean;
  nested_wizard: string;
  decision: DecisionStatus;
};

function clean(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueIds(rows: any[]) {
  return [...new Set(rows.map((row) => row.id).filter(Boolean))];
}

function matches(rows: any[], requested: string, keys: string[]) {
  const identity = clean(requested);
  if (!identity) return [];
  return rows.filter((row) =>
    keys.some((key) => clean(row?.[key]) === identity),
  );
}

function makeNode(input: {
  order: number;
  node_type: string;
  label: string;
  requested: string;
  matches: any[];
  required?: boolean;
  actionWhenFound?: "reuse" | "link" | "confirm";
  deferrable?: boolean;
  allowMultiple?: boolean;
  nested_wizard: string;
  intent: GeniusIntent;
}) {
  const required = input.required !== false;
  const duplicate = input.matches.length > 1 && !input.allowMultiple;
  const exists = input.matches.length === 1 || (input.allowMultiple && input.matches.length > 0);
  const missingRequest = !clean(input.requested);
  const id = `${String(input.order).padStart(2, "0")}-${input.node_type}-${clean(input.requested) || "unresolved"}`;
  const decision = input.intent.decisions?.[id] || "unresolved";
  const state = duplicate
    ? "duplicate"
    : exists
      ? "exists"
      : missingRequest
        ? "unresolved"
        : "missing";
  return {
    id,
    order: input.order,
    node_type: input.node_type,
    label: input.label,
    required,
    state,
    action: exists
      ? input.actionWhenFound || "reuse"
      : missingRequest
        ? "defer"
        : "create",
    existing_ids: uniqueIds(input.matches),
    source: input.intent.source_reference || null,
    confidence: Math.max(0, Math.min(1, Number(input.intent.confidence ?? 0))),
    blocker: duplicate
      ? `Duplicate ${input.node_type} identity must be resolved before apply.`
      : required && missingRequest
        ? `${input.label} is required but its identity is unresolved.`
        : required && !exists && decision !== "confirmed"
          ? `${input.label} creation requires explicit confirmation.`
          : null,
    warning:
      !required && !exists
        ? `${input.label} can remain a draft dependency.`
        : Number(input.intent.confidence ?? 0) < 0.7 && input.intent.source_reference
          ? "Low-confidence source requires review."
          : null,
    deferrable: input.deferrable === true,
    nested_wizard: input.nested_wizard,
    decision,
  } satisfies DependencyNode;
}

export function discoverBootstrapContext(
  intent: GeniusIntent,
  registry: GeniusRegistrySnapshot,
) {
  const platformMatches = matches(
    registry.platforms,
    intent.platform_key || intent.platform_name || "",
    ["key", "name"],
  );
  const generationMatches = matches(
    registry.generations,
    intent.generation_label || "",
    ["key", "generation_label"],
  ).filter(
    (row) => !intent.vendor || clean(row.vendor) === clean(intent.vendor),
  );
  const socketMatches = [
    ...matches(registry.concepts, intent.socket || "", [
      "stable_key",
      "display_name",
    ]),
    ...matches(registry.aliases, intent.socket || "", [
      "alias",
      "normalized_alias",
    ]),
  ];
  const memoryMatches = [
    ...matches(registry.concepts, intent.memory_technology || "", [
      "stable_key",
      "display_name",
    ]),
    ...matches(registry.aliases, intent.memory_technology || "", [
      "alias",
      "normalized_alias",
    ]),
  ];
  const modelMatches = matches(
    registry.server_models,
    intent.server_model || "",
    ["slug", "model", "public_name"],
  );
  const vendorGenerations = registry.generations.filter(
    (row) => clean(row.vendor) === clean(intent.vendor),
  );
  const similarModels = registry.server_models.filter((row) => {
    const haystack = clean(`${row.brand} ${row.family} ${row.generation}`);
    return [intent.vendor, intent.generation_label]
      .filter(Boolean)
      .some((value) => haystack.includes(clean(value)));
  });
  const packMatches = registry.packs.filter((row) => {
    const body = clean(
      `${row.name} ${row.slug} ${(row.generation_scope || []).join(" ")} ${(row.brand_scope || []).join(" ")}`,
    );
    return [intent.vendor, intent.generation_label, intent.socket]
      .filter(Boolean)
      .some((value) => body.includes(clean(value)));
  });

  return {
    writes_performed: false,
    found: {
      platforms: platformMatches,
      generations: generationMatches.length
        ? generationMatches
        : vendorGenerations,
      server_models: similarModels,
      sockets: socketMatches,
      memory_technologies: memoryMatches,
      packs: packMatches,
      aliases: registry.aliases.filter((row) =>
        [intent.socket, intent.memory_technology]
          .filter(Boolean)
          .some((value) => clean(row.alias).includes(clean(value))),
      ),
      storage_options: registry.storage_options,
      option_groups: registry.option_groups,
      inheritable_properties: registry.properties.filter(
        (row) => row.inheritable === true,
      ),
    },
    duplicates: {
      platforms: platformMatches.length > 1 ? uniqueIds(platformMatches) : [],
      generations:
        generationMatches.length > 1 ? uniqueIds(generationMatches) : [],
      concepts: [socketMatches, memoryMatches]
        .filter((rows) => rows.length > 1)
        .flatMap(uniqueIds),
      server_models: modelMatches.length > 1 ? uniqueIds(modelMatches) : [],
    },
    gaps: {
      platform: platformMatches.length === 0,
      generation: generationMatches.length === 0,
      socket: socketMatches.length === 0,
      memory_technology: memoryMatches.length === 0,
      server_model: modelMatches.length === 0,
      validator_properties: registry.properties.filter(
        (row) => row.affects_compatibility && !row.validator_key,
      ),
      unmapped_properties: registry.properties.filter(
        (row) =>
          row.affects_compatibility && row.usage_status !== "engine_mapped",
      ),
    },
  };
}

export function buildDependencyPlan(
  intent: GeniusIntent,
  registry: GeniusRegistrySnapshot,
) {
  const concepts = (requested: string) =>
    matches(registry.concepts, requested, ["stable_key", "display_name"]);
  const nodes: DependencyNode[] = [
    makeNode({
      order: 1,
      node_type: "property_concept_types",
      label: "Property and concept types",
      requested: intent.socket || intent.memory_technology || "",
      matches: registry.component_types,
      required: false,
      deferrable: true,
      allowMultiple: true,
      nested_wizard: "/server-configurator/smart-builder?intent=component_type",
      intent,
    }),
    makeNode({
      order: 2,
      node_type: "socket_concept",
      label: "CPU socket concept",
      requested: intent.socket || "",
      matches: concepts(intent.socket || ""),
      nested_wizard: "/server-configurator/knowledge-base?section=concepts",
      intent,
    }),
    makeNode({
      order: 3,
      node_type: "memory_concept",
      label: "Memory technology concept",
      requested: intent.memory_technology || "",
      matches: concepts(intent.memory_technology || ""),
      nested_wizard: "/server-configurator/knowledge-base?section=concepts",
      intent,
    }),
    makeNode({
      order: 4,
      node_type: "relations_mappings",
      label: "Relations and validator mappings",
      requested: `${intent.platform_key || intent.platform_name || ""}-${intent.socket || ""}`,
      matches: registry.relations.filter((row) =>
        concepts(intent.socket || "").some(
          (concept) => row.target_id === concept.id || row.source_id === concept.id,
        ),
      ),
      allowMultiple: true,
      nested_wizard: "/server-configurator/knowledge-base?section=relations",
      intent,
    }),
    makeNode({
      order: 5,
      node_type: "technology_platform",
      label: "Technology Platform",
      requested: intent.platform_key || intent.platform_name || "",
      matches: matches(
        registry.platforms,
        intent.platform_key || intent.platform_name || "",
        ["key", "name"],
      ),
      nested_wizard: "/server-configurator/knowledge-base?section=platforms",
      intent,
    }),
    makeNode({
      order: 6,
      node_type: "vendor_generation_template",
      label: "Vendor Generation Template",
      requested: `${intent.vendor || ""}-${intent.generation_label || ""}`,
      matches: registry.generations.filter(
        (row) =>
          clean(row.vendor) === clean(intent.vendor) &&
          clean(row.generation_label) === clean(intent.generation_label),
      ),
      nested_wizard: "/server-configurator/knowledge-base?section=generations",
      intent,
    }),
    makeNode({
      order: 7,
      node_type: "shared_packs",
      label: "Shared CPU/RAM packs",
      requested: `${intent.vendor || ""}-${intent.generation_label || ""}`,
      matches: registry.packs.filter((row) =>
        ["cpu", "ram"].includes(row.component_type),
      ),
      allowMultiple: true,
      nested_wizard: "/server-configurator/smart-builder?intent=candidate_pack",
      intent,
    }),
    makeNode({
      order: 8,
      node_type: "server_model",
      label: "Server Model",
      requested: intent.server_model || "",
      matches: matches(registry.server_models, intent.server_model || "", [
        "slug",
        "model",
        "public_name",
      ]),
      nested_wizard: "/server-configurator/server-wizard",
      intent,
    }),
    makeNode({
      order: 9,
      node_type: "chassis_storage",
      label: "Chassis and storage topology",
      requested: intent.server_model || "",
      matches: registry.storage_options.filter((row) =>
        registry.server_models.some(
          (model) =>
            clean(model.model) === clean(intent.server_model) &&
            row.server_model_id === model.id,
        ),
      ),
      allowMultiple: true,
      nested_wizard: "/server-configurator/smart-builder?intent=storage_configuration",
      intent,
    }),
    makeNode({
      order: 10,
      node_type: "option_groups",
      label: "Configurator Option Groups",
      requested: intent.server_model || "",
      matches: registry.option_groups,
      required: false,
      deferrable: true,
      allowMultiple: true,
      nested_wizard: "/server-configurator/option-groups",
      intent,
    }),
    makeNode({
      order: 11,
      node_type: "medusa_product",
      label: "Medusa Product and Variants",
      requested: intent.server_model || "",
      matches: registry.server_models.filter(
        (row) =>
          clean(row.model) === clean(intent.server_model) &&
          Boolean(row.medusa_product_id),
      ),
      actionWhenFound: "confirm",
      nested_wizard: "/server-configurator/server-wizard",
      intent,
    }),
    makeNode({
      order: 12,
      node_type: "final_validation",
      label: "Compatibility and publication validation",
      requested: "stage04-compatibility-engine",
      matches: [{ id: "stage04-compatibility-engine" }],
      actionWhenFound: "confirm",
      nested_wizard: "/server-configurator/server-wizard",
      intent,
    }),
  ];

  return {
    schema_version: 1,
    mode: intent.mode,
    writes_performed: false,
    nodes,
    blocker_count: nodes.filter((node) => node.blocker).length,
    warning_count: nodes.filter((node) => node.warning).length,
    duplicate_count: nodes.filter((node) => node.state === "duplicate").length,
  };
}

export function buildCreationManifest(
  intent: GeniusIntent,
  plan: ReturnType<typeof buildDependencyPlan>,
) {
  const approved = plan.nodes.filter((node) =>
    ["confirmed", "edited"].includes(node.decision),
  );
  const plannedCreates = approved
    .filter((node) => node.action === "create")
    .map((node) => ({
      key: node.id,
      entity_type: node.node_type,
      label: node.label,
      source_reference: node.source,
      confidence: node.confidence,
      dependency_order: node.order,
      idempotency_identity: clean(`${node.node_type}-${node.label}`),
    }));
  const plannedLinks = approved
    .filter((node) => ["link", "reuse"].includes(node.action))
    .map((node) => ({
      key: node.id,
      entity_type: node.node_type,
      existing_ids: node.existing_ids,
      dependency_order: node.order,
    }));
  const blockers = plan.nodes
    .filter((node) => node.blocker || node.state === "duplicate")
    .map((node) => ({ key: node.id, message: node.blocker, state: node.state }));
  const warnings = plan.nodes
    .filter((node) => node.warning || node.decision === "unresolved")
    .map((node) => ({
      key: node.id,
      message: node.warning || "Decision remains unresolved.",
    }));
  return {
    schema_version: 1,
    mode: intent.mode,
    planned_creates: plannedCreates,
    planned_updates: [],
    planned_links: plannedLinks,
    planned_assignments: (intent.property_assignments || [])
      .filter((item) => ["confirmed", "edited"].includes(item.status))
      .map((item) => ({
        ...item,
        group: "property_assignments",
        requires_enhanced_confirmation:
          item.usage === "compatibility" || Boolean(item.validator_key),
      })),
    warnings,
    blockers,
    publication_actions: approved
      .filter((node) => node.node_type === "medusa_product")
      .map((node) => ({
        key: node.id,
        operation: "create_draft_product_after_stage04_validation",
        requires_separate_confirmation: true,
      })),
    excluded_suggestions: plan.nodes
      .filter((node) => !["confirmed", "edited"].includes(node.decision))
      .map((node) => ({ key: node.id, decision: node.decision }))
      .concat(
        (intent.property_assignments || [])
          .filter((item) => !["confirmed", "edited"].includes(item.status))
          .map((item) => ({ key: item.id, decision: item.status })),
      ),
    status: blockers.length ? "blocked" : "preview",
    writes_performed: false,
  };
}

export function describeModeSwitch(from: GeniusMode, to: GeniusMode) {
  return {
    from,
    to,
    confirmed_data_preserved: true,
    suggestions_preserved_as_drafts: true,
    existing_entities_modified: false,
    existing_entities_deleted: false,
    automatic_actions: [],
    manifest_rule:
      to === "bulk_apply"
        ? "Only confirmed or edited decisions enter the manifest."
        : "Unapplied manifests remain saved; confirmed decisions remain visible.",
  };
}

export function analyzePropertyCompleteness(input: {
  value_present: boolean;
  unit_present: boolean;
  affects_compatibility: boolean;
  concept_present: boolean;
  relation_present: boolean;
  validator_present: boolean;
  inherited_conflict: boolean;
}) {
  const chain = [
    { key: "value", ready: input.value_present, blocker: true },
    { key: "unit", ready: input.unit_present, blocker: false },
    {
      key: "concept",
      ready: !input.affects_compatibility || input.concept_present,
      blocker: input.affects_compatibility,
    },
    {
      key: "relation",
      ready: !input.affects_compatibility || input.relation_present,
      blocker: input.affects_compatibility,
    },
    {
      key: "validator",
      ready: !input.affects_compatibility || input.validator_present,
      blocker: input.affects_compatibility,
    },
    {
      key: "inherited_conflict",
      ready: !input.inherited_conflict,
      blocker: true,
    },
  ];
  return {
    chain,
    ready: chain.every((item) => item.ready || !item.blocker),
    blockers: chain.filter((item) => item.blocker && !item.ready),
  };
}
