import { Container, Heading, Input, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { listImportAnnotations } from "./api"
import { truncate, yesNo } from "./format"

export function AnnotationsTable() {
  const [search, setSearch] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["import-review", "annotations", search],
    queryFn: () => listImportAnnotations({ q: search, limit: "150" }),
  })

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Help Annotations</Heading>
          <Text size="small" className="text-ui-fg-subtle">Imported contextual hints and diagnostics.</Text>
        </div>
        <Input placeholder="Search annotations" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Table>
        <Table.Header><Table.Row>{["page", "key", "title", "body", "enabled", "source"].map((h) => <Table.HeaderCell key={h}>{h}</Table.HeaderCell>)}</Table.Row></Table.Header>
        <Table.Body>
          {isLoading ? <Table.Row><Table.Cell colSpan={6}>Loading</Table.Cell></Table.Row> : data?.annotations.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell>{row.page}</Table.Cell>
              <Table.Cell>{truncate(row.key, 34)}</Table.Cell>
              <Table.Cell>{truncate(row.title, 40)}</Table.Cell>
              <Table.Cell>{truncate(row.body, 62)}</Table.Cell>
              <Table.Cell>{yesNo(row.enabled)}</Table.Cell>
              <Table.Cell>{truncate(row.source_doc_reference, 46)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}
