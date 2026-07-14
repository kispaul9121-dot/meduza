import { Badge, Container, Heading, Input, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { listRulePresets } from "./api"
import { truncate, yesNo } from "./format"

export function PresetsTable() {
  const [search, setSearch] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["import-review", "presets", search],
    queryFn: () => listRulePresets({ q: search, limit: "100" }),
  })

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Rule Presets</Heading>
          <Text size="small" className="text-ui-fg-subtle">Draft templates for future normalized compatibility rules.</Text>
        </div>
        <Input placeholder="Search presets" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Table>
        <Table.Header><Table.Row>{["name", "category", "description", "enabled"].map((h) => <Table.HeaderCell key={h}>{h}</Table.HeaderCell>)}</Table.Row></Table.Header>
        <Table.Body>
          {isLoading ? <Table.Row><Table.Cell colSpan={4}>Loading</Table.Cell></Table.Row> : data?.presets.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell><Badge>{row.category}</Badge></Table.Cell>
              <Table.Cell>{truncate(row.description, 96)}</Table.Cell>
              <Table.Cell>{yesNo(row.enabled)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}
