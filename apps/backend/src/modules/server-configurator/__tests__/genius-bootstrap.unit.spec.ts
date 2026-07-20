import fs from "node:fs";
import path from "node:path";
import {
  analyzePropertyCompleteness,
  buildCreationManifest,
  buildDependencyPlan,
  describeModeSwitch,
  discoverBootstrapContext,
  GeniusIntent,
  GeniusRegistrySnapshot,
} from "../genius-bootstrap";
import { Stage08ReviewedImportAdapter } from "../genius-apply-adapter";

const emptyRegistry = (): GeniusRegistrySnapshot => ({
  platforms: [],
  generations: [],
  server_models: [],
  concepts: [],
  aliases: [],
  packs: [],
  storage_options: [],
  option_groups: [],
  properties: [],
  relation_types: [],
  relations: [],
  component_types: [],
});

const intent = (overrides: Partial<GeniusIntent> = {}): GeniusIntent => ({
  mode: "guided_manual",
  launch_mode: "bootstrap_technology_platform",
  vendor: "Acme",
  generation_label: "G1",
  platform_name: "Acme Compute One",
  platform_key: "acme-compute-one",
  socket: "ACME-S1",
  memory_technology: "DDR-X",
  server_model: "Rack One",
  source_reference: "Acme guide p. 12",
  source_type: "document",
  confidence: 0.9,
  decisions: {},
  property_assignments: [],
  ...overrides,
});

describe("Genius Bootstrap planning and safety", () => {
  it("starts from an empty platform/generation context with deterministic dependency order and no writes", () => {
    const registry = emptyRegistry();
    const first = buildDependencyPlan(intent(), registry);
    const second = buildDependencyPlan(intent(), registry);
    expect(first).toEqual(second);
    expect(first.nodes).toHaveLength(12);
    expect(first.nodes.map((node) => node.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(first.nodes.find((node) => node.node_type === "technology_platform")?.action).toBe(
      "create",
    );
    expect(first.writes_performed).toBe(false);
    expect(discoverBootstrapContext(intent(), registry).writes_performed).toBe(
      false,
    );
  });

  it("detects duplicate canonical concepts before manifest save", () => {
    const registry = emptyRegistry();
    registry.concepts = [
      { id: "concept_1", stable_key: "acme-s1" },
      { id: "concept_2", display_name: "ACME S1" },
    ];
    const discovery = discoverBootstrapContext(intent(), registry);
    const plan = buildDependencyPlan(intent(), registry);
    expect(discovery.duplicates.concepts).toEqual(["concept_1", "concept_2"]);
    expect(
      plan.nodes.find((node) => node.node_type === "socket_concept")?.state,
    ).toBe("duplicate");
    expect(plan.duplicate_count).toBe(1);
  });

  it("uses one canonical manifest and includes only confirmed decisions", () => {
    const draftPlan = buildDependencyPlan(intent(), emptyRegistry());
    const platform = draftPlan.nodes.find(
      (node) => node.node_type === "technology_platform",
    )!;
    const server = draftPlan.nodes.find(
      (node) => node.node_type === "server_model",
    )!;
    const confirmedIntent = intent({
      mode: "bulk_apply",
      decisions: {
        [platform.id]: "confirmed",
        [server.id]: "suggested",
      },
      property_assignments: [
        {
          id: "property-1",
          scope_type: "technology_platform",
          scope_id: "platform_draft",
          property_definition_id: "prop_socket",
          normalized_value: "ACME-S1",
          inheritance_behavior: "direct",
          usage: "compatibility",
          concept_id: "concept_socket",
          relation_role: "provides",
          validator_key: "socket_match",
          provider_consumer: "provider",
          status: "confirmed",
        },
      ],
    });
    const plan = buildDependencyPlan(confirmedIntent, emptyRegistry());
    const manifest = buildCreationManifest(confirmedIntent, plan);
    expect(manifest.planned_creates.map((item) => item.key)).toContain(
      platform.id,
    );
    expect(manifest.planned_creates.map((item) => item.key)).not.toContain(
      server.id,
    );
    expect(manifest.planned_assignments).toHaveLength(1);
    expect(manifest.planned_assignments[0].requires_enhanced_confirmation).toBe(
      true,
    );
    expect(manifest.writes_performed).toBe(false);
  });

  it("describes every mode switch as a state-preserving no-op for domain entities", () => {
    const matrix = [
      describeModeSwitch("guided_manual", "assisted_draft"),
      describeModeSwitch("assisted_draft", "guided_manual"),
      describeModeSwitch("assisted_draft", "bulk_apply"),
      describeModeSwitch("bulk_apply", "guided_manual"),
    ];
    expect(matrix.every((item) => item.confirmed_data_preserved)).toBe(true);
    expect(matrix.every((item) => item.existing_entities_modified === false)).toBe(
      true,
    );
    expect(matrix.every((item) => item.existing_entities_deleted === false)).toBe(
      true,
    );
    expect(matrix.every((item) => item.automatic_actions.length === 0)).toBe(
      true,
    );
  });

  it("blocks compatibility properties at the exact missing concept/relation/validator chain", () => {
    const result = analyzePropertyCompleteness({
      value_present: true,
      unit_present: true,
      affects_compatibility: true,
      concept_present: true,
      relation_present: false,
      validator_present: false,
      inherited_conflict: false,
    });
    expect(result.ready).toBe(false);
    expect(result.blockers.map((item) => item.key)).toEqual([
      "relation",
      "validator",
    ]);
  });

  it("bridges the shared manifest to stage-08 review without a direct apply path", async () => {
    const adapter = new Stage08ReviewedImportAdapter();
    const input = {
      manifest: {
        planned_creates: [{ entity_type: "technology_platform" }],
        blockers: [],
        warnings: [],
      },
      idempotency_key: "genius-session-1-v1",
      actor_id: "user_1",
      approved_groups: [],
    };
    expect(adapter.capabilities()).toEqual({
      dry_run: true,
      apply: false,
      transactional_apply_owner: "stage-08-import-pipeline",
    });
    await expect(adapter.dryRun(input)).resolves.toMatchObject({
      stage: "08",
      writes_performed: false,
      apply_available: false,
      approved_item_count: 1,
    });
    await expect(adapter.apply(input)).rejects.toThrow(
      /stage-08 import review/i,
    );
  });

  it("keeps discovery, planning, mode switching and dry-run routes free of hidden domain writes", () => {
    const root = path.resolve(__dirname, "../../..");
    const readOnlySources = [
      "api/admin/server-configurator/genius/discovery/route.ts",
      "api/admin/server-configurator/genius/plan/route.ts",
      "api/admin/server-configurator/genius/property-completeness/route.ts",
      "api/admin/server-configurator/genius/bulk-adapter/route.ts",
    ].map((file) => fs.readFileSync(path.join(root, file), "utf8"));
    for (const source of readOnlySources) {
      expect(source).not.toMatch(/createTechnology|createServerModel|createProductsWorkflow/);
      expect(source).not.toMatch(/updateTechnology|deleteTechnology|deleteServerModel/);
    }
    expect(readOnlySources.join("\n")).toContain("Stage08ReviewedImportAdapter");
  });

  it("renders three persistent modes, recursive return context, confirmation center and separate publication", () => {
    const root = path.resolve(__dirname, "../../..");
    const page = fs.readFileSync(
      path.join(
        root,
        "admin/routes/server-configurator/genius-bootstrap/page.tsx",
      ),
      "utf8",
    );
    expect(page).toContain("Guided Manual");
    expect(page).toContain("Assisted Draft");
    expect(page).toContain("Bulk Apply");
    expect(page).toContain("Confirmation Center");
    expect(page).toContain("return_node");
    expect(page).toContain("Action Preview");
    expect(page).toContain("Stage manifest for import review");
    expect(page).toContain("Open separate publication review");
  });
});
