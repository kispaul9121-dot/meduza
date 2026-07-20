import { defineRouteConfig } from "@medusajs/admin-sdk";
import { SquaresPlus } from "@medusajs/icons";
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Drawer,
  FocusModal,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminGet, adminPost } from "../_shared/api";
import { Field, SelectField } from "../_shared/form";
import { KnowledgeEntity, ServerModel } from "../_shared/types";

const Spinner = () => <Text size="small">Loading…</Text>;

const empty = {
  key: "",
  title: "",
  scope_type: "server_model",
  scope_id: "",
  component_type: "accelerator",
  source_types_json: ["pack", "direct"],
  selection_cardinality: "zero_or_one",
  allow_none: true,
  none_label: "Без опции",
  none_selected_by_default: true,
  min_quantity: 0,
  max_quantity: 1,
  sort_order: 100,
  advanced: false,
  help_text: "",
  visibility_rules_json: null,
  schema_version: 1,
  enabled: false,
};

function GroupFields({
  value,
  onChange,
  models,
}: {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  models: ServerModel[];
}) {
  const set = (key: string, next: unknown) =>
    onChange({ ...value, [key]: next });
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
          label="Title"
          value={value.title || ""}
          onChange={(next) => set("title", next)}
        />
        <SelectField
          label="Scope"
          value={value.scope_type || "server_model"}
          options={[
            "server_model",
            "technology_platform",
            "vendor_generation",
            "server_family",
          ]}
          onChange={(next) => set("scope_type", next)}
        />
        {value.scope_type === "server_model" ? (
          <SelectField
            label="Server model"
            value={value.scope_id || models[0]?.id || ""}
            options={models.map((model) => model.id)}
            onChange={(next) => set("scope_id", next)}
          />
        ) : (
          <Field
            required
            label="Scope ID"
            value={value.scope_id || ""}
            onChange={(next) => set("scope_id", next)}
          />
        )}
        <SelectField
          label="Component type"
          value={value.component_type || "accelerator"}
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
          onChange={(next) => set("component_type", next)}
        />
        <Field
          label="Candidate sources"
          value={(value.source_types_json || []).join(", ")}
          onChange={(next) =>
            set(
              "source_types_json",
              next
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            )
          }
          hint="pack, direct, topology, bundle, auto_added, built_in"
        />
        <SelectField
          label="Cardinality"
          value={value.selection_cardinality || "zero_or_one"}
          options={[
            "zero_or_one",
            "exactly_one",
            "zero_or_many",
            "one_or_many",
          ]}
          onChange={(next) => set("selection_cardinality", next)}
        />
        <Field
          type="number"
          label="Min quantity"
          value={value.min_quantity || 0}
          onChange={(next) => set("min_quantity", Number(next))}
        />
        <Field
          type="number"
          label="Max quantity"
          value={value.max_quantity || 1}
          onChange={(next) => set("max_quantity", Number(next))}
        />
        <Field
          type="number"
          label="Storefront order"
          value={value.sort_order || 100}
          onChange={(next) => set("sort_order", Number(next))}
        />
        <Field
          label="None label"
          value={value.none_label || ""}
          onChange={(next) => set("none_label", next || null)}
        />
        <Field
          label="Help text"
          value={value.help_text || ""}
          onChange={(next) => set("help_text", next || null)}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        {[
          ["allow_none", "Allow none"],
          ["none_selected_by_default", "None by default"],
          ["advanced", "Advanced mode"],
          ["enabled", "Published"],
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
      {value.allow_none ? (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          “{value.none_label || "Без опции"}” is group state, not a fake
          Component or SKU.
        </Text>
      ) : null}
    </div>
  );
}

const OptionGroupsPage = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>(empty);
  const [editing, setEditing] = useState<KnowledgeEntity | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sc-option-groups"],
    queryFn: () =>
      adminGet<{ entities: KnowledgeEntity[] }>(
        "/admin/server-configurator/knowledge-base/configurator_option_group?limit=500",
      ),
  });
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["sc-option-group-models"],
    queryFn: () =>
      adminGet<{ models: ServerModel[] }>(
        "/admin/server-configurator/models?enabled=true&limit=500",
      ),
  });
  const save = useMutation({
    mutationFn: ({ value, id }: { value: Record<string, any>; id?: string }) =>
      adminPost(
        `/admin/server-configurator/knowledge-base/configurator_option_group${id ? `/${id}` : ""}`,
        { entity_type: "configurator_option_group", data: value },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sc-option-groups"] });
      setCreateOpen(false);
      setEditing(null);
      toast.success("Option group saved as canonical data");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const simulate = useMutation({
    mutationFn: async (value: Record<string, any>) => {
      const model = (models?.models || []).find(
        (item) => item.id === value.scope_id,
      );
      if (!model) throw new Error("Choose a server model for preview.");
      const [options, readiness] = await Promise.all([
        adminGet<any>(
          `/store/server-configurator/models/${model.slug}/options`,
        ),
        adminPost<any>("/admin/server-configurator/compatibility-readiness", {
          server_model_id: model.id,
          explicit_none: value.allow_none ? [value.key] : [],
          mode: "assisted_preview",
          partial: true,
        }),
      ]);
      return { options, readiness };
    },
    onSuccess: setPreview,
    onError: (error: Error) => toast.error(error.message),
  });
  const modelsList = models?.models || [];
  const editor = (
    value: Record<string, any>,
    onChange: (value: Record<string, any>) => void,
  ) => (
    <div className="flex flex-col gap-4">
      <GroupFields value={value} onChange={onChange} models={modelsList} />
      <Button
        size="small"
        variant="secondary"
        isLoading={simulate.isPending}
        onClick={() => simulate.mutate(value)}
      >
        Preview with stage-04 engine
      </Button>
      {preview ? (
        <div className="rounded-md border border-ui-border-base p-3">
          <div className="flex items-center gap-2">
            <Badge
              color={preview.readiness.readiness.ready ? "green" : "orange"}
            >
              {preview.readiness.readiness.status}
            </Badge>
            <Text size="small" leading="compact">
              {
                preview.options.options.filter(
                  (option: any) => option.type === value.component_type,
                ).length
              }{" "}
              engine options
            </Text>
          </div>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Disabled reasons and max quantities come from the Compatibility
            Engine response.
          </Text>
        </div>
      ) : null}
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <Heading>Configurator Option Groups</Heading>
          <Text className="text-ui-fg-subtle">
            Typed optional categories with real none state, cardinality and
            engine preview.
          </Text>
        </div>
        <Button
          size="small"
          onClick={() => {
            setDraft({ ...empty });
            setPreview(null);
            setCreateOpen(true);
          }}
        >
          Create group
        </Button>
      </div>
      <Container className="p-0">
        {isLoading || modelsLoading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : isError ? (
          <Text size="small" className="p-6 text-ui-fg-error">
            Unable to load option groups.
          </Text>
        ) : (data?.entities || []).length === 0 ? (
          <Text
            size="small"
            leading="compact"
            className="p-6 text-ui-fg-subtle"
          >
            No groups. Create GPU, M.2, rails or unique-board groups without
            fake “none” components.
          </Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Group</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Cardinality</Table.HeaderCell>
                <Table.HeaderCell>None</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data?.entities.map((group) => (
                <Table.Row key={group.id}>
                  <Table.Cell>
                    <Text size="small" leading="compact" weight="plus">
                      {group.title}
                    </Text>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      {group.key}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{group.component_type}</Table.Cell>
                  <Table.Cell>{group.selection_cardinality}</Table.Cell>
                  <Table.Cell>
                    {group.allow_none ? group.none_label : "Required"}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => {
                        setPreview(null);
                        setEditing(group);
                      }}
                    >
                      Edit
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
      <FocusModal open={createOpen} onOpenChange={setCreateOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <FocusModal.Title>Create option group</FocusModal.Title>
              <div className="flex justify-end gap-2">
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
                  onClick={() => save.mutate({ value: draft })}
                >
                  Create draft
                </Button>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
                <Heading>Create option group</Heading>
                {editor(draft, setDraft)}
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
            <Drawer.Title>Edit option group</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-auto p-4">
            {editing
              ? editor(editing, (value) => setEditing({ ...editing, ...value }))
              : null}
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button size="small" variant="secondary">
                Cancel
              </Button>
            </Drawer.Close>
            <Button
              size="small"
              isLoading={save.isPending}
              onClick={() =>
                editing && save.mutate({ id: editing.id, value: editing })
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
  label: "Option Groups",
  icon: SquaresPlus,
});
export default OptionGroupsPage;
