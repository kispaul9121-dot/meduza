import { Badge, Container, Heading, Input, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { listImportComponents } from "./api"
import { logicalType, spec, truncate, yesNo } from "./format"

const types = ["all", "cpu", "ram", "drive", "raid", "nic", "psu", "backplane", "media_bay", "riser", "cooling", "gpu"]

export function ComponentsTable() {
  const [type, setType] = useState("all")
  const [search, setSearch] = useState("")
  const [hasWarnings, setHasWarnings] = useState("all")
  const { data, isLoading } = useQuery({
    queryKey: ["import-review", "components", type, search, hasWarnings],
    queryFn: () => listImportComponents({ type: type === "all" ? "" : type, q: search, has_warnings: hasWarnings === "all" ? "" : hasWarnings, limit: "150" }),
  })

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Components</Heading>
          <Text size="small" className="text-ui-fg-subtle">Imported Payloud components with provenance and logical Media Bay grouping.</Text>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search name/model/part" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={type} onValueChange={setType}>
            <Select.Trigger className="w-[150px]"><Select.Value placeholder="Type" /></Select.Trigger>
            <Select.Content>{types.map((item) => <Select.Item value={item} key={item}>{item || "all"}</Select.Item>)}</Select.Content>
          </Select>
          <Select value={hasWarnings} onValueChange={setHasWarnings}>
            <Select.Trigger className="w-[145px]"><Select.Value placeholder="Warnings" /></Select.Trigger>
            <Select.Content>
              <Select.Item value="all">all</Select.Item>
              <Select.Item value="true">has warnings</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            {["type", "public_name", "brand", "part_number", "enabled", "source_file", "source_price", "hints", "warnings", "notes"].map((head) => <Table.HeaderCell key={head}>{head}</Table.HeaderCell>)}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading ? <Table.Row><Table.Cell colSpan={10}>Loading</Table.Cell></Table.Row> : data?.components.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell><Badge>{logicalType(row)}</Badge></Table.Cell>
              <Table.Cell><Text size="small" weight="plus">{truncate(row.public_name, 48)}</Text><Text size="small" className="text-ui-fg-subtle">{truncate(row.short_name, 42)}</Text></Table.Cell>
              <Table.Cell>{row.brand}</Table.Cell>
              <Table.Cell>{row.part_number || "-"}</Table.Cell>
              <Table.Cell>{yesNo(row.enabled)}</Table.Cell>
              <Table.Cell>{truncate(spec(row, "source_file"), 42)}</Table.Cell>
              <Table.Cell>{String(spec(row, "source_price") ?? "-")} {spec(row, "source_price_currency") || ""}</Table.Cell>
              <Table.Cell>{yesNo(spec(row, "applicability_hints"))}</Table.Cell>
              <Table.Cell>{yesNo(spec(row, "warnings"))}</Table.Cell>
              <Table.Cell>{yesNo(spec(row, "notes"))}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}
