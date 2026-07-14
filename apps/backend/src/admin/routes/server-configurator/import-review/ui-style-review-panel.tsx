import { Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { getUiStyleReview } from "./api"

export function UiStyleReviewPanel() {
  const { data, isLoading } = useQuery({ queryKey: ["import-review", "ui-style"], queryFn: getUiStyleReview })

  return (
    <Container className="p-0">
      <div className="px-6 py-4">
        <Heading level="h2">UI Style Review</Heading>
        <Text size="small" className="text-ui-fg-subtle">Payloud compact configurator style compared with the current Medusa storefront.</Text>
      </div>
      <Table>
        <Table.Header><Table.Row>{["area", "Payloud", "Current Medusa", "Recommendation"].map((h) => <Table.HeaderCell key={h}>{h}</Table.HeaderCell>)}</Table.Row></Table.Header>
        <Table.Body>
          {isLoading ? <Table.Row><Table.Cell colSpan={4}>Loading</Table.Cell></Table.Row> : data?.ui_style.map((row) => (
            <Table.Row key={row.area}>
              <Table.Cell>{row.area}</Table.Cell>
              <Table.Cell>{row.payloud}</Table.Cell>
              <Table.Cell>{row.medusa_current}</Table.Cell>
              <Table.Cell>{row.recommendation}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <div className="grid gap-2 border-t px-6 py-4">
        <Text size="small" weight="plus">CSS variables and components to adjust</Text>
        <Text size="small" className="text-ui-fg-subtle">Use `--server-primary`, `--server-line`, `server-option-row`, `server-summary-panel`, `server-summary-line`, and storage scenario classes in `apps/storefront/src/styles/globals.css`.</Text>
      </div>
    </Container>
  )
}
