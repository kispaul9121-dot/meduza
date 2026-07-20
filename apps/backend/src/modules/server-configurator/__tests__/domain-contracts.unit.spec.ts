import {
  adaptLegacyComponent,
  calculateDomainCoverage,
  capabilityProfileErrors,
  canonicalComponentPayload,
  componentContractErrors,
  componentTypeDefinitionErrors,
  effectivePropertyStatus,
  optionGroupErrors,
  resolvePackAssignments,
  storageCageErrors,
  suggestDrivePackCandidates,
} from "../domain-contracts"

describe("stage 03 domain invariants", () => {
  it("preserves legacy specs in both canonical and raw storage", () => {
    const specs = { socket: "LGA3647", undocumented_vendor_field: "kept" }
    const adapted = adaptLegacyComponent({ specs_json: specs })

    expect(adapted.normalized_specs_json).toEqual(specs)
    expect(adapted.raw_specs_json).toEqual(specs)
    expect(adapted.source_json).toEqual({
      adapter: "legacy_specs_json_v1",
      source_doc_reference: null,
    })
  })

  it("blocks a compatibility property without a fact or validator mapping", () => {
    expect(
      effectivePropertyStatus({
        key: "future.interconnect",
        affects_compatibility: true,
        usage_status: "unmapped",
      })
    ).toBe("unmapped_compatibility_property")
  })

  it("normalizes legacy writes and validates accelerator subtypes", () => {
    const payload = canonicalComponentPayload({
      type: "accelerator",
      specs_json: { subtype: "gpu", memory_gb: 48 },
    })

    expect(payload.normalized_specs_json).toEqual({ subtype: "gpu", memory_gb: 48 })
    expect(payload.normalization_status).toBe("partially_normalized")
    expect(componentContractErrors(payload)).toEqual([])
    expect(
      componentContractErrors({ type: "accelerator", specs_json: { subtype: "video" } })
    ).toEqual(["Accelerator subtype must be gpu, fpga, dpu or ai_accelerator."])
  })

  it("requires a validator unless the component type is explicitly informational", () => {
    expect(componentTypeDefinitionErrors({
      key: "future_board",
      compatibility_mode: "validated",
      validator_key: null,
    })).toEqual(["Component type has no validator mapping: future_board"])
    expect(componentTypeDefinitionErrors({
      key: "service",
      compatibility_mode: "informational",
      validator_key: null,
    })).toEqual([])
  })

  it("inherits a platform pack and honors an explicit model exclusion", () => {
    const hierarchy = [
      { scope_type: "technology_platform", scope_id: "platform-intel-2g" },
      { scope_type: "server_model", scope_id: "model-r640" },
    ]
    const assignments = [
      {
        id: "platform-cpu",
        scope_type: "technology_platform",
        scope_id: "platform-intel-2g",
        component_pack_id: "pack-cpu-2g",
        enabled: true,
        priority: 10,
        inheritance_behavior: "inherit" as const,
      },
      {
        id: "model-exclusion",
        scope_type: "server_model",
        scope_id: "model-r640",
        component_pack_id: "pack-cpu-2g",
        enabled: true,
        priority: 10,
        inheritance_behavior: "exclude" as const,
      },
    ]

    expect(resolvePackAssignments(hierarchy, assignments)).toEqual([])
  })

  it("suggests drive packs only when form factor, protocol, adapter and scope agree", () => {
    const [approved, wrongProtocol, missingAdapter] = suggestDrivePackCandidates(
      {
        accepted_form_factors: ["LFF", "SFF"],
        protocols: ["SAS", "SATA"],
        approved_adapters: ["adapter-lff-sff"],
        controller_capabilities: ["sas12"],
        scope_ids: ["storage-r640-8sff"],
        bay_count: 8,
      },
      [
        {
          pack_id: "pack-sff-sas",
          form_factors: ["SFF"],
          protocols: ["SAS"],
          requires_adapter: "adapter-lff-sff",
          required_controller_capabilities: ["sas12"],
          qualification_scope_ids: ["storage-r640-8sff"],
        },
        { pack_id: "pack-nvme", form_factors: ["SFF"], protocols: ["NVMe"] },
        {
          pack_id: "pack-adapted",
          form_factors: ["SFF"],
          protocols: ["SAS"],
          requires_adapter: "another-adapter",
        },
      ]
    )

    expect(approved.suggested).toBe(true)
    expect(wrongProtocol.reasons.protocol).toBe(false)
    expect(missingAdapter.reasons.adapter).toBe(false)
  })

  it("rejects a drive suggestion when controller capabilities are missing", () => {
    const [candidate] = suggestDrivePackCandidates(
      {
        accepted_form_factors: ["SFF"],
        protocols: ["NVMe"],
        approved_adapters: [],
        controller_capabilities: [],
        scope_ids: ["storage-1"],
        bay_count: 8,
      },
      [{
        pack_id: "pack-nvme",
        form_factors: ["SFF"],
        protocols: ["NVMe"],
        required_controller_capabilities: ["nvme-tri-mode"],
      }]
    )

    expect(candidate.suggested).toBe(false)
    expect(candidate.reasons.controller).toBe(false)
  })

  it("validates strict capability, cage and real-none option contracts", () => {
    expect(capabilityProfileErrors({ schema_version: 1 })).toHaveLength(11)
    expect(storageCageErrors([{
      count: 2,
      native_form_factor: "LFF",
      accepted_form_factors: ["LFF", "SFF"],
      numbering_start: 1,
      numbering_end: 2,
    }])).toEqual(["Bay group 0 requires an adapter for SFF."])
    expect(optionGroupErrors({
      allow_none: true,
      none_selected_by_default: true,
      min_quantity: 0,
      max_quantity: 1,
    })).toEqual(["allow_none requires a none_label."])
  })

  it("reports unmapped compatibility and orphaned registry coverage", () => {
    const coverage = calculateDomainCoverage({
      properties: [
        {
          id: "p1",
          key: "future.fabric",
          affects_compatibility: true,
          lifecycle_status: "active",
        },
        {
          id: "p2",
          key: "legacy.label",
          affects_compatibility: false,
          lifecycle_status: "deprecated",
        },
      ],
      property_values: [{ property_definition_id: "p2" }],
      relation_types: [
        { id: "r1", key: "requires", status: "engine_mapped", validator_key: null },
      ],
      relations: [],
      concepts: [
        { id: "c1", stable_key: "fclga3647" },
        { id: "c2", stable_key: "FCLGA3647" },
      ],
      aliases: [
        { technology_concept_id: "c1", normalized_alias: "socket_p" },
        { technology_concept_id: "c2", normalized_alias: "socket_p" },
      ],
      packs: [{ id: "pack1", slug: "xeon-2g" }],
      assignments: [{
        component_pack_id: "pack2",
        scope_type: "server_model",
        scope_id: "r640",
        enabled: true,
        inheritance_behavior: "override",
        overrides_json: { unresolved_conflicts: ["cpu.socket"] },
      }],
    })

    expect(coverage.compatibility_properties_without_mapping).toEqual(["future.fabric"])
    expect(coverage.relation_types_without_validator).toEqual(["requires"])
    expect(coverage.concepts_without_consumers_or_providers).toEqual([
      "fclga3647",
      "FCLGA3647",
    ])
    expect(coverage.packs_without_compatible_scope).toEqual(["xeon-2g"])
    expect(coverage.duplicate_aliases).toEqual(["socket_p"])
    expect(coverage.duplicate_concepts).toEqual(["fclga3647"])
    expect(coverage.scopes_with_unresolved_inherited_conflicts).toEqual(["server_model:r640"])
    expect(coverage.deprecated_properties_still_used).toEqual(["legacy.label"])
  })
})
