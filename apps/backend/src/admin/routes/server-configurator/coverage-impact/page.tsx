import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChartBar } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  Heading,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { adminGet, adminPost } from "../_shared/api";

const CoverageImpactPage = () => {
  const [entityType, setEntityType] = useState("property_definition");
  const [entityId, setEntityId] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["coverage-analysis"],
    queryFn: () =>
      adminGet<any>("/admin/server-configurator/coverage-analysis"),
  });
  const impact = useMutation({
    mutationFn: () =>
      adminPost<any>("/admin/server-configurator/impact-analysis", {
        entity_type: entityType,
        entity_id: entityId,
      }),
    onError: (error: Error) => toast.error(error.message),
  });
  const rows =
    entityType === "property_definition"
      ? data?.entities.properties
      : entityType === "technology_concept"
        ? data?.entities.concepts
        : entityType === "technology_relation"
          ? []
          : data?.entities.assignments;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Heading>Coverage & Impact Analysis</Heading>
        <Text className="text-ui-fg-subtle">
          Unmapped knowledge, validator gaps, inherited conflicts and
          revalidation impact before shared changes.
        </Text>
      </div>
      {isLoading ? (
        <Container>
          <Text size="small">Loading coverage…</Text>
        </Container>
      ) : isError ? (
        <Container>
          <Text size="small" className="text-ui-fg-error">
            Coverage analysis failed. No cached fallback is shown.
          </Text>
        </Container>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-4">
            {Object.entries(data.counts).map(([key, value]) => (
              <Container key={key}>
                <Heading level="h2">{String(value)}</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  {key.replaceAll("_", " ")}
                </Text>
              </Container>
            ))}
          </div>
          <Container className="p-0">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Finding</Table.HeaderCell>
                  <Table.HeaderCell>Count</Table.HeaderCell>
                  <Table.HeaderCell>Entities</Table.HeaderCell>
                  <Table.HeaderCell>Action</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {Object.entries(data.coverage).map(
                  ([key, values]: [string, any]) => (
                    <Table.Row key={key}>
                      <Table.Cell>{key.replaceAll("_", " ")}</Table.Cell>
                      <Table.Cell>
                        <Badge color={values.length ? "orange" : "green"}>
                          {values.length}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small" className="text-ui-fg-subtle">
                          {values.slice(0, 8).join(", ") || "None"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Link to="/server-configurator/knowledge-base">
                          <Button size="small" variant="secondary">
                            Open mapping / review
                          </Button>
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ),
                )}
              </Table.Body>
            </Table>
          </Container>
        </>
      )}
      <Container className="flex flex-col gap-4">
        <Heading level="h2">Read-only impact preview</Heading>
        <div className="grid gap-3 lg:grid-cols-3">
          <div>
            <Text size="small" weight="plus">
              Entity type
            </Text>
            <Select
              value={entityType}
              onValueChange={(value) => {
                setEntityType(value);
                setEntityId("");
                impact.reset();
              }}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {[
                  "property_definition",
                  "technology_concept",
                  "technology_relation",
                  "pack_assignment",
                ].map((value) => (
                  <Select.Item key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div>
            <Text size="small" weight="plus">
              Entity
            </Text>
            <Select value={entityId || undefined} onValueChange={setEntityId}>
              <Select.Trigger>
                <Select.Value placeholder="Choose entity" />
              </Select.Trigger>
              <Select.Content>
                {(rows || []).map((row: any) => (
                  <Select.Item key={row.id} value={row.id}>
                    {row.label ||
                      row.display_name ||
                      row.name ||
                      row.key ||
                      row.id}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <Button
            className="self-end"
            disabled={!entityId}
            isLoading={impact.isPending}
            onClick={() => impact.mutate()}
          >
            Show impact before change
          </Button>
        </div>
        {impact.data ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <Container>
              <Text size="small" weight="plus">
                Affected server models
              </Text>
              <Heading level="h2">
                {impact.data.affected_server_models.length}
              </Heading>
            </Container>
            <Container>
              <Text size="small" weight="plus">
                Affected components
              </Text>
              <Heading level="h2">
                {impact.data.affected_components.length}
              </Heading>
            </Container>
            <Container>
              <Text size="small" weight="plus">
                Potentially invalid carts/configs
              </Text>
              <Heading level="h2">
                {impact.data.potentially_invalid_carts_or_configurations.length}
              </Heading>
            </Container>
            <Text size="small">
              Revalidation required: {String(impact.data.revalidation_required)}{" "}
              · preview writes: {String(impact.data.writes_performed)}
            </Text>
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            Select a shared entity to preview affected models, components, valid
            configurations and carts before editing.
          </Text>
        )}
      </Container>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Coverage & Impact",
  icon: ChartBar,
});
export default CoverageImpactPage;
