import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { getLegacyLogic } from "./api"

const colors = { ok: "green", partial: "orange", missing: "red", "needs review": "orange" } as const

export function LegacyLogicPanel() {
  const { data, isLoading } = useQuery({ queryKey: ["import-review", "legacy-logic"], queryFn: getLegacyLogic })

  if (isLoading) return <Container>Loading</Container>

  return (
    <div className="grid gap-4">
      {data?.sections.map((section) => (
        <Container className="p-0" key={section.key}>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Heading level="h2">{section.title}</Heading>
              <Text size="small" className="text-ui-fg-subtle">Sources: {section.source_files.join(", ")}</Text>
            </div>
            <Badge color={colors[section.status]}>{section.status}</Badge>
          </div>
          <div className="grid gap-4 border-t px-6 py-4 lg:grid-cols-4">
            <Block title="Payloud found" items={section.found} />
            <Block title="Current Medusa" items={section.current_medusa} />
            <Block title="Missing" items={section.missing} />
            <div>
              <Text size="small" leading="compact" weight="plus">Next action</Text>
              <Text size="small" className="text-ui-fg-subtle">{section.recommended_next_action}</Text>
              <Text size="small" className="mt-2 text-ui-fg-subtle">Imported count: {section.imported_count}</Text>
            </div>
          </div>
        </Container>
      ))}
      <Container>
        <Heading level="h2">Recommended Data Model Changes</Heading>
        <div className="mt-3 grid gap-2">
          {data?.recommended_data_model_changes.map((item) => (
            <Text size="small" key={item.change}>
              <span className="font-medium">{item.change}</span> - {item.why} Migration: {String(item.migration_required)}. Temporary specs_json: {String(item.temporary_specs_json_solution)}.
            </Text>
          ))}
        </div>
      </Container>
    </div>
  )
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <Text size="small" leading="compact" weight="plus">{title}</Text>
      <div className="mt-2 grid gap-1">
        {items.map((item) => <Text size="small" className="text-ui-fg-subtle" key={item}>{item}</Text>)}
      </div>
    </div>
  )
}
