import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ServerStack } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { adminGet, adminPost } from "../_shared/api";
import { Field, SelectField } from "../_shared/form";

const modes = [
  ["guided_manual", "Guided Manual"],
  ["assisted_draft", "Assisted Draft"],
  ["bulk_apply", "Bulk Apply"],
] as const;

const launchModes = [
  ["quick_existing_platform", "Quick from existing platform"],
  ["new_model_existing_generation", "New model in existing generation"],
  ["bootstrap_vendor_generation", "Bootstrap new vendor generation"],
  [
    "bootstrap_technology_platform",
    "Bootstrap completely new technology platform",
  ],
  ["clone_similar_server", "Clone similar server"],
  ["import_documentation_review", "Import documentation and review"],
  ["resume_draft", "Resume draft"],
] as const;

const initialIntent: Record<string, any> = {
  mode: "guided_manual",
  launch_mode: "bootstrap_technology_platform",
  vendor: "",
  generation_label: "",
  platform_name: "",
  platform_key: "",
  socket: "",
  memory_technology: "",
  server_model: "",
  source_reference: "",
  source_type: "manual",
  confidence: 0,
  reviewer: "",
  decisions: {},
  property_assignments: [],
};

const emptyProperty = {
  scope_type: "technology_platform",
  scope_id: "",
  property_definition_id: "",
  normalized_value: "",
  unit: "",
  inheritance_behavior: "direct",
  usage: "display",
  concept_id: "",
  relation_role: "",
  validator_key: "",
  provider_consumer: "provider",
};

function ModeSwitch({
  value,
  onRequest,
}: {
  value: string;
  onRequest: (value: string) => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-2 rounded-md border border-ui-border-base bg-ui-bg-base p-2 shadow-elevation-card-rest">
      {modes.map(([key, label]) => (
        <button
          type="button"
          key={key}
          onClick={() => key !== value && onRequest(key)}
          className={`rounded-md px-3 py-2 text-sm ${value === key ? "bg-ui-bg-interactive text-ui-fg-on-color" : "bg-ui-bg-subtle text-ui-fg-base"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ConfirmationCenter({ plan, intent }: { plan: any; intent: any }) {
  const decisions = Object.values(intent.decisions || {});
  const counts = {
    pending: decisions.filter((value) => value === "suggested").length,
    confirmed: decisions.filter((value) =>
      ["confirmed", "edited"].includes(String(value)),
    ).length,
    rejected: decisions.filter((value) => value === "rejected").length,
    unresolved:
      plan?.plan?.blocker_count ||
      decisions.filter((value) => value === "unresolved").length,
    manifest: plan?.manifest?.planned_creates?.length || 0,
    applied: 0,
  };
  return (
    <Container className="flex flex-col gap-3">
      <div>
        <Heading level="h2">Confirmation Center</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Every decision remains editable until a stage-08 apply adapter records
          it as a dependency.
        </Text>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(counts).map(([key, value]) => (
          <div key={key} className="rounded-md border border-ui-border-base p-3">
            <Heading level="h3">{value}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {key.replaceAll("_", " ")}
            </Text>
          </div>
        ))}
      </div>
    </Container>
  );
}

const GeniusBootstrapPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const [intent, setIntent] = useState<Record<string, any>>(initialIntent);
  const [sessionId, setSessionId] = useState("");
  const [manifestId, setManifestId] = useState("");
  const [phase, setPhase] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [pendingMode, setPendingMode] = useState("");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [classification, setClassification] = useState("unclassified");
  const [classificationTerm, setClassificationTerm] = useState("");
  const [propertyDraft, setPropertyDraft] = useState<Record<string, any>>({
    ...emptyProperty,
  });
  const [dryRun, setDryRun] = useState<any>(null);
  const saveInFlight = useRef<Promise<any> | null>(null);

  const { data: sessions } = useQuery({
    queryKey: ["genius-sessions"],
    queryFn: () =>
      adminGet<{ sessions: any[]; count: number }>(
        "/admin/server-configurator/genius/sessions",
      ),
  });
  const planner = useMutation({
    mutationFn: () =>
      adminPost<any>("/admin/server-configurator/genius/plan", { intent }),
    onError: (error: Error) => toast.error(error.message),
  });
  const decisionSignature = JSON.stringify({
    decisions: intent.decisions,
    property_assignments: intent.property_assignments,
  });
  useEffect(() => {
    if (!planner.data) return;
    const timer = setTimeout(() => planner.mutate(), 50);
    return () => clearTimeout(timer);
  }, [decisionSignature]);

  const persistSession = async () => {
    if (saveInFlight.current) return saveInFlight.current;
    const request = adminPost<any>(
      "/admin/server-configurator/genius/sessions",
      {
        id: sessionId || undefined,
        current_phase: phase,
        intent,
        state: {
          classification,
          classification_term: classificationTerm,
          selected_node_id: selectedNode?.id || null,
          scroll_anchor: `phase-${phase}`,
        },
        status: "draft",
      },
    )
      .then((result) => {
        const id = result?.entity?.id || result?.id;
        if (id) setSessionId(id);
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ["genius-sessions"] });
        return id || sessionId;
      })
      .finally(() => {
        saveInFlight.current = null;
      });
    saveInFlight.current = request;
    return request;
  };

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      persistSession().catch((error) => toast.error(error.message));
    }, 900);
    return () => clearTimeout(timer);
  }, [dirty, intent, phase, classification, classificationTerm]);

  useEffect(() => {
    const state = location.state as any;
    if (!state?.revalidateDependencies && !state?.highlightId) return;
    setSelectedNode((node: any) =>
      node
        ? { ...node, returned_entity_id: state.highlightId }
        : { id: state.returnNode, returned_entity_id: state.highlightId },
    );
    planner.mutate();
    window.history.replaceState({}, document.title);
  }, [location.state]);

  const set = (key: string, value: unknown) => {
    setIntent((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };
  const setDecision = (id: string, value: string) => {
    setIntent((current) => ({
      ...current,
      decisions: { ...(current.decisions || {}), [id]: value },
    }));
    setDirty(true);
  };

  const saveManifest = useMutation({
    mutationFn: async () => {
      const id = await persistSession();
      if (!id) throw new Error("Save the Genius session first.");
      return adminPost<any>("/admin/server-configurator/genius/manifest", {
        id: manifestId || undefined,
        session_id: id,
        intent,
        confirmation: "SAVE_CONFIRMED_MANIFEST",
      });
    },
    onSuccess: (result) => {
      setManifestId(result.manifest?.id || result.preview?.id || manifestId);
      queryClient.invalidateQueries({ queryKey: ["genius-sessions"] });
      toast.success("Confirmed Creation Manifest saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const runDryRun = useMutation({
    mutationFn: () =>
      adminPost<any>("/admin/server-configurator/genius/bulk-adapter", {
        operation: "dry_run",
        idempotency_key: `genius-${sessionId || "unsaved"}-v1`,
        manifest: planner.data?.manifest || {},
        approved_groups: [],
      }),
    onSuccess: setDryRun,
    onError: (error: Error) => toast.error(error.message),
  });
  const stageManifest = useMutation({
    mutationFn: async () => {
      const session = sessionId || (await persistSession());
      if (!session) throw new Error("Save the Genius session first.");
      let creationManifestId = manifestId;
      if (!creationManifestId) {
        const saved = await saveManifest.mutateAsync();
        creationManifestId = saved.manifest?.id || saved.preview?.id;
      }
      if (!creationManifestId)
        throw new Error("A confirmed Creation Manifest is required.");
      const vendor = String(intent.vendor || "").toLowerCase();
      const adapterKey = vendor.includes("dell")
        ? "dell"
        : vendor.includes("supermicro")
          ? "supermicro"
          : vendor.includes("hpe")
            ? "hpe"
            : null;
      if (!adapterKey)
        throw new Error("Select HPE, Dell or Supermicro before staging the vendor manifest.");
      return adminPost<any>(
        "/admin/server-configurator/import-pipeline/genius-manifest",
        {
          adapter_key: adapterKey,
          creation_manifest_id: creationManifestId,
          wizard_session_id: session,
          manifest: planner.data?.manifest || {},
        },
      );
    },
    onSuccess: (result) => {
      toast.success("Shared manifest staged for explicit import review");
      navigate(`/server-configurator/import-pipeline?batch=${result.batch.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const propertyCheck = useMutation({
    mutationFn: () =>
      adminPost<any>(
        "/admin/server-configurator/genius/property-completeness",
        {
          value_present: Boolean(propertyDraft.normalized_value),
          unit_present: Boolean(propertyDraft.unit),
          affects_compatibility: propertyDraft.usage === "compatibility",
          concept_present: Boolean(propertyDraft.concept_id),
          relation_present: Boolean(propertyDraft.relation_role),
          validator_present: Boolean(propertyDraft.validator_key),
          inherited_conflict: false,
        },
      ),
  });
  const abandon = useMutation({
    mutationFn: () =>
      adminPost<any>("/admin/server-configurator/genius/abandon", {
        session_id: sessionId,
        confirmation: "ABANDON_GENIUS_DRAFT",
      }),
    onSuccess: () => {
      setSessionId("");
      setManifestId("");
      setIntent(initialIntent);
      setPhase(0);
      planner.reset();
      queryClient.invalidateQueries({ queryKey: ["genius-sessions"] });
      toast.success("Draft abandoned; no production entity was changed");
    },
  });

  const modeSummary = useMemo(() => {
    if (!pendingMode) return null;
    return {
      preserved: "Confirmed values and accepted proposals",
      pending: "Suggestions stay separate draft proposals",
      actions: "No create, update, delete, apply or publication action",
      manifest:
        pendingMode === "bulk_apply"
          ? "Only confirmed/edited decisions enter the manifest"
          : "The unapplied manifest stays resumable",
    };
  }, [pendingMode]);

  const openNested = async (node: any) => {
    const id = await persistSession();
    const separator = node.nested_wizard.includes("?") ? "&" : "?";
    const returnTo = `/server-configurator/genius-bootstrap?session_id=${encodeURIComponent(id)}`;
    navigate(
      `${node.nested_wizard}${separator}return_to=${encodeURIComponent(returnTo)}&return_node=${encodeURIComponent(node.id)}&scroll_anchor=${encodeURIComponent(`node-${node.id}`)}&parent_session_id=${encodeURIComponent(id)}&parent_node_id=${encodeURIComponent(node.id)}`,
    );
  };

  const resume = (row: any) => {
    const payload = row.draft_payload_json || {};
    setSessionId(row.id);
    setManifestId(row.latest_manifest?.id || "");
    setIntent({ ...initialIntent, ...(payload.intent || {}) });
    setPhase(Number(row.current_step || 0));
    setClassification(payload.state?.classification || "unclassified");
    setClassificationTerm(payload.state?.classification_term || "");
    setDirty(false);
    planner.reset();
  };

  useEffect(() => {
    const requestedSessionId = params.get("session_id");
    if (!requestedSessionId || sessionId || !sessions?.sessions?.length) return;
    const row = sessions.sessions.find((item) => item.id === requestedSessionId);
    if (row) resume(row);
  }, [params, sessions, sessionId]);

  const addPropertyProposal = () => {
    const id = `property-${Date.now()}`;
    setIntent((current) => ({
      ...current,
      property_assignments: [
        ...(current.property_assignments || []),
        { ...propertyDraft, id, status: "confirmed" },
      ],
    }));
    setPropertyDraft({ ...emptyProperty });
    setDirty(true);
    toast.success("Property assignment added to the manifest only");
  };

  const manifest = planner.data?.manifest;
  const discovery = planner.data?.discovery;
  const nodes = planner.data?.plan?.nodes || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading>Genius Bootstrap Wizard</Heading>
          <Text className="text-ui-fg-subtle">
            Discovery, explainable dependency planning and confirmed manifests
            over the proven Core Wizard boundary.
          </Text>
        </div>
        <div className="flex gap-2">
          <Badge color="blue">Phase {phase} of 15</Badge>
          <Button
            size="small"
            variant="secondary"
            isLoading={Boolean(saveInFlight.current)}
            onClick={() => persistSession().then(() => toast.success("Draft saved"))}
          >
            Save draft
          </Button>
        </div>
      </div>

      <ModeSwitch value={intent.mode} onRequest={setPendingMode} />
      {modeSummary ? (
        <Container className="flex flex-col gap-3 border-ui-border-interactive">
          <Heading level="h2">Mode switch preview</Heading>
          <div className="grid gap-2 lg:grid-cols-2">
            {Object.entries(modeSummary).map(([key, value]) => (
              <Text key={key} size="small">
                <span className="font-medium">{key}:</span> {value}
              </Text>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() => {
                set("mode", pendingMode);
                setPendingMode("");
              }}
            >
              Confirm behavior switch
            </Button>
            <Button size="small" variant="secondary" onClick={() => setPendingMode("")}>
              Keep current mode
            </Button>
          </div>
        </Container>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="flex flex-col gap-4">
          <Container className="flex flex-col gap-4">
            <div>
              <Heading level="h2">Phase 0 · Discovery Scan</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Start with an empty platform/generation context. Scanning and
                planning perform no writes.
              </Text>
            </div>
            <SelectField
              label="Launch mode"
              value={intent.launch_mode}
              options={launchModes.map(([key]) => key)}
              onChange={(value) => set("launch_mode", value)}
            />
            <div className="grid gap-3 lg:grid-cols-3">
              {[
                ["vendor", "Vendor"],
                ["generation_label", "Generation"],
                ["platform_name", "Platform name"],
                ["platform_key", "Platform key"],
                ["socket", "Canonical socket"],
                ["memory_technology", "Memory technology"],
                ["server_model", "Server model"],
                ["source_reference", "Source document / page"],
                ["reviewer", "Reviewer"],
              ].map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={intent[key] || ""}
                  onChange={(value) => set(key, value)}
                />
              ))}
              <SelectField
                label="Source type"
                value={intent.source_type}
                options={["manual", "document", "ai_suggestion", "import"]}
                onChange={(value) => set("source_type", value)}
              />
              <Field
                type="number"
                label="Confidence (0–1)"
                value={intent.confidence}
                onChange={(value) => set("confidence", Number(value))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                isLoading={planner.isPending}
                onClick={() => {
                  setPhase(1);
                  setDirty(true);
                  planner.mutate();
                }}
              >
                Scan and build dependency plan
              </Button>
              <Badge color="blue">preview writes: false</Badge>
            </div>
            {discovery ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-ui-border-base p-3">
                  <Text size="small" weight="plus">
                    Exists / reusable
                  </Text>
                  {Object.entries(discovery.found).map(([key, rows]: [string, any]) => (
                    <Text key={key} size="small" className="text-ui-fg-subtle">
                      ✓ {key.replaceAll("_", " ")}: {rows.length}
                    </Text>
                  ))}
                </div>
                <div className="rounded-md border border-ui-border-base p-3">
                  <Text size="small" weight="plus">
                    Missing / review
                  </Text>
                  {Object.entries(discovery.gaps).map(([key, value]: [string, any]) => (
                    <Text key={key} size="small" className="text-ui-fg-subtle">
                      {Array.isArray(value) ? (value.length ? "⚠" : "✓") : value ? "✕" : "✓"} {key.replaceAll("_", " ")}
                      {Array.isArray(value) ? `: ${value.length}` : ""}
                    </Text>
                  ))}
                </div>
              </div>
            ) : null}
          </Container>

          {nodes.length ? (
            <Container className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <Heading level="h2">Phase 1 · Dependency Planner</Heading>
                  <Text size="small" className="text-ui-fg-subtle">
                    Deterministic dependency order. Candidate packs still do not
                    prove compatibility.
                  </Text>
                </div>
                <Badge color={planner.data.plan.blocker_count ? "orange" : "green"}>
                  {planner.data.plan.blocker_count} blockers
                </Badge>
              </div>
              {nodes.map((node: any) => (
                <div
                  id={`node-${node.id}`}
                  key={node.id}
                  className="flex flex-col gap-3 rounded-md border border-ui-border-base p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Text size="small" weight="plus">
                        {node.order}. {node.label}
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {node.required ? "Required" : "Optional"} · {node.state} · {node.action} · confidence {node.confidence}
                      </Text>
                    </div>
                    <div className="flex gap-1">
                      <Badge color={node.state === "exists" ? "green" : node.state === "duplicate" ? "red" : "orange"}>
                        {node.state}
                      </Badge>
                      <Badge color="blue">{node.decision}</Badge>
                    </div>
                  </div>
                  {node.blocker ? <Text size="small" className="text-ui-fg-error">{node.blocker}</Text> : null}
                  {node.warning ? <Text size="small" className="text-ui-fg-subtle">{node.warning}</Text> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button size="small" variant="secondary" onClick={() => setSelectedNode(node)}>
                      Action Preview
                    </Button>
                    <Button size="small" variant="secondary" onClick={() => openNested(node)}>
                      {node.state === "exists" ? "Choose / review existing" : "Open nested builder"}
                    </Button>
                    {["confirmed", "rejected", "unresolved"].map((status) => (
                      <Button
                        key={status}
                        size="small"
                        variant={node.decision === status ? "primary" : "secondary"}
                        onClick={() => setDecision(node.id, status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </Container>
          ) : null}

          <Container className="flex flex-col gap-4">
            <div>
              <Heading level="h2">Property Assignment Wizard · 10 steps</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Scope → property → value/unit → inheritance → usage → mapping → conflict → impact → manifest → coverage.
              </Text>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              <SelectField label="1. Scope" value={propertyDraft.scope_type} options={["technology_platform", "vendor_generation", "server_family", "server_model", "chassis_variant", "storage_option", "component", "component_pack"]} onChange={(value) => setPropertyDraft((row) => ({ ...row, scope_type: value }))} />
              <Field label="Scope entity ID" value={propertyDraft.scope_id} onChange={(value) => setPropertyDraft((row) => ({ ...row, scope_id: value }))} />
              <Field label="2. PropertyDefinition ID" value={propertyDraft.property_definition_id} onChange={(value) => setPropertyDraft((row) => ({ ...row, property_definition_id: value }))} />
              <Field label="3. Normalized value" value={propertyDraft.normalized_value} onChange={(value) => setPropertyDraft((row) => ({ ...row, normalized_value: value }))} />
              <Field label="Unit" value={propertyDraft.unit} onChange={(value) => setPropertyDraft((row) => ({ ...row, unit: value }))} />
              <SelectField label="4. Inheritance" value={propertyDraft.inheritance_behavior} options={["direct", "inherited", "override", "disable", "unresolved_draft"]} onChange={(value) => setPropertyDraft((row) => ({ ...row, inheritance_behavior: value }))} />
              <SelectField label="5. Usage" value={propertyDraft.usage} options={["display", "filter", "compare", "compatibility"]} onChange={(value) => setPropertyDraft((row) => ({ ...row, usage: value }))} />
              <Field label="6. Concept ID" value={propertyDraft.concept_id} onChange={(value) => setPropertyDraft((row) => ({ ...row, concept_id: value }))} />
              <Field label="Relation role" value={propertyDraft.relation_role} onChange={(value) => setPropertyDraft((row) => ({ ...row, relation_role: value }))} />
              <Field label="Validator key" value={propertyDraft.validator_key} onChange={(value) => setPropertyDraft((row) => ({ ...row, validator_key: value }))} />
              <SelectField label="Provider / consumer" value={propertyDraft.provider_consumer} options={["provider", "consumer"]} onChange={(value) => setPropertyDraft((row) => ({ ...row, provider_consumer: value }))} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="small" variant="secondary" isLoading={propertyCheck.isPending} onClick={() => propertyCheck.mutate()}>
                7–8. Check conflict and impact
              </Button>
              <Button size="small" disabled={!propertyCheck.data?.ready || !propertyDraft.property_definition_id || !propertyDraft.scope_id} onClick={addPropertyProposal}>
                9. Add confirmed assignment to manifest
              </Button>
              <Button size="small" variant="secondary" onClick={async () => {
                const id = await persistSession();
                const returnTo = `/server-configurator/genius-bootstrap?session_id=${encodeURIComponent(id)}`;
                navigate(`/server-configurator/knowledge-base?section=properties&return_to=${encodeURIComponent(returnTo)}&return_node=property-assignment&scroll_anchor=property-assignment`);
              }}>
                Create PropertyDefinition and return
              </Button>
              <Badge color={propertyCheck.data?.ready ? "green" : "orange"}>
                10. coverage {propertyCheck.data?.ready ? "ready" : "blocked"}
              </Badge>
            </div>
            {propertyCheck.data ? (
              <div className="flex flex-wrap gap-2">
                {propertyCheck.data.chain.map((item: any) => (
                  <Badge key={item.key} color={item.ready ? "green" : item.blocker ? "red" : "orange"}>
                    {item.key}: {item.ready ? "ready" : "missing"}
                  </Badge>
                ))}
                <Badge color="blue">writes: false</Badge>
              </div>
            ) : null}
          </Container>

          <Container className="flex flex-col gap-3">
            <Heading level="h2">Unknown term classification</Heading>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Unknown word or property" value={classificationTerm} onChange={(value) => { setClassificationTerm(value); setDirty(true); }} />
              <SelectField label="What is it?" value={classification} options={["known_concept_value", "new_property", "physical_resource", "new_component", "new_component_type", "new_relation", "unclassified"]} onChange={(value) => { setClassification(value); setDirty(true); }} />
            </div>
            <Text size="small" className="text-ui-fg-subtle">
              Classification is saved as a draft decision. No random entity is created automatically.
            </Text>
          </Container>

          {manifest ? (
            <Container className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Heading level="h2">Creation Manifest Preview</Heading>
                  <Text size="small" className="text-ui-fg-subtle">
                    Confirmed decisions only. Publication always requires a separate Core Wizard decision.
                  </Text>
                </div>
                <Badge color={manifest.blockers.length ? "orange" : "green"}>{manifest.status}</Badge>
              </div>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Group</Table.HeaderCell>
                    <Table.HeaderCell>Count</Table.HeaderCell>
                    <Table.HeaderCell>Result</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {[
                    ["creates", manifest.planned_creates],
                    ["updates", manifest.planned_updates],
                    ["links", manifest.planned_links],
                    ["assignments", manifest.planned_assignments],
                    ["publication actions", manifest.publication_actions],
                    ["unresolved / excluded", manifest.excluded_suggestions],
                  ].map(([key, rows]: [any, any]) => (
                    <Table.Row key={key}>
                      <Table.Cell>{key}</Table.Cell>
                      <Table.Cell>{rows.length}</Table.Cell>
                      <Table.Cell>{key === "publication actions" ? "Separate confirmation required" : "Visible in preview"}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
              <div className="flex flex-wrap gap-2">
                <Button isLoading={saveManifest.isPending} onClick={() => saveManifest.mutate()}>
                  Save confirmed manifest
                </Button>
                <Button variant="secondary" isLoading={runDryRun.isPending} onClick={() => runDryRun.mutate()}>
                  Dry Run through stage-08 adapter contract
                </Button>
                <Button
                  isLoading={stageManifest.isPending}
                  onClick={() => stageManifest.mutate()}
                >
                  Stage manifest for import review
                </Button>
                <Button variant="secondary" onClick={() => navigate("/server-configurator/server-wizard")}>
                  Open separate publication review
                </Button>
              </div>
              {dryRun ? (
                <div className="rounded-md border border-ui-border-base p-3">
                  <Text size="small" weight="plus">Dry Run result</Text>
                  <Text size="small">writes performed: {String(dryRun.result.writes_performed)} · apply available: {String(dryRun.result.apply_available)} · approved items: {dryRun.result.approved_item_count}</Text>
                  <Text size="small" className="text-ui-fg-subtle">Permission required: {dryRun.permission.required}; transactional apply owner: {dryRun.capabilities.transactional_apply_owner}</Text>
                </div>
              ) : null}
            </Container>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <ConfirmationCenter plan={planner.data} intent={intent} />
          {selectedNode ? (
            <Container className="flex flex-col gap-3">
              <Heading level="h2">Action Preview</Heading>
              <Text size="small" weight="plus">Will be {selectedNode.action === "create" ? "created" : "reviewed/linked"}: {selectedNode.label || selectedNode.id}</Text>
              <Text size="small">Will be linked: {selectedNode.action === "link" ? "the confirmed existing entity" : "nothing automatically"}</Text>
              <Text size="small">Affected: current Genius draft and future confirmed manifest only</Text>
              <Text size="small" className="text-ui-fg-subtle">Will not happen: relation creation, pack assignment, production apply or publication without its own confirmation.</Text>
            </Container>
          ) : null}
          <Container className="flex flex-col gap-3">
            <Heading level="h2">Recovery & rollback</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Resume restores mode, phase, decisions and nested return context. Abandon supersedes draft manifests and touches zero existing production entities.
            </Text>
            {(sessions?.sessions || []).length ? (
              sessions!.sessions.map((row) => (
                <button key={row.id} type="button" onClick={() => resume(row)} className="rounded-md border border-ui-border-base p-3 text-left">
                  <Text size="small" weight="plus">{row.draft_payload_json?.intent?.platform_name || row.draft_payload_json?.intent?.server_model || "Empty-platform bootstrap"}</Text>
                  <Text size="small" className="text-ui-fg-subtle">Phase {row.current_step} · {row.mode_hint} · manifest {row.latest_manifest?.status || "not saved"}</Text>
                </button>
              ))
            ) : (
              <Text size="small" className="text-ui-fg-subtle">No resumable Genius drafts.</Text>
            )}
            <div className="rounded-md border border-ui-border-base p-3">
              <Text size="small" weight="plus">Cancel cleanup preview</Text>
              <Text size="small" className="text-ui-fg-subtle">Existing entities modified: 0 · deleted: 0. Session/audit records remain immutable evidence; manifests become superseded.</Text>
            </div>
            <Button variant="danger" disabled={!sessionId} isLoading={abandon.isPending} onClick={() => abandon.mutate()}>
              Confirm abandon draft
            </Button>
          </Container>
          <Container className="flex flex-col gap-2">
            <Heading level="h2">Mode settings</Heading>
            <Text size="small">Default: Guided Manual</Text>
            <Text size="small">Remembered mode: stored in this actor-owned session</Text>
            <Text size="small">Enhanced confirmation: compatibility mappings and published data</Text>
            <Text size="small">Bulk Apply permission: required, not granted in stage 07</Text>
            <Text size="small">Maximum bulk items: enforced by the future stage-08 adapter</Text>
            <Text size="small">AI suggestions: proposals only; no production write authority</Text>
          </Container>
        </div>
      </div>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Genius Bootstrap",
  icon: ServerStack,
});

export default GeniusBootstrapPage;
