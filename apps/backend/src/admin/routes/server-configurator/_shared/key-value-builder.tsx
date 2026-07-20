import { Button, Input, Select, Text } from "@medusajs/ui"

export type MappingRow = { key: string; value: string; unit?: string; behavior?: string }

export function KeyValueBuilder({ label, description, value, onChange, behaviors }: { label: string; description: string; value: MappingRow[]; onChange: (value: MappingRow[]) => void; behaviors?: string[] }) {
  const update = (index: number, patch: Partial<MappingRow>) => onChange(value.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  return (
    <div className="flex flex-col gap-2 rounded-md border border-ui-border-base p-3">
      <div>
        <Text size="small" leading="compact" weight="plus">{label}</Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">{description}</Text>
      </div>
      {value.length === 0 ? <Text size="small" leading="compact" className="text-ui-fg-subtle">No rows configured.</Text> : value.map((row, index) => (
        <div key={`${index}-${row.key}`} className="grid gap-2 md:grid-cols-[1fr_1fr_120px_auto]">
          <Input aria-label={`${label} key ${index + 1}`} placeholder="resource or fact" value={row.key} onChange={(event) => update(index, { key: event.target.value })} />
          <Input aria-label={`${label} value ${index + 1}`} placeholder="value / quantity" value={row.value} onChange={(event) => update(index, { value: event.target.value })} />
          {behaviors ? (
            <Select value={row.behavior || behaviors[0]} onValueChange={(behavior) => update(index, { behavior })}><Select.Trigger><Select.Value /></Select.Trigger><Select.Content>{behaviors.map((item) => <Select.Item key={item} value={item}>{item}</Select.Item>)}</Select.Content></Select>
          ) : <Input aria-label={`${label} unit ${index + 1}`} placeholder="unit" value={row.unit || ""} onChange={(event) => update(index, { unit: event.target.value })} />}
          <Button size="small" variant="secondary" onClick={() => onChange(value.filter((_, rowIndex) => rowIndex !== index))}>Remove</Button>
        </div>
      ))}
      <Button size="small" variant="secondary" onClick={() => onChange([...value, { key: "", value: "" }])}>Add row</Button>
    </div>
  )
}

export function mappingObject(rows: MappingRow[]) {
  return Object.fromEntries(rows.filter((row) => row.key.trim()).map((row) => [row.key.trim(), Number.isFinite(Number(row.value)) && row.value !== "" ? Number(row.value) : row.value]))
}
