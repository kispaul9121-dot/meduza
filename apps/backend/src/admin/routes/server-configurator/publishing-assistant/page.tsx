import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ServerStack } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { adminGet, adminPost } from "../_shared/api"

type ServerModel = {
  id: string
  public_name: string
  slug: string
  brand?: string
  generation?: string
  enabled?: boolean
}

type Finding = {
  code: string
  severity: "blocking_error" | "warning" | "optional_improvement" | "complete"
  affected_entity: { type: string; id: string; label?: string }
  explanation: string
  repair_action: { action: string; label: string; target?: Record<string, unknown> }
  deep_link: string
  revalidation_required: boolean
  property?: string
  concept?: string
  relation?: string
  inherited_source?: { type: string; id: string } | null
  step?: number
}

type Readiness = {
  ready: boolean
  publication_allowed: boolean
  status: string
  findings: Finding[]
  blockers: Finding[]
  warnings: Finding[]
  optional_improvements: Finding[]
  blocking_error_count: number
  warning_count: number
  optional_improvement_count: number
  candidate_count: number
  affected_configuration_count: number
  entity_readiness: Record<string, boolean>
}

type ModelsResponse = { models: ServerModel[]; count: number }
type ReadinessResponse = { readiness: Readiness }

function badgeColor(severity: Finding["severity"]) {
  if (severity === "blocking_error") return "red" as const
  if (severity === "warning") return "orange" as const
  if (severity === "complete") return "green" as const
  return "blue" as const
}

function severityLabel(severity: Finding["severity"]) {
  if (severity === "blocking_error") return "Blocking error"
  if (severity === "optional_improvement") return "Optional improvement"
  if (severity === "complete") return "Complete"
  return "Warning"
}

const PublishingAssistantPage = () => {
  const [modelId, setModelId] = useState("")
  const { data: modelData, isLoading: modelsLoading, isError: modelsError } = useQuery({
    queryKey: ["publishing-assistant-models"],
    queryFn: () =>
      adminGet<ModelsResponse>(
        "/admin/server-configurator/models?limit=500&offset=0",
      ),
  })
  const models = modelData?.models || []

  useEffect(() => {
    if (!modelId && models[0]?.id) setModelId(models[0].id)
  }, [modelId, models])

  const readiness = useQuery({
    queryKey: ["server-publication-readiness", modelId],
    queryFn: () =>
      adminPost<ReadinessResponse>(
        "/admin/server-configurator/compatibility-readiness",
        {
          server_model_id: modelId,
          selected_components: [],
          explicit_none: [],
          mode: "production_validation",
          partial: false,
        },
      ),
    enabled: Boolean(modelId),
    retry: false,
  })

  const repair = useMutation({
    mutationFn: (finding: Finding) =>
      adminPost<{
        repair_session: { id: string }
        deep_link: string
      }>(
        "/admin/server-configurator/publishing-assistant/repair-session",
        { server_model_id: modelId, finding },
      ),
    onSuccess: (result) => {
      toast.success("Repair session created")
      window.location.assign(`/app${result.deep_link}`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const selectedModel = models.find((model) => model.id === modelId)
  const result = readiness.data?.readiness
  const findings = useMemo(() => {
    const order: Record<Finding["severity"], number> = {
      blocking_error: 0,
      warning: 1,
      optional_improvement: 2,
      complete: 3,
    }
    return [...(result?.findings || [])].sort(
      (left, right) => order[left.severity] - order[right.severity],
    )
  }, [result])
  const publishLink = `/server-configurator/server-wizard?server_model_id=${encodeURIComponent(modelId)}&step=14&mode=guided_manual&return_to=${encodeURIComponent("/server-configurator/publishing-assistant")}`

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading>Server Publishing Assistant</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            One deterministic readiness service for Admin, Wizard and the real
            publication workflow. Guided Manual is the default repair mode.
          </Text>
        </div>
        <Badge color="blue">No automatic publishing</Badge>
      </div>

      <Container className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-end">
          <div className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Server model
            </Text>
            <Select value={modelId || undefined} onValueChange={setModelId}>
              <Select.Trigger>
                <Select.Value
                  placeholder={modelsLoading ? "Loading server models…" : "Select a server model"}
                />
              </Select.Trigger>
              <Select.Content>
                {models.map((model) => (
                  <Select.Item key={model.id} value={model.id}>
                    {model.public_name} · {model.enabled ? "published" : "draft"}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <Button
            size="small"
            variant="secondary"
            disabled={!modelId || readiness.isFetching}
            onClick={() => readiness.refetch()}
          >
            {readiness.isFetching ? "Checking…" : "Run readiness check"}
          </Button>
        </div>
        {modelsError ? (
          <Text size="small" className="text-ui-fg-error">
            Server models could not be loaded.
          </Text>
        ) : null}
        {selectedModel ? (
          <Text size="small" className="text-ui-fg-subtle">
            {selectedModel.brand || "Unknown vendor"} · {selectedModel.generation || "No generation"} · /{selectedModel.slug}
          </Text>
        ) : null}
      </Container>

      {readiness.isLoading ? (
        <Container>
          <Text size="small">Calculating properties, inheritance, relations, storage and component sources…</Text>
        </Container>
      ) : null}
      {readiness.isError ? (
        <Container>
          <Text size="small" className="text-ui-fg-error">
            Readiness calculation failed. No cached or optimistic result is shown.
          </Text>
        </Container>
      ) : null}

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Container>
              <Text size="small" className="text-ui-fg-subtle">Publication</Text>
              <div className="mt-2">
                <Badge color={result.publication_allowed ? "green" : "red"}>
                  {result.publication_allowed ? "Allowed" : "Blocked"}
                </Badge>
              </div>
            </Container>
            <Container>
              <Text size="small" className="text-ui-fg-subtle">Blocking errors</Text>
              <Heading level="h2">{result.blocking_error_count}</Heading>
            </Container>
            <Container>
              <Text size="small" className="text-ui-fg-subtle">Warnings</Text>
              <Heading level="h2">{result.warning_count}</Heading>
            </Container>
            <Container>
              <Text size="small" className="text-ui-fg-subtle">Candidates</Text>
              <Heading level="h2">{result.candidate_count}</Heading>
            </Container>
          </div>

          <Container className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Heading level="h2">Publication decision</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  The Assistant never mutates or publishes a server automatically.
                </Text>
              </div>
              {result.publication_allowed ? (
                <Link to={publishLink}>
                  <Button size="small">Open final Wizard review</Button>
                </Link>
              ) : (
                <Button size="small" disabled>
                  Resolve blocking errors first
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.entity_readiness || {}).map(([key, ready]) => (
                <Badge key={key} color={ready ? "green" : "red"}>
                  {key.replaceAll("_", " ")}: {ready ? "ready" : "blocked"}
                </Badge>
              ))}
            </div>
          </Container>

          <Container className="p-0">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <Heading level="h2">Readiness findings</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Every finding includes a deterministic explanation, exact repair action and deep link.
                </Text>
              </div>
              <Badge color="grey">{findings.length} findings</Badge>
            </div>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Severity</Table.HeaderCell>
                  <Table.HeaderCell>Finding</Table.HeaderCell>
                  <Table.HeaderCell>Entity / provenance</Table.HeaderCell>
                  <Table.HeaderCell>Repair</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {findings.map((finding, index) => (
                  <Table.Row key={`${finding.code}-${finding.affected_entity.id}-${index}`}>
                    <Table.Cell>
                      <Badge color={badgeColor(finding.severity)}>
                        {severityLabel(finding.severity)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" weight="plus">{finding.code}</Text>
                      <Text size="small" className="max-w-xl text-ui-fg-subtle">
                        {finding.explanation}
                      </Text>
                      {finding.revalidation_required ? (
                        <Text size="small" className="text-ui-fg-subtle">
                          Revalidation required after repair.
                        </Text>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">
                        {finding.affected_entity.type}: {finding.affected_entity.label || finding.affected_entity.id}
                      </Text>
                      {finding.property ? <Text size="small" className="text-ui-fg-subtle">property: {finding.property}</Text> : null}
                      {finding.relation ? <Text size="small" className="text-ui-fg-subtle">relation: {finding.relation}</Text> : null}
                      {finding.inherited_source ? (
                        <Text size="small" className="text-ui-fg-subtle">
                          inherited from {finding.inherited_source.type}:{finding.inherited_source.id}
                        </Text>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col items-start gap-2">
                        <Text size="small">{finding.repair_action.label}</Text>
                        {finding.severity === "complete" ? (
                          <Link to={finding.deep_link}>
                            <Button size="small" variant="secondary">Open final review</Button>
                          </Link>
                        ) : (
                          <Button
                            size="small"
                            variant="secondary"
                            disabled={repair.isPending}
                            onClick={() => repair.mutate(finding)}
                          >
                            {repair.isPending ? "Creating repair…" : "Start guided repair"}
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Container>
        </>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Publishing Assistant",
  icon: ServerStack,
})

export default PublishingAssistantPage
