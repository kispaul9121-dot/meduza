import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ServerStack } from "@medusajs/icons"
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../../lib/client"

type SourceOfTruthResponse = {
  medusa_source_of_truth: string
  runtime_fallback: {
    enabled: boolean
    warning: string | null
  }
  counts: {
    server_models: number
    components: number
    components_by_type: Record<string, number>
    help_annotations: number
    compatibility_rules: number
    enabled_rules: number
    draft_rules: number
    rule_presets: number
  }
  fallback_files: {
    file: string
    exists: boolean
    allowed_runtime_use: boolean
    allowed_seed_import_use: boolean
  }[]
  db_first_endpoints: string[]
  warnings: string[]
}

const SourceOfTruthPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["server-configurator", "source-of-truth"],
    queryFn: () =>
      sdk.client.fetch<SourceOfTruthResponse>("/admin/server-configurator/source-of-truth"),
  })

  if (isLoading) {
    return (
      <Container className="flex items-center justify-center p-8">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Loading
        </Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <Heading>Source of Truth</Heading>
        <Text className="text-ui-fg-subtle">
          {data?.medusa_source_of_truth}
        </Text>
      </div>

      <Container>
        <div className="flex flex-wrap gap-2">
          <Badge color={data?.runtime_fallback.enabled ? "orange" : "green"}>
            Dev fallback {data?.runtime_fallback.enabled ? "active" : "off"}
          </Badge>
          <Badge color="blue">{data?.counts.server_models || 0} models</Badge>
          <Badge color="blue">{data?.counts.components || 0} components</Badge>
          <Badge color="blue">{data?.counts.help_annotations || 0} annotations</Badge>
          <Badge color="blue">{data?.counts.enabled_rules || 0} enabled rules</Badge>
          <Badge color={data?.counts.draft_rules ? "orange" : "green"}>
            {data?.counts.draft_rules || 0} draft/disabled rules
          </Badge>
        </div>
        {data?.runtime_fallback.warning && (
          <Text size="small" className="mt-3 text-ui-fg-subtle">
            {data.runtime_fallback.warning}
          </Text>
        )}
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            Components by type
          </Text>
        </div>
        <Table>
          <Table.Body>
            {Object.entries(data?.counts.components_by_type || {}).map(([type, count]) => (
              <Table.Row key={type}>
                <Table.Cell>{type}</Table.Cell>
                <Table.Cell>{count}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            Fallback files
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            These files may feed seed/import scripts, but not normal runtime option flow.
          </Text>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>File</Table.HeaderCell>
              <Table.HeaderCell>Exists</Table.HeaderCell>
              <Table.HeaderCell>Runtime</Table.HeaderCell>
              <Table.HeaderCell>Seed/import</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.fallback_files.map((file) => (
              <Table.Row key={file.file}>
                <Table.Cell>{file.file}</Table.Cell>
                <Table.Cell>{file.exists ? "yes" : "no"}</Table.Cell>
                <Table.Cell>{file.allowed_runtime_use ? "allowed" : "blocked"}</Table.Cell>
                <Table.Cell>{file.allowed_seed_import_use ? "allowed" : "blocked"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>

      <Container>
        <Text size="small" leading="compact" weight="plus">
          DB-first endpoints
        </Text>
        <div className="mt-3 flex flex-col gap-y-2">
          {data?.db_first_endpoints.map((endpoint) => (
            <Text key={endpoint} size="small" leading="compact" className="text-ui-fg-subtle">
              {endpoint}
            </Text>
          ))}
        </div>
      </Container>

      {!!data?.warnings.length && (
        <Container>
          <Text size="small" leading="compact" weight="plus">
            Warnings
          </Text>
          <div className="mt-3 flex flex-col gap-y-2">
            {data.warnings.map((warning) => (
              <Text key={warning} size="small" leading="compact" className="text-ui-fg-subtle">
                {warning}
              </Text>
            ))}
          </div>
        </Container>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Source of Truth",
  icon: ServerStack,
})

export default SourceOfTruthPage
