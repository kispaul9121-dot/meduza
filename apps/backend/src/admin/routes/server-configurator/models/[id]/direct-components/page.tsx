import { ArrowPath, Plus } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminGet, adminPost } from "../../../_shared/api";
import { Field } from "../../../_shared/form";
import {
  ComponentRow,
  KnowledgeEntity,
  ReadinessResponse,
  ServerModel,
} from "../../../_shared/types";

const Spinner = () => <Text size="small">Loading…</Text>;

const roleLabels: Record<string, string> = {
  optional_choice: "Optional choices",
  required_component: "Required components",
  default_component: "Defaults",
  auto_added_technical: "Auto-added technical parts",
  enablement_kit: "Enablement kits",
  replacement_option: "Replacement options",
};

function jsonSummary(value: unknown) {
  if (
    !value ||
    (typeof value === "object" && Object.keys(value as object).length === 0)
  )
    return "—";
  return JSON.stringify(value);
}

const DirectComponentsPage = () => {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [converting, setConverting] = useState<KnowledgeEntity | null>(null);
  const [pack, setPack] = useState({
    name: "",
    slug: "",
    source_reference: "",
  });
  const modelsQuery = useQuery({
    queryKey: ["sc-direct-models"],
    queryFn: () =>
      adminGet<{ models: ServerModel[] }>(
        "/admin/server-configurator/models?limit=500",
      ),
  });
  const assignmentsQuery = useQuery({
    queryKey: ["sc-direct-assignments", id],
    queryFn: () =>
      adminGet<{ entities: KnowledgeEntity[] }>(
        `/admin/server-configurator/knowledge-base/server_model_component_assignment?server_model_id=${encodeURIComponent(id)}&limit=500`,
      ),
    enabled: Boolean(id),
  });
  const componentsQuery = useQuery({
    queryKey: ["sc-direct-components"],
    queryFn: () =>
      adminGet<{ components: ComponentRow[] }>(
        "/admin/server-configurator/components?limit=1000",
      ),
  });
  const readinessQuery = useQuery({
    queryKey: ["sc-direct-readiness", id],
    queryFn: () =>
      adminPost<ReadinessResponse>(
        "/admin/server-configurator/compatibility-readiness",
        { server_model_id: id, mode: "assisted_preview", partial: true },
      ),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
  const model = modelsQuery.data?.models.find((item) => item.id === id);
  const componentById = useMemo(
    () =>
      new Map(
        (componentsQuery.data?.components || []).map((item) => [item.id, item]),
      ),
    [componentsQuery.data],
  );
  const assignments = assignmentsQuery.data?.entities || [];
  const grouped = Object.keys(roleLabels)
    .map(
      (role) =>
        [
          role,
          assignments.filter((item) => item.assignment_role === role),
        ] as const,
    )
    .filter(([, rows]) => rows.length);
  const convert = useMutation({
    mutationFn: () =>
      adminPost(
        "/admin/server-configurator/smart-builder/convert-direct-to-pack",
        {
          assignment_id: converting?.id,
          ...pack,
          source_reference: pack.source_reference || null,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sc-direct-assignments", id],
      });
      queryClient.invalidateQueries({ queryKey: ["sc-direct-readiness", id] });
      setConverting(null);
      toast.success("Direct assignment converted to a disabled draft pack");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const loading =
    modelsQuery.isLoading ||
    assignmentsQuery.isLoading ||
    componentsQuery.isLoading ||
    readinessQuery.isLoading;
  const failed =
    modelsQuery.isError ||
    assignmentsQuery.isError ||
    componentsQuery.isError ||
    readinessQuery.isError;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading>{model?.public_name || "Direct Components"}</Heading>
          <Text className="text-ui-fg-subtle">
            Server-specific choices, technical parts, kits and replacements.
            Generic alternatives belong in packs.
          </Text>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/server-configurator/smart-builder?server_model_id=${encodeURIComponent(id)}&intent=unique_component&return_to=${encodeURIComponent(`/server-configurator/models/${id}/direct-components`)}`}
          >
            <Button size="small">
              <Plus />
              Add direct component
            </Button>
          </Link>
          <Link
            to={`/server-configurator/smart-builder?server_model_id=${encodeURIComponent(id)}&intent=storage_configuration&return_to=${encodeURIComponent(`/server-configurator/models/${id}/direct-components`)}`}
          >
            <Button size="small" variant="secondary">
              Build storage cage
            </Button>
          </Link>
        </div>
      </div>
      <Container className="flex flex-wrap items-center gap-3">
        <Badge
          color={readinessQuery.data?.readiness.ready ? "green" : "orange"}
        >
          {readinessQuery.data?.readiness.status || "checking"}
        </Badge>
        <Text size="small" leading="compact">
          {readinessQuery.data?.readiness.candidate_count || 0} resolved
          candidates · {readinessQuery.data?.readiness.blockers.length || 0}{" "}
          blockers · {readinessQuery.data?.readiness.warnings.length || 0}{" "}
          warnings
        </Text>
        <Button
          size="small"
          variant="transparent"
          onClick={() => readinessQuery.refetch()}
        >
          <ArrowPath />
          Recheck engine
        </Button>
      </Container>
      {loading ? (
        <Container className="flex items-center gap-2">
          <Spinner />
          <Text size="small">
            Loading canonical assignments and engine readiness…
          </Text>
        </Container>
      ) : failed ? (
        <Container>
          <Text size="small" className="text-ui-fg-error">
            Unable to load direct components. No local fallback was used.
          </Text>
        </Container>
      ) : assignments.length === 0 ? (
        <Container>
          <Heading level="h2">No direct assignments</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Use Direct only for a server-specific part. Reusable alternatives
            should be created as a pack.
          </Text>
        </Container>
      ) : (
        grouped.map(([role, rows]) => (
          <Container key={role} className="p-0">
            <div className="px-6 py-4">
              <Heading level="h2">{roleLabels[role]}</Heading>
            </div>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Component</Table.HeaderCell>
                  <Table.HeaderCell>Visibility / quantities</Table.HeaderCell>
                  <Table.HeaderCell>Compatibility resources</Table.HeaderCell>
                  <Table.HeaderCell>Source</Table.HeaderCell>
                  <Table.HeaderCell>Action</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map((assignment) => {
                  const component = componentById.get(assignment.component_id);
                  return (
                    <Table.Row key={assignment.id}>
                      <Table.Cell>
                        <Text size="small" weight="plus">
                          {component?.public_name || assignment.component_id}
                        </Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {component?.type || "unknown"} ·{" "}
                          {component?.brand || "Unspecified"} · direct because{" "}
                          {assignment.notes || "server-specific assignment"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={
                            assignment.selection_mode === "visible"
                              ? "blue"
                              : "grey"
                          }
                        >
                          {assignment.selection_mode}
                        </Badge>
                        <Text size="small" className="text-ui-fg-subtle">
                          default {assignment.default_quantity} · min{" "}
                          {assignment.min_quantity} · max{" "}
                          {assignment.max_quantity}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small" leading="compact">
                          requires{" "}
                          {jsonSummary(
                            assignment.requirements_override_json ||
                              component?.requirements_json,
                          )}
                        </Text>
                        <Text size="small" leading="compact">
                          provides{" "}
                          {jsonSummary(
                            assignment.provides_override_json ||
                              component?.provides_json,
                          )}
                        </Text>
                        <Text size="small" leading="compact">
                          consumes{" "}
                          {jsonSummary(
                            assignment.consumes_override_json ||
                              component?.consumes_json,
                          )}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small" leading="compact">
                          {assignment.assignment_source}
                        </Text>
                        <Text
                          size="small"
                          leading="compact"
                          className="text-ui-fg-subtle"
                        >
                          {assignment.source_doc_reference ||
                            component?.source_json?.reference ||
                            "No source reference"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => {
                            setConverting(assignment);
                            setPack({
                              name: `${component?.public_name || "Component"} alternatives`,
                              slug: `${component?.short_name || assignment.component_id}-alternatives`
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/(^-|-$)/g, ""),
                              source_reference:
                                assignment.source_doc_reference || "",
                            });
                          }}
                        >
                          Convert to Pack
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </Container>
        ))
      )}
      <Drawer
        open={Boolean(converting)}
        onOpenChange={(open) => {
          if (!open) setConverting(null);
        }}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Heading>Convert Direct → Pack</Heading>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">
            <Text size="small" className="text-ui-fg-subtle">
              The workflow creates a disabled pack, item and model assignment,
              then removes the direct assignment. Any failure compensates all
              writes.
            </Text>
            <Field
              required
              label="Pack name"
              value={pack.name}
              onChange={(name) => setPack({ ...pack, name })}
            />
            <Field
              required
              label="Stable slug"
              value={pack.slug}
              onChange={(slug) => setPack({ ...pack, slug })}
            />
            <Field
              label="Source reference"
              value={pack.source_reference}
              onChange={(source_reference) =>
                setPack({ ...pack, source_reference })
              }
            />
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={() => setConverting(null)}>
              Cancel
            </Button>
            <Button
              isLoading={convert.isPending}
              disabled={!pack.name || !pack.slug}
              onClick={() => convert.mutate()}
            >
              Convert safely
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  );
};

export default DirectComponentsPage;
