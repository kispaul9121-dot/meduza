import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ServerStack } from "@medusajs/icons";
import {
  Badge,
  Button,
  Checkbox,
  Container,
  FocusModal,
  Heading,
  ProgressTabs,
  Select,
  Text,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { adminGet, adminPost, splitList } from "../_shared/api";
import { Field, SelectField } from "../_shared/form";

const steps = [
  "Creation method",
  "Identification",
  "Platform & generation",
  "CPU capability",
  "Memory capability",
  "Chassis & storage",
  "Expansion topology",
  "Power & cooling",
  "Network, management & boot",
  "Optional groups",
  "Product strategy",
  "Properties & coverage",
  "Simulation",
  "Draft, review & publish",
];

const initialDraft: Record<string, any> = {
  schema_version: 1,
  creation_method: "scratch",
  identity: {
    vendor: "",
    family: "",
    generation: "",
    model: "",
    public_name: "",
    slug: "",
    form_factor: "",
    chassis_type: "",
    source_document: "",
  },
  platform: {
    technology_platform_id: "",
    vendor_generation_template_id: "",
    server_family_id: "",
    inherited_pack_ids: [],
    exclusions: [],
    overrides: {},
  },
  cpu: {
    socket_concept_id: "",
    socket_quantity: 1,
    ownership: "per_socket",
    tdp_limit_w: null,
    cooling_limit: "",
    qualification_policy: "source-qualified",
    suggested_pack_ids: [],
  },
  memory: {
    technology_concept_id: "",
    module_types: [],
    slots_per_cpu: 1,
    channels_per_cpu: 0,
    max_capacity_gb: null,
    population_profiles: [],
    speed_limit_mhz: null,
    suggested_pack_ids: [],
  },
  storage: {
    chassis_variants: [
      {
        key: "base",
        name: "Base chassis",
        front_bays: 0,
        rear_bays: 0,
        drive_form_factor: "",
        backplane_reference: "",
        properties: {},
      },
    ],
    storage_option_ids: [],
    protocols: [],
    controller_component_ids: [],
    suggested_drive_pack_ids: [],
  },
  expansion: { risers: [], slots: [], ocp_slots: [], conflicts: [] },
  power: {
    psu_pack_ids: [],
    max_watts: null,
    psu_summary: "",
    cooling_mode: "unknown",
    fan_pack_ids: [],
    heatsink_pack_ids: [],
    thermal_zones: [],
    conditions: [],
  },
  network: {
    embedded_component_ids: [],
    nic_pack_ids: [],
    management_concept_id: "",
    boot_group_ids: [],
    direct_component_ids: [],
    bundle_ids: [],
  },
  optional_groups: { option_group_ids: [] },
  product_strategy: "single_card_chassis_options",
  properties: { assignments: [] },
  simulation: {
    representative_components: [],
    explicit_none: [],
    storage_option_ids: [],
  },
  review: { reviewer: "", notes: "", publication_confirmed: false },
  return_to: "/server-configurator/server-wizard",
};

function RefSelect({
  label,
  value,
  rows,
  onChange,
  placeholder = "Select canonical entity",
}: {
  label: string;
  value: string;
  rows: any[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Text size="small" leading="compact" weight="plus">
        {label}
      </Text>
      <Select value={value || undefined} onValueChange={onChange}>
        <Select.Trigger>
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>
        <Select.Content>
          {rows.map((row) => (
            <Select.Item key={row.id} value={row.id}>
              {row.name ||
                row.display_name ||
                row.public_name ||
                row.title ||
                row.key ||
                row.id}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}

function ChoiceGrid({
  value,
  rows,
  onChange,
  label,
}: {
  value: string[];
  rows: any[];
  onChange: (value: string[]) => void;
  label: (row: any) => string;
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {rows.map((row) => (
        <label
          key={row.id}
          className="flex items-start gap-2 rounded-md border border-ui-border-base p-3"
        >
          <Checkbox
            checked={value.includes(row.id)}
            onCheckedChange={(checked) =>
              onChange(
                checked === true
                  ? [...new Set([...value, row.id])]
                  : value.filter((id) => id !== row.id),
              )
            }
          />
          <div>
            <Text size="small" leading="compact" weight="plus">
              {label(row)}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {row.id}
            </Text>
          </div>
        </label>
      ))}
    </div>
  );
}

function StatusPanel({ preview }: { preview: any }) {
  if (!preview)
    return (
      <Text size="small" className="text-ui-fg-subtle">
        Run preview to calculate inheritance, coverage and engine readiness.
      </Text>
    );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Badge
          color={
            preview.coverage.ready_for_materialization ? "green" : "orange"
          }
        >
          materialize{" "}
          {preview.coverage.ready_for_materialization ? "ready" : "blocked"}
        </Badge>
        <Badge color={preview.coverage.ready_for_review ? "green" : "orange"}>
          review {preview.coverage.ready_for_review ? "ready" : "blocked"}
        </Badge>
        <Badge color="blue">
          preview writes: {String(preview.writes_performed)}
        </Badge>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {preview.coverage.blockers.map((item: any) => (
          <Text
            key={`${item.step}-${item.field}`}
            size="small"
            className="text-ui-fg-error"
          >
            Step {item.step}: {item.message}
          </Text>
        ))}
      </div>
      {preview.simulation ? (
        preview.simulation.map((result: any, index: number) => (
          <div
            key={index}
            className="rounded-md border border-ui-border-base p-3"
          >
            <Badge color={result.ready ? "green" : "orange"}>
              {result.status}
            </Badge>
            <Text size="small" className="text-ui-fg-subtle">
              {result.blockers?.length || 0} blockers ·{" "}
              {result.warnings?.length || 0} warnings ·{" "}
              {result.candidate_count || 0} candidates
            </Text>
          </div>
        ))
      ) : (
        <Text size="small" className="text-ui-fg-subtle">
          Materialize the disabled technical draft before representative engine
          simulation.
        </Text>
      )}
    </div>
  );
}

const ServerWizardPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Record<string, any>>(initialDraft);
  const [sessionId, setSessionId] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const {
    data: context,
    isLoading: contextLoading,
    isError: contextError,
  } = useQuery({
    queryKey: ["core-wizard-context"],
    queryFn: () =>
      adminGet<any>("/admin/server-configurator/core-wizard/context"),
  });
  const { data: drafts, isLoading: draftsLoading } = useQuery({
    queryKey: ["core-wizard-drafts"],
    queryFn: () =>
      adminGet<any>("/admin/server-configurator/core-wizard/drafts"),
  });
  const preview = useMutation({
    mutationFn: () =>
      adminPost<any>("/admin/server-configurator/core-wizard/preview", {
        draft,
      }),
    onError: (error: Error) => toast.error(error.message),
  });
  const saveDraft = useMutation({
    mutationFn: () =>
      adminPost<any>("/admin/server-configurator/core-wizard/drafts", {
        id: sessionId,
        current_step: step + 1,
        draft,
        status: preview.data?.coverage.ready_for_review ? "ready" : "draft",
      }),
    onSuccess: (result) => {
      setSessionId(result.entity.id);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["core-wizard-drafts"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const result = await adminPost<any>(
      "/admin/server-configurator/core-wizard/drafts",
      { current_step: step + 1, draft, status: "draft" },
    );
    setSessionId(result.entity.id);
    return result.entity.id as string;
  };
  const materialize = useMutation({
    mutationFn: async () =>
      adminPost<any>("/admin/server-configurator/core-wizard/materialize", {
        session_id: await ensureSession(),
        draft,
      }),
    onSuccess: (result) => {
      setDraft(result.draft);
      setDirty(false);
      preview.mutate();
      queryClient.invalidateQueries({ queryKey: ["core-wizard-drafts"] });
      toast.success("Disabled technical server draft materialized");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const publish = useMutation({
    mutationFn: async () =>
      adminPost<any>("/admin/server-configurator/core-wizard/publish", {
        session_id: await ensureSession(),
        server_model_id: draft.materialized_server_model_id,
        draft,
        confirmation: "PUBLISH_VALIDATED_SERVER",
      }),
    onSuccess: (result) => {
      toast.success("Validated server and Medusa product published");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["core-wizard-drafts"] });
      window.location.assign(
        `/app${result.storefront_path ? "/server-configurator/models" : "/server-configurator/server-wizard"}`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = (section: string, key: string, value: unknown) => {
    setDraft((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }));
    setDirty(true);
  };
  const setRoot = (key: string, value: unknown) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };
  useEffect(() => {
    if (!open || !dirty) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => saveDraft.mutate(), 900);
    return () => clearTimeout(timer.current);
  }, [draft, step, open, dirty]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const conceptTypeById = useMemo(
    () =>
      new Map(
        (context?.concept_types || []).map((item: any) => [item.id, item.key]),
      ),
    [context],
  );
  const socketConcepts = (context?.concepts || []).filter((item: any) =>
    String(conceptTypeById.get(item.concept_type_id) || "").includes("socket"),
  );
  const memoryConcepts = (context?.concepts || []).filter((item: any) =>
    /memory|ram|dimm/i.test(
      String(conceptTypeById.get(item.concept_type_id) || "") +
        item.display_name,
    ),
  );
  const managementConcepts = (context?.concepts || []).filter((item: any) =>
    /management|idrac|ilo|bmc/i.test(
      String(conceptTypeById.get(item.concept_type_id) || "") +
        item.display_name,
    ),
  );
  const packsByType = (type: string) =>
    (context?.packs || []).filter((item: any) => item.component_type === type);
  const componentsByType = (types: string[]) =>
    (context?.components || []).filter((item: any) =>
      types.includes(item.type),
    );

  const applyGeneration = (id: string) => {
    const generation = (context?.generations || []).find(
      (item: any) => item.id === id,
    );
    set("platform", "vendor_generation_template_id", id);
    if (generation)
      setDraft((current) => ({
        ...current,
        identity: {
          ...current.identity,
          vendor: generation.vendor,
          generation: generation.generation_label,
        },
        platform: {
          ...current.platform,
          vendor_generation_template_id: id,
          technology_platform_id: generation.technology_platform_id,
        },
      }));
  };
  const applyClone = (id: string) => {
    const model = (context?.models || []).find((item: any) => item.id === id);
    if (!model) return;
    setDraft((current) => ({
      ...current,
      source_server_model_id: id,
      identity: {
        ...current.identity,
        vendor: model.brand,
        family: model.family,
        generation: model.generation,
        model: model.model,
        public_name: `${model.public_name} draft`,
        slug: `${model.slug}-draft`,
        form_factor: model.form_factor,
        chassis_type: model.chassis_type,
        source_document: model.source_doc_reference,
      },
      platform: {
        ...current.platform,
        technology_platform_id: model.technology_platform_id || "",
        vendor_generation_template_id:
          model.vendor_generation_template_id || "",
        server_family_id: model.server_family_id || "",
      },
      cpu: { ...current.cpu, socket_quantity: model.max_cpu },
      memory: { ...current.memory, slots_per_cpu: model.ram_slots_per_cpu },
      storage: {
        ...current.storage,
        chassis_variants: [
          {
            key: "base",
            name: model.chassis_type,
            front_bays: model.drive_bays_front,
            rear_bays: model.drive_bays_rear,
            drive_form_factor: model.drive_form_factor,
            backplane_reference: model.backplane_type,
            properties: {},
          },
        ],
      },
      creation_method: "clone_model",
    }));
    setDirty(true);
  };

  const addChassis = () =>
    set("storage", "chassis_variants", [
      ...draft.storage.chassis_variants,
      {
        key: `variant-${draft.storage.chassis_variants.length + 1}`,
        name: "",
        front_bays: 0,
        rear_bays: 0,
        drive_form_factor: "",
        backplane_reference: "",
        properties: {},
      },
    ]);
  const updateChassis = (index: number, key: string, value: unknown) =>
    set(
      "storage",
      "chassis_variants",
      draft.storage.chassis_variants.map((item: any, itemIndex: number) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  const addSlot = () =>
    set("expansion", "slots", [
      ...draft.expansion.slots,
      {
        key: `slot-${draft.expansion.slots.length + 1}`,
        generation: "",
        lanes: 0,
        height: "",
        length: "",
        width: 1,
        cpu_owner: "shared",
        slot_type: "PCIe",
      },
    ]);
  const updateSlot = (index: number, key: string, value: unknown) =>
    set(
      "expansion",
      "slots",
      draft.expansion.slots.map((item: any, itemIndex: number) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );

  const renderStep = () => {
    if (contextLoading)
      return <Text size="small">Loading canonical wizard context…</Text>;
    if (contextError)
      return (
        <Text size="small" className="text-ui-fg-error">
          Unable to load canonical context. No local fallback is available.
        </Text>
      );
    if (step === 0)
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            ["scratch", "Start from scratch"],
            ["generation_template", "VendorGenerationTemplate"],
            ["clone_model", "Clone similar model"],
            ["documentation", "Documentation-assisted entry"],
            ["continue_draft", "Continue saved draft"],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={`rounded-md border p-4 text-left ${draft.creation_method === key ? "border-ui-border-interactive bg-ui-bg-interactive" : "border-ui-border-base"}`}
              onClick={() => setRoot("creation_method", key)}
            >
              <Text size="small" weight="plus">
                {label}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                Controlled core flow; no automated dependency planner.
              </Text>
            </button>
          ))}
          {draft.creation_method === "clone_model" ? (
            <RefSelect
              label="Similar server"
              value={draft.source_server_model_id || ""}
              rows={context.models || []}
              onChange={applyClone}
            />
          ) : null}
        </div>
      );
    if (step === 1)
      return (
        <div className="grid gap-3 lg:grid-cols-3">
          {[
            "vendor",
            "family",
            "generation",
            "model",
            "public_name",
            "slug",
            "form_factor",
            "chassis_type",
            "source_document",
          ].map((field) => (
            <Field
              key={field}
              required
              label={field.replaceAll("_", " ")}
              value={draft.identity[field] || ""}
              onChange={(value) => set("identity", field, value)}
            />
          ))}
        </div>
      );
    if (step === 2)
      return (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <RefSelect
              label="Technology Platform"
              value={draft.platform.technology_platform_id}
              rows={context.platforms || []}
              onChange={(value) =>
                set("platform", "technology_platform_id", value)
              }
            />
            <RefSelect
              label="Vendor Generation Template"
              value={draft.platform.vendor_generation_template_id}
              rows={context.generations || []}
              onChange={applyGeneration}
            />
            <RefSelect
              label="Server Family"
              value={draft.platform.server_family_id}
              rows={context.families || []}
              onChange={(value) => set("platform", "server_family_id", value)}
            />
          </div>
          <Field
            label="Explicit inherited exclusions"
            value={draft.platform.exclusions.join(", ")}
            onChange={(value) =>
              set("platform", "exclusions", splitList(value))
            }
          />
          <Button
            size="small"
            variant="secondary"
            isLoading={preview.isPending}
            onClick={() => preview.mutate()}
          >
            Show inheritance before overrides
          </Button>
          {preview.data ? (
            <div className="grid gap-2 lg:grid-cols-3">
              <Container>
                <Text size="small" weight="plus">
                  Platform properties
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {
                    Object.keys(preview.data.inheritance.platform_properties)
                      .length
                  }
                </Text>
              </Container>
              <Container>
                <Text size="small" weight="plus">
                  Generation properties
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {
                    Object.keys(preview.data.inheritance.generation_properties)
                      .length
                  }
                </Text>
              </Container>
              <Container>
                <Text size="small" weight="plus">
                  Inherited pack assignments
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {preview.data.inheritance.inherited_pack_assignments.length}
                </Text>
              </Container>
            </div>
          ) : null}
        </div>
      );
    if (step === 3)
      return (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <RefSelect
              label="Socket concept (no free text)"
              value={draft.cpu.socket_concept_id}
              rows={socketConcepts}
              onChange={(value) => set("cpu", "socket_concept_id", value)}
            />
            <Field
              type="number"
              label="Socket quantity"
              value={draft.cpu.socket_quantity}
              onChange={(value) => set("cpu", "socket_quantity", Number(value))}
            />
            <SelectField
              label="CPU ownership"
              value={draft.cpu.ownership}
              options={["shared", "per_socket", "numa"]}
              onChange={(value) => set("cpu", "ownership", value)}
            />
            <Field
              type="number"
              label="TDP limit W"
              value={draft.cpu.tdp_limit_w || ""}
              onChange={(value) =>
                set("cpu", "tdp_limit_w", value ? Number(value) : null)
              }
            />
            <Field
              label="Cooling limit / source note"
              value={draft.cpu.cooling_limit}
              onChange={(value) => set("cpu", "cooling_limit", value)}
            />
            <Field
              label="Qualification policy"
              value={draft.cpu.qualification_policy}
              onChange={(value) => set("cpu", "qualification_policy", value)}
            />
          </div>
          <ChoiceGrid
            value={draft.cpu.suggested_pack_ids}
            rows={packsByType("cpu")}
            onChange={(value) => set("cpu", "suggested_pack_ids", value)}
            label={(row) => row.name}
          />
        </div>
      );
    if (step === 4)
      return (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <RefSelect
              label="Memory technology concept"
              value={draft.memory.technology_concept_id}
              rows={memoryConcepts}
              onChange={(value) =>
                set("memory", "technology_concept_id", value)
              }
            />
            <Field
              label="Module types"
              value={draft.memory.module_types.join(", ")}
              onChange={(value) =>
                set("memory", "module_types", splitList(value))
              }
            />
            <Field
              type="number"
              label="Slots per CPU"
              value={draft.memory.slots_per_cpu}
              onChange={(value) =>
                set("memory", "slots_per_cpu", Number(value))
              }
            />
            <Field
              type="number"
              label="Channels per CPU"
              value={draft.memory.channels_per_cpu}
              onChange={(value) =>
                set("memory", "channels_per_cpu", Number(value))
              }
            />
            <Field
              type="number"
              label="Max capacity GB"
              value={draft.memory.max_capacity_gb || ""}
              onChange={(value) =>
                set("memory", "max_capacity_gb", value ? Number(value) : null)
              }
            />
            <Field
              type="number"
              label="Server speed limit MHz"
              value={draft.memory.speed_limit_mhz || ""}
              onChange={(value) =>
                set("memory", "speed_limit_mhz", value ? Number(value) : null)
              }
            />
          </div>
          <ChoiceGrid
            value={draft.memory.suggested_pack_ids}
            rows={packsByType("ram")}
            onChange={(value) => set("memory", "suggested_pack_ids", value)}
            label={(row) => row.name}
          />
        </div>
      );
    if (step === 5)
      return (
        <div className="flex flex-col gap-4">
          {draft.storage.chassis_variants.map((item: any, index: number) => (
            <Container key={index} className="grid gap-3 lg:grid-cols-4">
              <Field
                label="Variant key"
                value={item.key}
                onChange={(value) => updateChassis(index, "key", value)}
              />
              <Field
                label="Name"
                value={item.name}
                onChange={(value) => updateChassis(index, "name", value)}
              />
              <Field
                type="number"
                label="Front bays"
                value={item.front_bays}
                onChange={(value) =>
                  updateChassis(index, "front_bays", Number(value))
                }
              />
              <Field
                type="number"
                label="Rear bays"
                value={item.rear_bays}
                onChange={(value) =>
                  updateChassis(index, "rear_bays", Number(value))
                }
              />
              <Field
                label="Drive form factor"
                value={item.drive_form_factor}
                onChange={(value) =>
                  updateChassis(index, "drive_form_factor", value)
                }
              />
              <Field
                label="Backplane source reference"
                value={item.backplane_reference}
                onChange={(value) =>
                  updateChassis(index, "backplane_reference", value)
                }
              />
            </Container>
          ))}
          <div className="flex gap-2">
            <Button size="small" variant="secondary" onClick={addChassis}>
              Add chassis variant
            </Button>
            {draft.materialized_server_model_id ? (
              <Link
                to={`/server-configurator/smart-builder?server_model_id=${draft.materialized_server_model_id}&intent=storage_configuration&return_to=${encodeURIComponent("/server-configurator/server-wizard")}`}
              >
                <Button size="small">Open Smart Storage Cage Builder</Button>
              </Link>
            ) : (
              <Text size="small" className="text-ui-fg-subtle">
                Materialize the disabled technical draft to open the stage-05
                Storage Builder with a real model ID.
              </Text>
            )}
          </div>
          <Field
            label="Supported protocols"
            value={draft.storage.protocols.join(", ")}
            onChange={(value) => set("storage", "protocols", splitList(value))}
          />
          <ChoiceGrid
            value={draft.storage.controller_component_ids}
            rows={componentsByType(["raid", "backplane"])}
            onChange={(value) =>
              set("storage", "controller_component_ids", value)
            }
            label={(row) => row.public_name}
          />
        </div>
      );
    if (step === 6)
      return (
        <div className="flex flex-col gap-4">
          {draft.expansion.slots.map((item: any, index: number) => (
            <Container key={index} className="grid gap-3 lg:grid-cols-4">
              <Field
                label="Slot key"
                value={item.key}
                onChange={(value) => updateSlot(index, "key", value)}
              />
              <Field
                label="Type"
                value={item.slot_type}
                onChange={(value) => updateSlot(index, "slot_type", value)}
              />
              <Field
                label="PCIe generation"
                value={item.generation}
                onChange={(value) => updateSlot(index, "generation", value)}
              />
              <Field
                type="number"
                label="Lanes"
                value={item.lanes}
                onChange={(value) => updateSlot(index, "lanes", Number(value))}
              />
              <Field
                label="Height"
                value={item.height}
                onChange={(value) => updateSlot(index, "height", value)}
              />
              <Field
                label="Length"
                value={item.length}
                onChange={(value) => updateSlot(index, "length", value)}
              />
              <Field
                type="number"
                label="Width"
                value={item.width}
                onChange={(value) => updateSlot(index, "width", Number(value))}
              />
              <SelectField
                label="CPU owner"
                value={item.cpu_owner}
                options={["shared", "cpu-1", "cpu-2"]}
                onChange={(value) => updateSlot(index, "cpu_owner", value)}
              />
            </Container>
          ))}
          <Button size="small" variant="secondary" onClick={addSlot}>
            Add physical/OCP/mezzanine slot
          </Button>
        </div>
      );
    if (step === 7)
      return (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <Field
              type="number"
              label="Power budget W (unknown allowed)"
              value={draft.power.max_watts || ""}
              onChange={(value) =>
                set("power", "max_watts", value ? Number(value) : null)
              }
            />
            <Field
              label="PSU source summary"
              value={draft.power.psu_summary}
              onChange={(value) => set("power", "psu_summary", value)}
            />
            <SelectField
              label="Cooling mode"
              value={draft.power.cooling_mode}
              options={["air", "performance_air", "liquid", "unknown"]}
              onChange={(value) => set("power", "cooling_mode", value)}
            />
          </div>
          <Text size="small" weight="plus">
            PSU packs
          </Text>
          <ChoiceGrid
            value={draft.power.psu_pack_ids}
            rows={packsByType("psu")}
            onChange={(value) => set("power", "psu_pack_ids", value)}
            label={(row) => row.name}
          />
          <Text size="small" weight="plus">
            Fan/heatsink kits
          </Text>
          <ChoiceGrid
            value={[
              ...draft.power.fan_pack_ids,
              ...draft.power.heatsink_pack_ids,
            ]}
            rows={packsByType("cooling")}
            onChange={(value) => set("power", "fan_pack_ids", value)}
            label={(row) => row.name}
          />
        </div>
      );
    if (step === 8)
      return (
        <div className="flex flex-col gap-4">
          <RefSelect
            label="Management generation concept"
            value={draft.network.management_concept_id}
            rows={managementConcepts}
            onChange={(value) => set("network", "management_concept_id", value)}
          />
          <Text size="small" weight="plus">
            Embedded/direct network and boot parts
          </Text>
          <ChoiceGrid
            value={draft.network.direct_component_ids}
            rows={componentsByType(["nic", "boot_storage", "service"])}
            onChange={(value) => set("network", "direct_component_ids", value)}
            label={(row) => row.public_name}
          />
          <Text size="small" weight="plus">
            NIC packs
          </Text>
          <ChoiceGrid
            value={draft.network.nic_pack_ids}
            rows={packsByType("nic")}
            onChange={(value) => set("network", "nic_pack_ids", value)}
            label={(row) => row.name}
          />
          {draft.materialized_server_model_id ? (
            <Link
              to={`/server-configurator/models/${draft.materialized_server_model_id}/direct-components`}
            >
              <Button size="small" variant="secondary">
                Manage direct components and bundles
              </Button>
            </Link>
          ) : null}
        </div>
      );
    if (step === 9)
      return (
        <div className="flex flex-col gap-4">
          <ChoiceGrid
            value={draft.optional_groups.option_group_ids}
            rows={context.option_groups || []}
            onChange={(value) =>
              set("optional_groups", "option_group_ids", value)
            }
            label={(row) => `${row.title} · ${row.component_type}`}
          />
          <Link to="/server-configurator/option-groups">
            <Button size="small" variant="secondary">
              Create Option Group and return
            </Button>
          </Link>
          <Text size="small" className="text-ui-fg-subtle">
            None remains a group state. The wizard never creates a fake
            component or SKU.
          </Text>
        </div>
      );
    if (step === 10)
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            [
              "single_card_chassis_options",
              "One catalog card with chassis variants",
            ],
            ["separate_catalog_cards", "Separate catalog cards"],
            ["separate_products", "Separate Medusa products"],
            ["shared_technical_platform", "Shared technical ServerPlatform"],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => setRoot("product_strategy", key)}
              className={`rounded-md border p-4 text-left ${draft.product_strategy === key ? "border-ui-border-interactive bg-ui-bg-interactive" : "border-ui-border-base"}`}
            >
              <Text size="small" weight="plus">
                {label}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                Products and variants are created transactionally; no
                prod_/variant_ ID copy is required.
              </Text>
            </button>
          ))}
        </div>
      );
    if (step === 11)
      return (
        <div className="flex flex-col gap-4">
          <Button
            size="small"
            variant="secondary"
            isLoading={preview.isPending}
            onClick={() => preview.mutate()}
          >
            Refresh inherited/direct/override/unmapped coverage
          </Button>
          <StatusPanel preview={preview.data} />
          <Link to="/server-configurator/knowledge-base">
            <Button size="small" variant="secondary">
              Open Property Wizard and return
            </Button>
          </Link>
          <div className="grid gap-2 lg:grid-cols-3">
            {(context.properties || []).slice(0, 30).map((property: any) => {
              const assignment = draft.properties.assignments.find(
                (item: any) => item.property_definition_id === property.id,
              );
              return (
                <label
                  key={property.id}
                  className="flex gap-2 rounded-md border border-ui-border-base p-3"
                >
                  <Checkbox
                    checked={Boolean(assignment)}
                    onCheckedChange={(checked) =>
                      set(
                        "properties",
                        "assignments",
                        checked === true
                          ? [
                              ...draft.properties.assignments,
                              {
                                property_definition_id: property.id,
                                mode: "direct",
                                value: property.default_value_json ?? null,
                              },
                            ]
                          : draft.properties.assignments.filter(
                              (item: any) =>
                                item.property_definition_id !== property.id,
                            ),
                      )
                    }
                  />
                  <div>
                    <Text size="small" weight="plus">
                      {property.label}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      {property.usage_status} ·{" "}
                      {property.validator_key || "no validator"}
                    </Text>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      );
    if (step === 12)
      return (
        <div className="flex flex-col gap-4">
          <Text size="small">Representative configuration</Text>
          <ChoiceGrid
            value={draft.simulation.representative_components.map(
              (item: any) => item.component_id,
            )}
            rows={componentsByType([
              "cpu",
              "ram",
              "drive",
              "raid",
              "nic",
              "accelerator",
              "boot_storage",
              "rails",
            ])}
            onChange={(value) =>
              set(
                "simulation",
                "representative_components",
                value.map((component_id) => ({ component_id, quantity: 1 })),
              )
            }
            label={(row) => `${row.public_name} · ${row.type}`}
          />
          <Button
            size="small"
            isLoading={preview.isPending}
            onClick={() => preview.mutate()}
          >
            Run stage-04 simulation
          </Button>
          <StatusPanel preview={preview.data} />
        </div>
      );
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <Field
            required
            label="Reviewer"
            value={draft.review.reviewer}
            onChange={(value) => set("review", "reviewer", value)}
          />
          <Field
            label="Review notes"
            value={draft.review.notes}
            onChange={(value) => set("review", "notes", value)}
          />
        </div>
        <StatusPanel preview={preview.data} />
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            variant="secondary"
            isLoading={saveDraft.isPending}
            onClick={() => saveDraft.mutate()}
          >
            Save resumable draft
          </Button>
          <Button
            size="small"
            variant="secondary"
            isLoading={materialize.isPending}
            disabled={
              Boolean(draft.materialized_server_model_id) ||
              !preview.data?.coverage.ready_for_materialization
            }
            onClick={() => materialize.mutate()}
          >
            Materialize disabled technical graph
          </Button>
          <Button
            size="small"
            variant="secondary"
            isLoading={preview.isPending}
            disabled={!draft.materialized_server_model_id}
            onClick={() => preview.mutate()}
          >
            Re-run engine on graph
          </Button>
        </div>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={draft.review.publication_confirmed}
            onCheckedChange={(checked) =>
              set("review", "publication_confirmed", checked === true)
            }
          />
          <Text size="small">
            I confirm deterministic validation and transactional Medusa product
            publication.
          </Text>
        </label>
        <Button
          isLoading={publish.isPending}
          disabled={
            !draft.review.publication_confirmed ||
            !draft.materialized_server_model_id ||
            !preview.data?.simulation?.every((item: any) => item.ready)
          }
          onClick={() => publish.mutate()}
        >
          Publish validated server and product
        </Button>
        <Text size="small" className="text-ui-fg-subtle">
          Publication is disabled until every storage simulation is ready.
          Repair recommendations are never auto-applied.
        </Text>
      </div>
    );
  };

  const start = () => {
    setDraft(structuredClone(initialDraft));
    setSessionId(undefined);
    setStep(0);
    setDirty(false);
    preview.reset();
    setOpen(true);
  };
  const resume = (row: any) => {
    setDraft({
      ...structuredClone(initialDraft),
      ...(row.draft_payload_json || {}),
    });
    setSessionId(row.id);
    setStep(Math.max(0, Number(row.current_step || 1) - 1));
    setDirty(false);
    preview.reset();
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <Heading>Core Server Creation Wizard</Heading>
          <Text className="text-ui-fg-subtle">
            Controlled 14-step path from source-backed identity to deterministic
            review and Medusa publication.
          </Text>
        </div>
        <div className="flex gap-2">
          <Link to="/server-configurator/genius-bootstrap">
            <Button size="small" variant="secondary">
              Open Genius Bootstrap
            </Button>
          </Link>
          <Button size="small" onClick={start}>
            Create server
          </Button>
        </div>
      </div>
      <Container className="flex flex-col gap-2">
        <Text size="small" weight="plus">
          Resumable core drafts
        </Text>
        {draftsLoading ? (
          <Text size="small">Loading drafts…</Text>
        ) : (drafts?.drafts || []).length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            No core drafts.
          </Text>
        ) : (
          drafts.drafts.map((row: any) => (
            <button
              type="button"
              key={row.id}
              onClick={() => resume(row)}
              className="flex items-center justify-between rounded-md border border-ui-border-base p-3 text-left"
            >
              <div>
                <Text size="small" weight="plus">
                  {row.draft_payload_json?.identity?.public_name ||
                    "Untitled server"}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  Step {row.current_step} · updated{" "}
                  {new Date(row.updated_at).toLocaleString()}
                </Text>
              </div>
              <Badge color={row.status === "ready" ? "green" : "orange"}>
                {row.status}
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
            !window.confirm("Unsaved server changes exist. Close anyway?")
          )
            return;
          setOpen(next);
        }}
      >
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <FocusModal.Title>Core Server Creation Wizard</FocusModal.Title>
              <div className="flex w-full items-center justify-between">
                <Text size="small" weight="plus">
                  Step {step + 1} of 14: {steps[step]}
                </Text>
                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={step === 0}
                    onClick={() => setStep((value) => value - 1)}
                  >
                    Back
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    isLoading={saveDraft.isPending}
                    onClick={() => saveDraft.mutate()}
                  >
                    Save draft
                  </Button>
                  {step < 13 ? (
                    <Button
                      size="small"
                      onClick={() => setStep((value) => value + 1)}
                    >
                      Next
                    </Button>
                  ) : null}
                </div>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
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
                {renderStep()}
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Server Wizard",
  icon: ServerStack,
});
export default ServerWizardPage;
