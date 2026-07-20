import { defineRouteConfig } from "@medusajs/admin-sdk";
import { BookOpen } from "@medusajs/icons";
import {
  Badge,
  Button,
  Checkbox,
  Container,
  DataTable,
  DataTablePaginationState,
  Drawer,
  FocusModal,
  Heading,
  Input,
  Tabs,
  Text,
  Textarea,
  createDataTableColumnHelper,
  toast,
  useDataTable,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  adminDelete,
  adminGet,
  adminPost,
  joinList,
  query,
  splitList,
} from "../_shared/api";
import { Field, SelectField } from "../_shared/form";
import {
  KeyValueBuilder,
  MappingRow,
  mappingObject,
} from "../_shared/key-value-builder";
import { KnowledgeEntity, KnowledgeEntityType } from "../_shared/types";

const Spinner = () => <Text size="small">Loading…</Text>;

const sections: Array<{
  key: string;
  label: string;
  entity?: KnowledgeEntityType;
}> = [
  {
    key: "properties",
    label: "Property Registry",
    entity: "property_definition",
  },
  {
    key: "concepts",
    label: "Technology Concepts",
    entity: "technology_concept",
  },
  { key: "relations", label: "Relationships", entity: "technology_relation" },
  {
    key: "platforms",
    label: "Technology Platforms",
    entity: "technology_platform",
  },
  {
    key: "generations",
    label: "Vendor Generations",
    entity: "vendor_generation_template",
  },
  { key: "coverage", label: "Coverage & Unmapped" },
  { key: "usage", label: "Usage & Impact" },
];

const emptyByType: Record<string, Record<string, any>> = {
  property_definition: {
    key: "",
    label: "",
    description: "",
    value_type: "text",
    unit: "",
    entity_scopes: ["component"],
    required: false,
    displayable: true,
    filterable: false,
    comparable: false,
    searchable: false,
    inheritable: false,
    affects_compatibility: false,
    fact_path: "",
    validator_key: "",
    usage_status: "informational",
    lifecycle_status: "draft",
    allowed_values_json: [],
  },
  technology_concept: {
    concept_type_id: "",
    stable_key: "",
    display_name: "",
    vendor_scope: "",
    normalized_attributes_json: {},
    lifecycle_status: "draft",
  },
  technology_relation: {
    source_type: "component",
    source_id: "",
    relation_type_id: "",
    target_type: "technology_concept",
    target_id: "",
    quantity: 1,
    unit: "",
    source_reference: "",
    review_status: "unreviewed",
    enabled: true,
  },
  technology_platform: {
    key: "",
    name: "",
    supported_concepts_json: [],
    properties_json: {},
    review_status: "draft",
    enabled: true,
  },
  vendor_generation_template: {
    key: "",
    vendor: "",
    generation_label: "",
    architecture_variant: "",
    technology_platform_id: "",
    inherited_properties_json: {},
    default_option_groups_json: [],
    review_status: "draft",
    enabled: true,
  },
};

function titleOf(entity: KnowledgeEntity) {
  return (
    entity.label ||
    entity.display_name ||
    entity.name ||
    entity.key ||
    entity.id
  );
}

function statusOf(entity: KnowledgeEntity) {
  return (
    entity.lifecycle_status ||
    entity.review_status ||
    entity.status ||
    (entity.enabled === false ? "disabled" : "active")
  );
}

function toRows(
  value: Record<string, unknown> | null | undefined,
): MappingRow[] {
  return Object.entries(value || {}).map(([key, item]) => ({
    key,
    value: typeof item === "object" ? JSON.stringify(item) : String(item ?? ""),
  }));
}

function EntityFields({
  type,
  value,
  onChange,
  platforms,
  relationTypes,
}: {
  type: KnowledgeEntityType;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  platforms: KnowledgeEntity[];
  relationTypes: KnowledgeEntity[];
}) {
  const set = (key: string, next: unknown) =>
    onChange({ ...value, [key]: next });
  if (type === "property_definition")
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <Field
            required
            label="Stable key"
            value={value.key || ""}
            onChange={(next) => set("key", next)}
            hint="Canonical dotted identifier; it cannot be executable code."
          />
          <Field
            required
            label="Label"
            value={value.label || ""}
            onChange={(next) => set("label", next)}
          />
          <SelectField
            label="Value type"
            value={value.value_type || "text"}
            options={[
              "text",
              "number",
              "boolean",
              "enum",
              "reference",
              "list",
              "object",
            ]}
            onChange={(next) => set("value_type", next)}
          />
          <Field
            label="Unit"
            value={value.unit || ""}
            onChange={(next) => set("unit", next || null)}
          />
          <Field
            label="Entity scopes"
            value={joinList(value.entity_scopes)}
            onChange={(next) => set("entity_scopes", splitList(next))}
            hint="Comma-separated canonical owner types."
          />
          <Field
            label="Allowed values"
            value={joinList(value.allowed_values_json)}
            onChange={(next) => set("allowed_values_json", splitList(next))}
          />
          <Field
            label="Reference concept type"
            value={value.reference_concept_type || ""}
            onChange={(next) => set("reference_concept_type", next || null)}
          />
          <Field
            label="Fact path"
            value={value.fact_path || ""}
            onChange={(next) => set("fact_path", next || null)}
          />
          <Field
            label="Validator key"
            value={value.validator_key || ""}
            onChange={(next) => set("validator_key", next || null)}
            hint="Must resolve to the stage-04 closed registry."
          />
          <SelectField
            label="Usage status"
            value={value.usage_status || "informational"}
            options={[
              "informational",
              "filterable",
              "comparable",
              "engine_mapped",
              "unmapped",
              "deprecated",
              "unmapped_compatibility_property",
            ]}
            onChange={(next) => set("usage_status", next)}
          />
          <SelectField
            label="Lifecycle"
            value={value.lifecycle_status || "draft"}
            options={["draft", "active", "deprecated"]}
            onChange={(next) => set("lifecycle_status", next)}
          />
        </div>
        <label className="flex flex-col gap-1">
          <Text size="small" leading="compact" weight="plus">
            Description
          </Text>
          <Textarea
            value={value.description || ""}
            onChange={(event) => set("description", event.target.value || null)}
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["required", "Required"],
            ["displayable", "Display"],
            ["filterable", "Filter"],
            ["comparable", "Compare"],
            ["searchable", "Search"],
            ["inheritable", "Inherit"],
            ["affects_compatibility", "Affects compatibility"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <Checkbox
                checked={Boolean(value[key])}
                onCheckedChange={(checked) => set(key, checked === true)}
              />
              <Text size="small" leading="compact">
                {label}
              </Text>
            </label>
          ))}
        </div>
        {value.affects_compatibility &&
        !value.validator_key &&
        !value.fact_path ? (
          <Text size="small" className="text-ui-fg-error">
            This property will remain draft/unmapped and blocks production
            entities that depend on it.
          </Text>
        ) : null}
      </div>
    );
  if (type === "technology_concept")
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <Field
            required
            label="Concept type ID"
            value={value.concept_type_id || ""}
            onChange={(next) => set("concept_type_id", next)}
          />
          <Field
            required
            label="Stable key"
            value={value.stable_key || ""}
            onChange={(next) => set("stable_key", next)}
          />
          <Field
            required
            label="Display name"
            value={value.display_name || ""}
            onChange={(next) => set("display_name", next)}
          />
          <Field
            label="Vendor scope"
            value={value.vendor_scope || ""}
            onChange={(next) => set("vendor_scope", next || null)}
          />
          <SelectField
            label="Lifecycle"
            value={value.lifecycle_status || "draft"}
            options={["draft", "active", "deprecated"]}
            onChange={(next) => set("lifecycle_status", next)}
          />
        </div>
        <KeyValueBuilder
          label="Normalized properties"
          description="Canonical named values; aliases are managed separately."
          value={toRows(value.normalized_attributes_json)}
          onChange={(rows) =>
            set("normalized_attributes_json", mappingObject(rows))
          }
        />
      </div>
    );
  if (type === "technology_relation")
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <Field
            required
            label="Source type"
            value={value.source_type || ""}
            onChange={(next) => set("source_type", next)}
          />
          <Field
            required
            label="Source ID"
            value={value.source_id || ""}
            onChange={(next) => set("source_id", next)}
          />
          <SelectField
            label="Relation type"
            value={value.relation_type_id || relationTypes[0]?.id || ""}
            options={relationTypes.map((item) => item.id)}
            onChange={(next) => set("relation_type_id", next)}
          />
          <Field
            required
            label="Target type"
            value={value.target_type || ""}
            onChange={(next) => set("target_type", next)}
          />
          <Field
            required
            label="Target ID"
            value={value.target_id || ""}
            onChange={(next) => set("target_id", next)}
          />
          <Field
            type="number"
            label="Quantity"
            value={value.quantity || 1}
            onChange={(next) => set("quantity", Number(next))}
          />
          <Field
            label="Unit"
            value={value.unit || ""}
            onChange={(next) => set("unit", next || null)}
          />
          <Field
            label="Source document"
            value={value.source_reference || ""}
            onChange={(next) => set("source_reference", next || null)}
          />
          <SelectField
            label="Review"
            value={value.review_status || "unreviewed"}
            options={["unreviewed", "verified", "rejected"]}
            onChange={(next) => set("review_status", next)}
          />
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {value.source_id || "Source"} requires/provides {value.quantity || 1}{" "}
          × {value.target_id || "target"}. The engine will still check
          resources, qualification and constraints.
        </Text>
      </div>
    );
  if (type === "technology_platform")
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <Field
            required
            label="Stable key"
            value={value.key || ""}
            onChange={(next) => set("key", next)}
          />
          <Field
            required
            label="Name"
            value={value.name || ""}
            onChange={(next) => set("name", next)}
          />
          <Field
            label="Supported concept IDs"
            value={joinList(value.supported_concepts_json)}
            onChange={(next) => set("supported_concepts_json", splitList(next))}
          />
          <SelectField
            label="Review"
            value={value.review_status || "draft"}
            options={["draft", "verified", "deprecated"]}
            onChange={(next) => set("review_status", next)}
          />
        </div>
        <KeyValueBuilder
          label="Default properties"
          description="Shared platform facts inherited by generation/family/model scopes."
          value={toRows(value.properties_json)}
          onChange={(rows) => set("properties_json", mappingObject(rows))}
        />
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <Field
          required
          label="Stable key"
          value={value.key || ""}
          onChange={(next) => set("key", next)}
        />
        <Field
          required
          label="Vendor"
          value={value.vendor || ""}
          onChange={(next) => set("vendor", next)}
        />
        <Field
          required
          label="Generation label"
          value={value.generation_label || ""}
          onChange={(next) => set("generation_label", next)}
        />
        <Field
          label="Architecture variant"
          value={value.architecture_variant || ""}
          onChange={(next) => set("architecture_variant", next || null)}
        />
        <SelectField
          label="Parent platform"
          value={value.technology_platform_id || platforms[0]?.id || ""}
          options={platforms.map((item) => item.id)}
          onChange={(next) => set("technology_platform_id", next)}
        />
        <SelectField
          label="Review"
          value={value.review_status || "draft"}
          options={["draft", "verified", "deprecated"]}
          onChange={(next) => set("review_status", next)}
        />
      </div>
      <KeyValueBuilder
        label="Inherited property overrides"
        description="Only explicit generation differences; shared properties stay on the platform."
        value={toRows(value.inherited_properties_json)}
        onChange={(rows) =>
          set("inherited_properties_json", mappingObject(rows))
        }
      />
    </div>
  );
}

const columnHelper = createDataTableColumnHelper<KnowledgeEntity>();

const KnowledgeBasePage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedSection = params.get("section") || "properties";
  const returnTo = params.get("return_to");
  const returnNode = params.get("return_node");
  const scrollAnchor = params.get("scroll_anchor");
  const [active, setActive] = useState(
    sections.some((item) => item.key === requestedSection)
      ? requestedSection
      : "properties",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeEntity | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const section = sections.find((item) => item.key === active) || sections[0];
  const entityType = section.entity;
  const [draft, setDraft] = useState<Record<string, any>>(
    emptyByType.property_definition,
  );
  const limit = pagination.pageSize;
  const offset = pagination.pageIndex * limit;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sc-knowledge", entityType, limit, offset, search],
    queryFn: () =>
      adminGet<{ entities: KnowledgeEntity[]; count: number }>(
        `/admin/server-configurator/knowledge-base/${entityType}${query({ limit, offset, q: search })}`,
      ),
    enabled: Boolean(entityType),
  });
  const { data: platforms } = useQuery({
    queryKey: ["sc-knowledge-reference-platforms"],
    queryFn: () =>
      adminGet<{ entities: KnowledgeEntity[] }>(
        "/admin/server-configurator/knowledge-base/technology_platform?limit=500",
      ),
  });
  const { data: relationTypes } = useQuery({
    queryKey: ["sc-knowledge-reference-relation-types"],
    queryFn: () =>
      adminGet<{ entities: KnowledgeEntity[] }>(
        "/admin/server-configurator/knowledge-base/relation_type_definition?limit=500",
      ),
  });
  const { data: coverage, isLoading: coverageLoading } = useQuery({
    queryKey: ["sc-domain-coverage"],
    queryFn: () =>
      adminGet<{ coverage: Record<string, string[]> }>(
        "/admin/server-configurator/domain-coverage",
      ),
  });
  const { data: audit, isLoading: auditLoading } = useQuery({
    queryKey: ["sc-admin-audit"],
    queryFn: () =>
      adminGet<{
        events: KnowledgeEntity[];
        count: number;
        usage: Record<string, number>;
      }>("/admin/server-configurator/admin-audit?limit=100"),
  });

  const save = useMutation({
    mutationFn: ({
      id,
      type,
      value,
    }: {
      id?: string;
      type: KnowledgeEntityType;
      value: Record<string, any>;
    }) =>
      adminPost(
        `/admin/server-configurator/knowledge-base/${type}${id ? `/${id}` : ""}`,
        { entity_type: type, data: value },
      ),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["sc-knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["sc-domain-coverage"] });
      queryClient.invalidateQueries({ queryKey: ["sc-admin-audit"] });
      setCreateOpen(false);
      setEditing(null);
      toast.success("Knowledge entity saved");
      if (returnTo)
        navigate(returnTo, {
          state: {
            createdEntity: result?.entity,
            highlightId: result?.entity?.id,
            returnNode,
            scrollAnchor,
            revalidateDependencies: true,
          },
        });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Unable to save entity"),
  });
  const remove = useMutation({
    mutationFn: ({ id, type }: { id: string; type: KnowledgeEntityType }) =>
      adminDelete(`/admin/server-configurator/knowledge-base/${type}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sc-knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["sc-admin-audit"] });
      toast.success("Knowledge entity deleted");
    },
  });
  const openCreate = () => {
    if (!entityType) return;
    setDraft({ ...emptyByType[entityType] });
    setCreateOpen(true);
  };
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => titleOf(row), {
        id: "title",
        header: "Name / key",
        cell: ({ row }) => (
          <div>
            <Text size="small" leading="compact" weight="plus">
              {titleOf(row.original)}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {row.original.key || row.original.stable_key || row.original.id}
            </Text>
          </div>
        ),
      }),
      columnHelper.accessor((row) => statusOf(row), {
        id: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge
            color={
              String(getValue()).includes("unmapped") || getValue() === "draft"
                ? "orange"
                : "green"
            }
          >
            {String(getValue())}
          </Badge>
        ),
      }),
      columnHelper.accessor("updated_at", {
        header: "Updated",
        cell: ({ getValue }) =>
          getValue() ? new Date(String(getValue())).toLocaleString() : "—",
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="small"
              variant="secondary"
              onClick={() => setEditing(row.original)}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() =>
                entityType &&
                remove.mutate({ id: row.original.id, type: entityType })
              }
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ],
    [entityType, remove],
  );
  const table = useDataTable({
    data: data?.entities || [],
    columns,
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    search: { state: search, onSearchChange: setSearch },
    pagination: { state: pagination, onPaginationChange: setPagination },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Heading>Technology & Property Knowledge Base</Heading>
        <Text className="text-ui-fg-subtle">
          Canonical registries, mapped relations, inheritance coverage and
          audited impact.
        </Text>
      </div>
      {returnTo ? (
        <Container className="flex items-center justify-between gap-3">
          <div>
            <Text size="small" weight="plus">
              Nested Create-and-Return
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Save a draft entity to return to the exact Genius dependency and
              trigger revalidation.
            </Text>
          </div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate(returnTo)}
          >
            Return without creating
          </Button>
        </Container>
      ) : null}
      <Tabs value={active} onValueChange={setActive}>
        <Tabs.List>
          {sections.map((item) => (
            <Tabs.Trigger key={item.key} value={item.key}>
              {item.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>
      {entityType ? (
        <Container className="p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Text size="small" leading="compact" weight="plus">
                {section.label}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                Create uses a FocusModal; editing keeps list context in a
                Drawer.
              </Text>
            </div>
            <Button size="small" onClick={openCreate}>
              Create
            </Button>
          </div>
          {isError ? (
            <Text size="small" className="px-6 py-4 text-ui-fg-error">
              Unable to load this registry.
            </Text>
          ) : (
            <DataTable instance={table}>
              <DataTable.Toolbar>
                <DataTable.Search
                  placeholder={`Search ${section.label.toLowerCase()}...`}
                />
              </DataTable.Toolbar>
              <DataTable.Table />
              <DataTable.Pagination />
            </DataTable>
          )}
        </Container>
      ) : null}
      {active === "coverage" ? (
        <Container className="flex flex-col gap-3">
          {coverageLoading ? (
            <Spinner />
          ) : (
            Object.entries(coverage?.coverage || {}).map(([key, values]) => (
              <div
                key={key}
                className="rounded-md border border-ui-border-base p-3"
              >
                <div className="flex items-center justify-between">
                  <Text size="small" leading="compact" weight="plus">
                    {key.replaceAll("_", " ")}
                  </Text>
                  <Badge color={values.length ? "orange" : "green"}>
                    {values.length}
                  </Badge>
                </div>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  {values.length ? values.join(", ") : "No findings"}
                </Text>
              </div>
            ))
          )}
        </Container>
      ) : null}
      {active === "usage" ? (
        <Container className="flex flex-col gap-2">
          <Text size="small" leading="compact" weight="plus">
            Usage footprint and audited changes
          </Text>
          {auditLoading ? (
            <Spinner />
          ) : (
            <>
              <div className="grid gap-2 lg:grid-cols-4">
                {Object.entries(audit?.usage || {}).map(([key, count]) => (
                  <div
                    key={key}
                    className="rounded-md border border-ui-border-base p-3"
                  >
                    <Text size="small" leading="compact" weight="plus">
                      {count}
                    </Text>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      {key.replaceAll("_", " ")}
                    </Text>
                  </div>
                ))}
              </div>
              {(audit?.events || []).length === 0 ? (
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  No audited builder changes yet.
                </Text>
              ) : (
                audit?.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-md border border-ui-border-base px-4 py-3"
                  >
                    <div>
                      <Text size="small" leading="compact" weight="plus">
                        {event.action} {event.entity_type}
                      </Text>
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-subtle"
                      >
                        Actor {event.actor_id} ·{" "}
                        {event.entity_id || "no entity"}
                      </Text>
                    </div>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      {event.created_at
                        ? new Date(event.created_at).toLocaleString()
                        : ""}
                    </Text>
                  </div>
                ))
              )}
            </>
          )}
        </Container>
      ) : null}

      <FocusModal open={createOpen} onOpenChange={setCreateOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <FocusModal.Title>Create {section.label}</FocusModal.Title>
              <div className="flex items-center justify-end gap-2">
                <FocusModal.Close asChild>
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={save.isPending}
                  >
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  isLoading={save.isPending}
                  disabled={!entityType}
                  onClick={() =>
                    entityType &&
                    save.mutate({ type: entityType, value: draft })
                  }
                >
                  Create draft
                </Button>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
                <Heading>Create {section.label}</Heading>
                {entityType ? (
                  <EntityFields
                    type={entityType}
                    value={draft}
                    onChange={setDraft}
                    platforms={platforms?.entities || []}
                    relationTypes={relationTypes?.entities || []}
                  />
                ) : null}
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
      <Drawer
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              Edit {editing ? titleOf(editing) : "entity"}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-auto p-4">
            {editing && entityType ? (
              <EntityFields
                type={entityType}
                value={editing}
                onChange={(value) => setEditing({ ...editing, ...value })}
                platforms={platforms?.entities || []}
                relationTypes={relationTypes?.entities || []}
              />
            ) : null}
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                disabled={save.isPending}
              >
                Cancel
              </Button>
            </Drawer.Close>
            <Button
              size="small"
              isLoading={save.isPending}
              disabled={!editing || !entityType}
              onClick={() =>
                editing &&
                entityType &&
                save.mutate({
                  id: editing.id,
                  type: entityType,
                  value: editing,
                })
              }
            >
              Save
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Knowledge Base",
  icon: BookOpen,
});
export default KnowledgeBasePage;
