import { validateReadiness } from "../engine/readiness"
import { CompatibilityData } from "../engine/types"

const data: CompatibilityData = {
  model: { id: "server" },
  components: [],
  selected: [],
  scope_chain: [
    { type: "global", id: "global" },
    { type: "server_model", id: "server" },
  ],
  property_definitions: [
    {
      id: "definition",
      key: "socket",
      value_type: "text",
      entity_scopes: ["server_model"],
      affects_compatibility: true,
    },
  ],
  property_assignments: [
    {
      id: "assignment",
      owner_type: "server_model",
      owner_id: "server",
      property_definition_id: "definition",
      assignment_mode: "direct",
      value_json: "LGA",
      enabled: true,
    },
  ],
}

const publishable: CompatibilityData = {
  model: { id: "server", public_name: "Publishable server" },
  components: [],
  selected: [],
  scope_chain: [
    { type: "global", id: "global" },
    { type: "server_model", id: "server" },
  ],
  property_definitions: [],
  property_assignments: [],
  property_values: [],
  relation_type_definitions: [],
  relations: [],
  concepts: [],
  component_type_definitions: [],
  capability_profiles: [
    {
      id: "profile",
      owner_type: "server_model",
      owner_id: "server",
      review_status: "verified",
    },
  ],
  storage_options: [
    {
      id: "storage",
      server_model_id: "server",
      key: "8sff",
      public_name: "8 SFF",
      enabled: true,
      storage_cages_json: [{ id: "front", bays: 8 }],
      drive_limits_json: { total: 8 },
      backplane_variants_json: [{ id: "sas-sata" }],
      suggested_drive_packs_json: [{ id: "pack" }],
    },
  ],
  option_groups: [],
  direct_assignments: [],
  pack_assignments: [],
  packs: [],
  pack_items: [],
  configurations: [],
}

describe("readiness modes", () => {
  it("guided_check returns one next blocker and never marks partial drafts compatible", () => {
    const result = validateReadiness({ ...data, partial: true }, { mode: "guided_check" })
    expect(result.blockers).toHaveLength(1)
    expect(result.blockers[0].code).toBe("PARTIAL_GRAPH_UNRESOLVED")
    expect(result.compatible).toBe(false)
  })

  it("assisted_preview separates recommendations from deterministic results", () => {
    const result = validateReadiness(data, { mode: "assisted_preview" })
    expect(result.proposed_mappings).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "assign_validator" })]),
    )
    expect(result.recommendations).toEqual(result.recommended_next_actions)
  })

  it("bulk_dry_run detects duplicate identities and remains idempotent on unique manifests", () => {
    const duplicate = validateReadiness(data, {
      mode: "bulk_dry_run",
      manifest: {
        planned_creates_json: [
          { entity_type: "component", key: "x" },
          { entity_type: "component", key: "x" },
        ],
      },
    })
    expect(duplicate.blockers.map((item: any) => item.code)).toContain(
      "MANIFEST_DUPLICATE_IDENTITY",
    )
    expect(duplicate.idempotent).toBe(false)

    const unique = validateReadiness(data, {
      mode: "bulk_dry_run",
      manifest: {
        planned_creates_json: [{ entity_type: "component", key: "x" }],
      },
    })
    expect(unique.idempotent).toBe(true)
  })

  it("production validation blocks an unmapped compatibility property", () => {
    const result = validateReadiness(data, { mode: "production_validation" })
    expect(result.ready).toBe(false)
    expect(result.validator_gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PROPERTY_VALIDATOR_MISSING" }),
      ]),
    )
  })

  it("allows publication when all deterministic gates pass", () => {
    const result = validateReadiness(publishable, {
      mode: "production_validation",
    })
    expect(result.ready).toBe(true)
    expect(result.publication_allowed).toBe(true)
    expect(result.blocking_error_count).toBe(0)
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "PUBLICATION_READINESS_COMPLETE",
          severity: "complete",
        }),
      ]),
    )
  })

  it("blocks publication when storage topology is missing", () => {
    const result = validateReadiness(
      { ...publishable, storage_options: [] },
      { mode: "production_validation" },
    )
    expect(result.publication_allowed).toBe(false)
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "STORAGE_OPTION_MISSING" }),
      ]),
    )
  })

  it("blocks an optional component that is silently hidden", () => {
    const result = validateReadiness(
      {
        ...publishable,
        components: [
          {
            id: "component",
            type: "nic",
            public_name: "NIC",
            enabled: true,
          },
        ],
        component_type_definitions: [
          {
            key: "nic",
            compatibility_mode: "validated",
            validator_key: "nic-validator",
          },
        ],
        direct_assignments: [
          {
            id: "assignment",
            server_model_id: "server",
            component_id: "component",
            assignment_role: "optional_choice",
            selection_mode: "hidden_technical",
            default_quantity: 0,
            min_quantity: 0,
            max_quantity: 1,
            enabled: true,
          },
        ],
      },
      { mode: "production_validation" },
    )
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "HIDDEN_TECHNICAL_ROLE_INVALID" }),
      ]),
    )
  })

  it("keeps informational relations as warnings instead of publication blockers", () => {
    const result = validateReadiness(
      {
        ...publishable,
        relation_type_definitions: [
          { id: "info-type", key: "documents", status: "informational" },
        ],
        relations: [
          {
            id: "relation",
            source_type: "server_model",
            source_id: "server",
            relation_type_id: "info-type",
            target_type: "technology_concept",
            target_id: "manual",
          },
        ],
      },
      { mode: "production_validation" },
    )
    expect(result.publication_allowed).toBe(true)
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "RELATION_INFORMATIONAL_ONLY" }),
      ]),
    )
  })
})
