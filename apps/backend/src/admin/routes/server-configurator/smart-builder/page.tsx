import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Sparkles } from "@medusajs/icons";
import {
  Badge,
  Button,
  Checkbox,
  Container,
  DataTable,
  DataTablePaginationState,
  DataTableRowSelectionState,
  FocusModal,
  Heading,
  Input,
  ProgressTabs,
  Select,
  Text,
  createDataTableColumnHelper,
  toast,
  useDataTable,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminGet, adminPost, query } from "../_shared/api";
import { Field, SelectField } from "../_shared/form";
import {
  KeyValueBuilder,
  MappingRow,
  mappingObject,
} from "../_shared/key-value-builder";
import { ComponentRow, ServerModel } from "../_shared/types";

const Spinner = () => <Text size="small">Loading…</Text>;

const steps = [
  "What",
  "Recommendation",
  "Server context",
  "Component type",
  "Object data",
  "Components",
  "Compatibility mapping",
  "Resources",
  "Visibility",
  "Assignment",
  "Validation",
  "Save & return",
];
const intents = [
  [
    "alternatives",
    "Interchangeable components",
    "All Xeon Scalable 2nd Gen → candidate pack",
  ],
  [
    "unique_component",
    "One server-specific component",
    "Unique expander board → direct assignment",
  ],
  [
    "assembly_bundle",
    "Parts installed together",
    "GPU riser + cable + fan kit → assembly bundle",
  ],
  [
    "storage_configuration",
    "Physical storage configuration",
    "12 LFF front + 4 internal → StorageTopology",
  ],
  [
    "new_component_type",
    "New component class",
    "Create a draft type and validator mapping",
  ],
  [
    "import_list",
    "Imported component list",
    "Preview existing imported records before apply",
  ],
] as const;

type Preview = {
  recommendation: {
    entity_type: string;
    reason: string;
    warnings: string[];
    available_validator_keys: string[];
  };
  server_context: any;
  validation: any;
  duplicate_candidates: any[];
  writes_performed: false;
};

type BuilderState = {
  intent: (typeof intents)[number][0];
  server_model_id: string;
  reuse_model_count: number;
  component_count: number;
  adds_resources: string[];
  affects_compatibility: boolean;
  entity_type: string;
  component_type: string;
  validator_key: string;
  name: string;
  slug: string;
  brand: string;
  model: string;
  part_number: string;
  public_name: string;
  short_name: string;
  source_reference: string;
  selected_component_ids: string[];
  mappings: MappingRow[];
  requires: MappingRow[];
  provides: MappingRow[];
  consumes: MappingRow[];
  conflicts: MappingRow[];
  assignment_role: string;
  selection_mode: string;
  default_quantity: number;
  min_quantity: number;
  max_quantity: number;
  sort_order: number;
  scope_type: string;
  scope_id: string;
  pack_kind: string;
  storage_location: string;
  storage_protocols: string[];
  bay_groups: Array<{
    key: string;
    count: number;
    native_form_factor: string;
    accepted_form_factors: string[];
    adapter_component_id: string;
    zone_id: string;
    protocols: string[];
  }>;
  return_to: string;
  parent_session_id: string;
  parent_node_id: string;
};

const initialState: BuilderState = {
  intent: "alternatives",
  server_model_id: "",
  reuse_model_count: 1,
  component_count: 1,
  adds_resources: [],
  affects_compatibility: true,
  entity_type: "ComponentPack",
  component_type: "cpu",
  validator_key: "cpu",
  name: "",
  slug: "",
  brand: "",
  model: "",
  part_number: "",
  public_name: "",
  short_name: "",
  source_reference: "",
  selected_component_ids: [],
  mappings: [],
  requires: [],
  provides: [],
  consumes: [],
  conflicts: [],
  assignment_role: "optional_choice",
  selection_mode: "visible",
  default_quantity: 0,
  min_quantity: 0,
  max_quantity: 1,
  sort_order: 100,
  scope_type: "server_model",
  scope_id: "",
  pack_kind: "candidate_pool",
  storage_location: "front",
  storage_protocols: ["SAS", "SATA"],
  bay_groups: [
    {
      key: "front",
      count: 8,
      native_form_factor: "2.5",
      accepted_form_factors: [],
      adapter_component_id: "",
      zone_id: "front",
      protocols: ["SAS", "SATA"],
    },
  ],
  return_to: "/server-configurator/smart-builder",
  parent_session_id: "",
  parent_node_id: "",
};

const componentColumn = createDataTableColumnHelper<ComponentRow>();

function validationTone(value: any) {
  if (!value) return "grey" as const;
  return value.ready ? ("green" as const) : ("orange" as const);
}

function ResourceSummary({ state }: { state: BuilderState }) {
  const items = [
    ["Requires", state.requires],
    ["Provides", state.provides],
    ["Consumes", state.consumes],
    ["Conflicts", state.conflicts],
  ] as const;
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {items.map(([label, rows]) => (
        <div
          key={label}
          className="rounded-md border border-ui-border-base p-3"
        >
          <Text size="small" leading="compact" weight="plus">
            {label}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {rows.length
              ? rows.map((row) => `${row.key}: ${row.value}`).join("; ")
              : "None"}
          </Text>
        </div>
      ))}
    </div>
  );
}

const SmartBuilderPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<BuilderState>(() => ({
    ...initialState,
    server_model_id: params.get("server_model_id") || "",
    scope_id: params.get("server_model_id") || "",
    intent: (params.get("intent") as BuilderState["intent"]) || "alternatives",
    return_to: params.get("return_to") || initialState.return_to,
    parent_session_id: params.get("parent_session_id") || "",
    parent_node_id: params.get("parent_node_id") || "",
  }));
  const [preview, setPreview] = useState<Preview | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [dirty, setDirty] = useState(false);
  const [selectionSearch, setSelectionSearch] = useState("");
  const [selectionPagination, setSelectionPagination] =
    useState<DataTablePaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>(
    {},
  );
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const set = <K extends keyof BuilderState>(
    key: K,
    value: BuilderState[K],
  ) => {
    setState((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["sc-smart-models"],
    queryFn: () =>
      adminGet<{ models: ServerModel[] }>(
        "/admin/server-configurator/models?enabled=true&limit=500",
      ),
  });
  const {
    data: drafts,
    isLoading: draftsLoading,
    isError: draftsError,
  } = useQuery({
    queryKey: ["sc-smart-drafts"],
    queryFn: () =>
      adminGet<{ drafts: any[] }>(
        "/admin/server-configurator/smart-builder/drafts",
      ),
  });
  const limit = selectionPagination.pageSize;
  const offset = selectionPagination.pageIndex * limit;
  const { data: componentData, isLoading: componentsLoading } = useQuery({
    queryKey: [
      "sc-smart-components",
      limit,
      offset,
      selectionSearch,
      state.component_type,
    ],
    queryFn: () =>
      adminGet<{ components: ComponentRow[]; count: number }>(
        `/admin/server-configurator/components${query({ limit, offset, q: selectionSearch, type: state.component_type })}`,
      ),
    enabled: open,
  });

  const autosave = useMutation({
    mutationFn: () =>
      adminPost<{ entity: any }>(
        "/admin/server-configurator/smart-builder/drafts",
        {
          id: draftId,
          current_step: String(step + 1),
          draft_payload_json: state,
          mode_hint: "smart_component_pack",
          status: preview ? "ready" : "draft",
        },
      ),
    onSuccess: (result) => {
      setDraftId(result.entity.id);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["sc-smart-drafts"] });
    },
  });
  useEffect(() => {
    if (!open || !dirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => autosave.mutate(), 800);
    return () => autosaveTimer.current && clearTimeout(autosaveTimer.current);
  }, [dirty, open, state, step]);
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);

  const previewMutation = useMutation({
    mutationFn: () =>
      adminPost<Preview>("/admin/server-configurator/smart-builder/preview", {
        intent: state.intent,
        server_model_id: state.server_model_id || undefined,
        reuse_model_count: state.reuse_model_count,
        component_count: state.component_count,
        adds_resources: state.adds_resources,
        affects_compatibility: state.affects_compatibility,
        selected_components: state.selected_component_ids.map(
          (component_id) => ({ component_id, quantity: 1 }),
        ),
      }),
    onSuccess: (result) => {
      setPreview(result);
      set("entity_type", result.recommendation.entity_type);
      toast.success("Side-effect-free preview updated");
    },
    onError: (error: Error) => toast.error(error.message || "Preview failed"),
  });

  const buildApplyPayload = () => {
    const common = {
      server_model_id: state.server_model_id,
      return_to: state.return_to,
      source_context: {
        wizard_draft_id: draftId,
        source_reference: state.source_reference,
        parent_session_id: state.parent_session_id || undefined,
        parent_node_id: state.parent_node_id || undefined,
      },
    };
    if (state.entity_type === "ServerModelComponentAssignment")
      return {
        entity_kind: "direct_component",
        ...common,
        component: {
          type: state.component_type,
          brand: state.brand || "Unspecified",
          model: state.model || state.name,
          part_number: state.part_number || null,
          public_name: state.public_name || state.name,
          short_name: state.short_name || state.name,
          specs_json: mappingObject(state.mappings),
          normalized_specs_json: mappingObject(state.mappings),
          raw_specs_json: {},
          requirements_json: mappingObject(state.requires),
          provides_json: mappingObject(state.provides),
          consumes_json: mappingObject(state.consumes),
          applicability_json: { server_model_ids: [state.server_model_id] },
          source_json: { reference: state.source_reference },
          normalization_status: "partially_normalized",
          price: 0,
          cost: 0,
          stock_qty: 0,
          enabled: false,
        },
        assignment: {
          assignment_role: state.assignment_role,
          selection_mode: state.selection_mode,
          default_quantity: state.default_quantity,
          min_quantity: state.min_quantity,
          max_quantity: state.max_quantity,
          sort_order: state.sort_order,
          assignment_source: "smart_builder",
          source_doc_reference: state.source_reference || null,
          requirements_override_json: mappingObject(state.requires),
          provides_override_json: mappingObject(state.provides),
          consumes_override_json: mappingObject(state.consumes),
          conflicts_override_json: {
            component_ids: state.conflicts
              .map((row) => row.key)
              .filter(Boolean),
          },
        },
      };
    if (state.entity_type === "StorageTopology")
      return {
        entity_kind: "storage_topology",
        ...common,
        cage: {
          name: state.name,
          location: state.storage_location,
          bay_groups: state.bay_groups.map((group) => ({
            ...group,
            accepted_form_factors: group.accepted_form_factors,
            adapter_component_id: group.adapter_component_id || undefined,
            numbering_start: 0,
            hot_swap: true,
            max_populated: group.count,
          })),
          hot_swap: true,
          source_doc_reference: state.source_reference || null,
        },
        backplane: {
          name: `${state.name} backplane`,
          supported_protocols: state.storage_protocols,
          connector_types: [],
          connection_mode: "hybrid",
          max_protocol_bays_json: Object.fromEntries(
            state.storage_protocols.map((protocol) => [
              protocol,
              state.bay_groups
                .filter((group) => group.protocols.includes(protocol))
                .reduce((sum, group) => sum + group.count, 0),
            ]),
          ),
          lane_requirements_json: mappingObject(state.consumes),
          required_controller_capabilities_json: mappingObject(state.requires),
          required_cables_json: {},
          provides_json: mappingObject(state.provides),
          consumes_json: mappingObject(state.consumes),
          conflicts_json: {
            component_ids: state.conflicts
              .map((row) => row.key)
              .filter(Boolean),
          },
          source_doc_reference: state.source_reference || null,
        },
        option: {
          key: state.slug,
          public_name: state.public_name || state.name,
          is_base: false,
          is_default: false,
          required_bundles_json: [],
          conflicts_json: {
            component_ids: state.conflicts
              .map((row) => row.key)
              .filter(Boolean),
          },
          source_doc_reference: state.source_reference || null,
        },
      };
    return {
      entity_kind:
        state.entity_type === "AssemblyBundle"
          ? "assembly_bundle"
          : "component_pack",
      pack: {
        name: state.name,
        slug: state.slug,
        description: `${state.name} created by Smart Builder`,
        component_type: state.component_type,
        pack_kind:
          state.entity_type === "AssemblyBundle"
            ? "assembly_bundle"
            : state.pack_kind,
        defaults_json: mappingObject(state.mappings),
        enabled: false,
        source_doc_reference: state.source_reference || null,
      },
      component_ids: state.selected_component_ids,
      assignment: state.scope_id
        ? {
            scope_type: state.scope_type,
            scope_id: state.scope_id,
            inheritance_behavior: "inherit",
            assignment_source: "smart_builder",
            source_reference: state.source_reference || null,
          }
        : undefined,
      return_to: state.return_to,
      source_context: common.source_context,
    };
  };
  const apply = useMutation({
    mutationFn: async () => {
      if (state.entity_type === "ComponentTypeDefinition")
        return adminPost<any>(
          "/admin/server-configurator/knowledge-base/component_type_definition",
          {
            entity_type: "component_type_definition",
            data: {
              key: state.slug,
              name: state.name,
              description: `${state.name} type`,
              fields_schema_json: Object.fromEntries(
                state.mappings.map((row) => [
                  row.key,
                  {
                    type: row.value || "text",
                    usage: row.behavior || "informational",
                  },
                ]),
              ),
              facts_mapping_json: mappingObject(
                state.mappings.filter(
                  (row) => row.behavior === "engine_mapped",
                ),
              ),
              validator_key: state.validator_key || null,
              compatibility_mode: state.affects_compatibility
                ? "validated"
                : "informational",
              enabled: false,
            },
            return_to: state.return_to,
          },
        );
      return adminPost<any>(
        "/admin/server-configurator/smart-builder/apply",
        buildApplyPayload(),
      );
    },
    onSuccess: (result) => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["sc-smart-drafts"] });
      toast.success("Created with audit trail and rollback protection");
      const target = result.return_to || state.return_to;
      setOpen(false);
      navigate(target, {
        state: {
          highlightId: result.highlight_id || result.entity?.id,
          validation: result.validation,
          returnNode: state.parent_node_id || undefined,
          parentSessionId: state.parent_session_id || undefined,
          revalidateDependencies: Boolean(state.parent_session_id),
        },
      });
    },
    onError: (error: Error) =>
      toast.error(
        error.message || "Apply failed; created records were compensated",
      ),
  });

  const columns = useMemo(
    () => [
      componentColumn.select(),
      componentColumn.accessor("public_name", {
        header: "Component",
        cell: ({ row }) => (
          <div>
            <Text size="small" leading="compact" weight="plus">
              {row.original.public_name}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {row.original.part_number || row.original.model}
            </Text>
          </div>
        ),
      }),
      componentColumn.accessor("brand", { header: "Brand" }),
      componentColumn.accessor("type", { header: "Type" }),
    ],
    [],
  );
  const table = useDataTable({
    data: componentData?.components || [],
    columns,
    getRowId: (row) => row.id,
    rowCount: componentData?.count || 0,
    isLoading: componentsLoading,
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: (next) => {
        setRowSelection(next);
        set("selected_component_ids", Object.keys(next));
      },
    },
    search: { state: selectionSearch, onSearchChange: setSelectionSearch },
    pagination: {
      state: selectionPagination,
      onPaginationChange: setSelectionPagination,
    },
  });

  const addBayGroup = () =>
    set("bay_groups", [
      ...state.bay_groups,
      {
        key: `group-${state.bay_groups.length + 1}`,
        count: 1,
        native_form_factor: "2.5",
        accepted_form_factors: [],
        adapter_component_id: "",
        zone_id: `zone-${state.bay_groups.length + 1}`,
        protocols: ["SAS"],
      },
    ]);
  const updateBayGroup = (
    index: number,
    patch: Partial<BuilderState["bay_groups"][number]>,
  ) =>
    set(
      "bay_groups",
      state.bay_groups.map((group, groupIndex) =>
        groupIndex === index ? { ...group, ...patch } : group,
      ),
    );
  const canApply = Boolean(
    preview &&
    state.name &&
    (state.entity_type === "ComponentTypeDefinition" ||
      state.server_model_id ||
      ["ComponentPack", "AssemblyBundle"].includes(state.entity_type)),
  );

  const content = (() => {
    if (step === 0)
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          {intents.map(([value, label, example]) => (
            <button
              key={value}
              type="button"
              className={`rounded-md border p-4 text-left ${state.intent === value ? "border-ui-border-interactive bg-ui-bg-highlight" : "border-ui-border-base bg-ui-bg-base"}`}
              onClick={() => set("intent", value)}
            >
              <Text size="small" leading="compact" weight="plus">
                {label}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {example}
              </Text>
            </button>
          ))}
        </div>
      );
    if (step === 1)
      return (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <Field
              type="number"
              label="Models using this object"
              value={state.reuse_model_count}
              onChange={(value) => set("reuse_model_count", Number(value))}
            />
            <Field
              type="number"
              label="Parts / alternatives"
              value={state.component_count}
              onChange={(value) => set("component_count", Number(value))}
            />
            <label className="flex items-center gap-2">
              <Checkbox
                checked={state.affects_compatibility}
                onCheckedChange={(value) =>
                  set("affects_compatibility", value === true)
                }
              />
              <Text size="small" leading="compact">
                Affects compatibility
              </Text>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {["bays", "slots", "ports", "capability"].map((resource) => (
              <Button
                key={resource}
                size="small"
                variant={
                  state.adds_resources.includes(resource)
                    ? "primary"
                    : "secondary"
                }
                onClick={() =>
                  set(
                    "adds_resources",
                    state.adds_resources.includes(resource)
                      ? state.adds_resources.filter((item) => item !== resource)
                      : [...state.adds_resources, resource],
                  )
                }
              >
                {resource}
              </Button>
            ))}
          </div>
          <Button
            size="small"
            isLoading={previewMutation.isPending}
            onClick={() => previewMutation.mutate()}
          >
            Get recommendation
          </Button>
          {preview ? (
            <div className="rounded-md border border-ui-border-base p-4">
              <Text size="small" leading="compact" weight="plus">
                Recommended: {preview.recommendation.entity_type}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {preview.recommendation.reason}
              </Text>
              {preview.recommendation.warnings.map((warning) => (
                <Text key={warning} size="small" className="text-ui-fg-warning">
                  {warning}
                </Text>
              ))}
              <SelectField
                label="Confirmed entity"
                value={state.entity_type}
                options={[
                  "ComponentPack",
                  "ServerModelComponentAssignment",
                  "AssemblyBundle",
                  "StorageTopology",
                  "ComponentTypeDefinition",
                ]}
                onChange={(value) => set("entity_type", value)}
              />
            </div>
          ) : null}
        </div>
      );
    if (step === 2)
      return (
        <div className="flex flex-col gap-4">
          {modelsLoading ? (
            <Spinner />
          ) : (
            <SelectField
              label="Server model"
              value={state.server_model_id}
              options={["", ...(models?.models || []).map((model) => model.id)]}
              onChange={(value) => {
                set("server_model_id", value);
                set("scope_id", value);
              }}
              hint="Opening from a server pre-fills this context."
            />
          )}
          {preview?.server_context ? (
            <div className="grid gap-2 lg:grid-cols-3">
              {[
                [
                  "Vendor / generation",
                  `${preview.server_context.model.brand} ${preview.server_context.model.generation}`,
                ],
                [
                  "Chassis variants",
                  preview.server_context.chassis_variants.length,
                ],
                [
                  "Existing assignments",
                  preview.server_context.existing_assignments.length,
                ],
                [
                  "Storage topologies",
                  preview.server_context.storage_topologies.length,
                ],
                [
                  "Capability profiles",
                  preview.server_context.capability_profiles.length,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-md border border-ui-border-base p-3"
                >
                  <Text size="small" leading="compact" weight="plus">
                    {label}
                  </Text>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {String(value)}
                  </Text>
                </div>
              ))}
            </div>
          ) : (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Run recommendation after choosing a server to load inherited
              context.
            </Text>
          )}
        </div>
      );
    if (step === 3)
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          <SelectField
            label="Component type"
            value={state.component_type}
            options={[
              "cpu",
              "ram",
              "drive",
              "raid",
              "nic",
              "psu",
              "riser",
              "backplane",
              "drive_cage",
              "boot_storage",
              "accelerator",
              "rails",
              "cable",
              "cooling",
              "license",
              "service",
            ]}
            onChange={(value) => set("component_type", value)}
          />
          <SelectField
            label="Validator"
            value={state.validator_key}
            options={
              preview?.recommendation.available_validator_keys || [
                "cpu",
                "memory",
                "storage",
                "raid",
                "expansion",
                "network",
                "accelerator",
                "boot_storage",
                "power",
                "cooling",
              ]
            }
            onChange={(value) => set("validator_key", value)}
          />
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Unknown executable validators cannot be entered. A compatibility
            type without a registered validator remains draft.
          </Text>
        </div>
      );
    if (step === 4)
      return (
        <div className="grid gap-3 lg:grid-cols-3">
          <Field
            required
            label="Name"
            value={state.name}
            onChange={(value) => set("name", value)}
          />
          <Field
            required
            label="Stable slug / key"
            value={state.slug}
            onChange={(value) => set("slug", value)}
          />
          <Field
            label="Brand"
            value={state.brand}
            onChange={(value) => set("brand", value)}
          />
          <Field
            label="Model / technical name"
            value={state.model}
            onChange={(value) => set("model", value)}
          />
          <Field
            label="Part number"
            value={state.part_number}
            onChange={(value) => set("part_number", value)}
          />
          <Field
            label="Public name"
            value={state.public_name}
            onChange={(value) => set("public_name", value)}
          />
          <Field
            label="Short name"
            value={state.short_name}
            onChange={(value) => set("short_name", value)}
          />
          <Field
            label="Source reference"
            value={state.source_reference}
            onChange={(value) => set("source_reference", value)}
          />
          <SelectField
            label="Pack kind"
            value={state.pack_kind}
            options={["candidate_pool", "assembly_bundle", "platform_template"]}
            onChange={(value) => set("pack_kind", value)}
          />
        </div>
      );
    if (step === 5)
      return state.entity_type === "StorageTopology" ? (
        <div className="flex flex-col gap-3">
          <SelectField
            label="Location"
            value={state.storage_location}
            options={["front", "rear", "internal", "mid"]}
            onChange={(value) => set("storage_location", value)}
          />
          {state.bay_groups.map((group, index) => (
            <div
              key={`${group.key}-${index}`}
              className="grid gap-2 rounded-md border border-ui-border-base p-3 lg:grid-cols-4"
            >
              <Field
                label="Group key"
                value={group.key}
                onChange={(value) => updateBayGroup(index, { key: value })}
              />
              <Field
                type="number"
                label="Bay count"
                value={group.count}
                onChange={(value) =>
                  updateBayGroup(index, { count: Number(value) })
                }
              />
              <SelectField
                label="Native form factor"
                value={group.native_form_factor}
                options={["2.5", "3.5", "M.2"]}
                onChange={(value) =>
                  updateBayGroup(index, { native_form_factor: value })
                }
              />
              <Field
                label="Accepted smaller forms"
                value={group.accepted_form_factors.join(", ")}
                onChange={(value) =>
                  updateBayGroup(index, {
                    accepted_form_factors: value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
              <Field
                label="Adapter component ID"
                value={group.adapter_component_id}
                onChange={(value) =>
                  updateBayGroup(index, { adapter_component_id: value })
                }
              />
              <Field
                label="Zone ID"
                value={group.zone_id}
                onChange={(value) => updateBayGroup(index, { zone_id: value })}
              />
              <Field
                label="Protocols"
                value={group.protocols.join(", ")}
                onChange={(value) =>
                  updateBayGroup(index, {
                    protocols: value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
              <Button
                size="small"
                variant="secondary"
                onClick={() =>
                  set(
                    "bay_groups",
                    state.bay_groups.filter(
                      (_, groupIndex) => groupIndex !== index,
                    ),
                  )
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button size="small" variant="secondary" onClick={addBayGroup}>
            Add bay group
          </Button>
        </div>
      ) : (
        <DataTable instance={table}>
          <DataTable.Toolbar>
            <DataTable.Search placeholder="Search existing components..." />
          </DataTable.Toolbar>
          <DataTable.Table />
          <DataTable.Pagination />
        </DataTable>
      );
    if (step === 6)
      return (
        <KeyValueBuilder
          label="Compatibility fields"
          description="Normalized key, value and mapping behavior; no arbitrary executable expression."
          value={state.mappings}
          behaviors={[
            "informational",
            "filterable",
            "engine_mapped",
            "unmapped",
          ]}
          onChange={(value) => set("mappings", value)}
        />
      );
    if (step === 7)
      return (
        <div className="flex flex-col gap-3">
          <KeyValueBuilder
            label="Requires"
            description="Required slots, protocols, capabilities, components or bundles."
            value={state.requires}
            onChange={(value) => set("requires", value)}
          />
          <KeyValueBuilder
            label="Provides"
            description="Slots, bays, ports or capabilities made available."
            value={state.provides}
            onChange={(value) => set("provides", value)}
          />
          <KeyValueBuilder
            label="Consumes"
            description="Slots, lanes, watts, bays or ports consumed."
            value={state.consumes}
            onChange={(value) => set("consumes", value)}
          />
          <KeyValueBuilder
            label="Conflicts"
            description="Component, topology, slot or resource conflicts."
            value={state.conflicts}
            onChange={(value) => set("conflicts", value)}
          />
          <ResourceSummary state={state} />
        </div>
      );
    if (step === 8)
      return (
        <div className="grid gap-3 lg:grid-cols-3">
          <SelectField
            label="Selection mode"
            value={state.selection_mode}
            options={[
              "visible",
              "advanced_only",
              "hidden_technical",
              "informational",
            ]}
            onChange={(value) => set("selection_mode", value)}
          />
          <SelectField
            label="Assignment role"
            value={state.assignment_role}
            options={[
              "optional_choice",
              "required_component",
              "default_component",
              "auto_added_technical",
              "enablement_kit",
              "replacement_option",
            ]}
            onChange={(value) => set("assignment_role", value)}
          />
          <Field
            type="number"
            label="Storefront order"
            value={state.sort_order}
            onChange={(value) => set("sort_order", Number(value))}
          />
          {state.selection_mode === "hidden_technical" ? (
            <Text size="small" className="text-ui-fg-warning">
              Hidden technical components remain visible in Admin trace and
              configuration snapshots.
            </Text>
          ) : null}
        </div>
      );
    if (step === 9)
      return (
        <div className="grid gap-3 lg:grid-cols-3">
          <SelectField
            label="Scope type"
            value={state.scope_type}
            options={[
              "technology_platform",
              "vendor_generation",
              "server_family",
              "server_model",
              "chassis_variant",
              "storage_option",
            ]}
            onChange={(value) => set("scope_type", value)}
          />
          <Field
            label="Scope ID"
            value={state.scope_id}
            onChange={(value) => set("scope_id", value)}
          />
          <Field
            type="number"
            label="Default quantity"
            value={state.default_quantity}
            onChange={(value) => set("default_quantity", Number(value))}
          />
          <Field
            type="number"
            label="Min quantity"
            value={state.min_quantity}
            onChange={(value) => set("min_quantity", Number(value))}
          />
          <Field
            type="number"
            label="Max quantity"
            value={state.max_quantity}
            onChange={(value) => set("max_quantity", Number(value))}
          />
          <Field
            label="Return route"
            value={state.return_to}
            onChange={(value) => set("return_to", value)}
          />
        </div>
      );
    if (step === 10)
      return (
        <div className="flex flex-col gap-3">
          <Button
            size="small"
            isLoading={previewMutation.isPending}
            onClick={() => previewMutation.mutate()}
          >
            Run schema, duplicate, engine and readiness preview
          </Button>
          {preview ? (
            <>
              <div className="flex items-center gap-2">
                <Badge color={validationTone(preview.validation)}>
                  {preview.validation?.status || "partial"}
                </Badge>
                <Text size="small" leading="compact">
                  No writes performed: {String(preview.writes_performed)}
                </Text>
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                {(preview.validation?.blockers || []).map((item: any) => (
                  <Text
                    key={item.code}
                    size="small"
                    className="text-ui-fg-error"
                  >
                    {item.code}
                  </Text>
                ))}
                {(preview.validation?.recommendations || []).map(
                  (item: any, index: number) => (
                    <Text
                      key={`${item.action}-${index}`}
                      size="small"
                      className="text-ui-fg-warning"
                    >
                      Repair choice: {item.action}
                    </Text>
                  ),
                )}
              </div>
              <Text size="small" leading="compact" weight="plus">
                Affected candidates: {preview.validation?.candidate_count || 0}
              </Text>
            </>
          ) : (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Run preview before save.
            </Text>
          )}
        </div>
      );
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-2 lg:grid-cols-2">
          {[
            ["Confirmed entity", state.entity_type],
            ["Name", state.name],
            [
              "Server / scope",
              state.server_model_id || state.scope_id || "unassigned",
            ],
            ["Selected components", state.selected_component_ids.length],
            ["Draft", draftId || "autosave pending"],
            ["Return to", state.return_to],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-md border border-ui-border-base p-3"
            >
              <Text size="small" leading="compact" weight="plus">
                {label}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {String(value)}
              </Text>
            </div>
          ))}
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Apply creates only the confirmed entities, assignment and audit event.
          A partial failure invokes compensation and leaves no hidden orphan.
        </Text>
        <Button
          size="small"
          isLoading={apply.isPending}
          disabled={!canApply}
          onClick={() => apply.mutate()}
        >
          Confirm, create and return
        </Button>
      </div>
    );
  })();

  const resume = (draft: any) => {
    setDraftId(draft.id);
    setState({ ...initialState, ...(draft.draft_payload_json || {}) });
    setStep(Math.max(0, Number(draft.current_step || 1) - 1));
    setPreview(null);
    setDirty(false);
    setOpen(true);
  };
  const start = () => {
    setDraftId(undefined);
    setState({
      ...initialState,
      server_model_id: params.get("server_model_id") || "",
      scope_id: params.get("server_model_id") || "",
      return_to: params.get("return_to") || initialState.return_to,
    });
    setStep(0);
    setPreview(null);
    setDirty(false);
    setRowSelection({});
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <Heading>Smart Component & Pack Builder</Heading>
          <Text className="text-ui-fg-subtle">
            Guided entity recommendation, typed resources, live engine
            validation and compensated Create-and-Return.
          </Text>
        </div>
        <Button size="small" onClick={start}>
          Start builder
        </Button>
      </div>
      <Container className="flex flex-col gap-2">
        <Text size="small" leading="compact" weight="plus">
          Saved drafts
        </Text>
        {draftsLoading ? (
          <Spinner />
        ) : draftsError ? (
          <Text size="small" className="text-ui-fg-error">
            Unable to load drafts.
          </Text>
        ) : (drafts?.drafts || []).length === 0 ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No drafts. Start a builder to create one.
          </Text>
        ) : (
          drafts?.drafts.map((draft) => (
            <button
              type="button"
              key={draft.id}
              onClick={() => resume(draft)}
              className="flex items-center justify-between rounded-md border border-ui-border-base px-4 py-3 text-left hover:bg-ui-bg-component-hover"
            >
              <div>
                <Text size="small" leading="compact" weight="plus">
                  {draft.draft_payload_json?.name ||
                    draft.draft_payload_json?.intent ||
                    "Smart Builder draft"}
                </Text>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  Step {draft.current_step} · {draft.status}
                </Text>
              </div>
              <Badge color={draft.status === "ready" ? "green" : "orange"}>
                {draft.status}
              </Badge>
            </button>
          ))
        )}
      </Container>
      <FocusModal
        open={open}
        onOpenChange={(next) => {
          if (
            !next &&
            dirty &&
            !window.confirm("This draft has unsaved changes. Close anyway?")
          )
            return;
          setOpen(next);
        }}
      >
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <FocusModal.Title>Smart Component &amp; Pack Builder</FocusModal.Title>
              <div className="flex w-full items-center justify-between">
                <Text size="small" leading="compact" weight="plus">
                  Step {step + 1} of {steps.length}: {steps[step]}
                </Text>
                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={step === 0 || apply.isPending}
                    onClick={() => setStep((value) => Math.max(0, value - 1))}
                  >
                    Back
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    isLoading={autosave.isPending}
                    onClick={() => autosave.mutate()}
                  >
                    Save draft
                  </Button>
                  {step < steps.length - 1 ? (
                    <Button
                      size="small"
                      onClick={() =>
                        setStep((value) =>
                          Math.min(steps.length - 1, value + 1),
                        )
                      }
                    >
                      Next
                    </Button>
                  ) : null}
                </div>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
                <ProgressTabs value={String(step)}>
                  <ProgressTabs.List>
                    {steps.map((label, index) => (
                      <ProgressTabs.Trigger
                        key={label}
                        value={String(index)}
                        status={
                          index < step
                            ? "completed"
                            : index === step
                              ? "in-progress"
                              : "not-started"
                        }
                      >
                        {index + 1}
                      </ProgressTabs.Trigger>
                    ))}
                  </ProgressTabs.List>
                </ProgressTabs>
                {content}
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Smart Builder",
  icon: Sparkles,
});
export default SmartBuilderPage;
