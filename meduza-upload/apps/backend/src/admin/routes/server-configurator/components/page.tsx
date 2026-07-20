import { Badge, Button, Checkbox, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { adminGet, adminPost, numberValue, query } from "../_shared/api"
import { Field, SelectField } from "../_shared/form"
import { ComponentPack, ComponentRow } from "../_shared/types"
import { SpecsEditor } from "./specs-editor"

type ComponentsResponse = { components: ComponentRow[]; count: number }
type PacksResponse = { component_packs: ComponentPack[]; count: number }

const componentTypes = ["cpu", "ram", "drive", "raid", "nic", "psu", "riser", "backplane", "rails", "cable", "cooling", "license", "service"]
const emptyComponent: Partial<ComponentRow> = {
  type: "cpu",
  brand: "HPE",
  model: "",
  public_name: "",
  short_name: "",
  specs_json: {},
  price: 0,
  cost: 0,
  stock_qty: 0,
  enabled: false,
}

function ComponentForm({ value, onChange }: { value: Partial<ComponentRow>; onChange: (value: Partial<ComponentRow>) => void }) {
  const set = (key: keyof ComponentRow, next: any) => onChange({ ...value, [key]: next })
  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <SelectField label="type" value={value.type || "cpu"} options={componentTypes} onChange={(next) => set("type", next)} />
        {["brand", "model", "part_number", "public_name", "short_name", "medusa_product_variant_id"].map((key) => (
          <Field key={key} label={key} value={(value as any)[key] || ""} onChange={(next) => set(key as keyof ComponentRow, next)} />
        ))}
        {["price", "cost", "stock_qty"].map((key) => (
          <Field key={key} type="number" label={key} value={(value as any)[key] || 0} onChange={(next) => set(key as keyof ComponentRow, numberValue(next))} />
        ))}
        <label className="flex items-center gap-x-2">
          <Checkbox checked={Boolean(value.enabled)} onCheckedChange={(checked) => set("enabled", checked === true)} />
          enabled
        </label>
      </div>
      <SpecsEditor type={value.type || "cpu"} value={value.specs_json || {}} onChange={(next) => set("specs_json", next)} />
    </div>
  )
}

const ComponentsPage = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ q: "", type: "", brand: "", xeon_scalable_generation: "", socket: "", cores_min: "", tdp_w_max: "", max_memory_speed_mhz: "", suffix: "", needs_review: "", logical_group: "", vendor_platform: "", slot_type: "", interface: "", form_factor: "" })
  const [draft, setDraft] = useState<Partial<ComponentRow>>(emptyComponent)
  const [packId, setPackId] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["sc-components", filters],
    queryFn: () => adminGet<ComponentsResponse>(`/admin/server-configurator/components${query(filters)}`),
  })
  const { data: packs } = useQuery({
    queryKey: ["sc-component-packs-for-components", draft.type],
    queryFn: () => adminGet<PacksResponse>(`/admin/server-configurator/component-packs${query({ component_type: draft.type || "" })}`),
  })
  const save = useMutation({
    mutationFn: () => adminPost(draft.id ? `/admin/server-configurator/components/${draft.id}` : "/admin/server-configurator/components", draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sc-components"] })
      toast.success("Component saved")
    },
  })
  const action = useMutation({
    mutationFn: ({ id, path, body }: { id: string; path?: string; body?: unknown }) =>
      adminPost(`/admin/server-configurator/components/${id}${path ? `/${path}` : ""}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sc-components"] }),
  })
  const addToPack = useMutation({
    mutationFn: () => adminPost(`/admin/server-configurator/component-packs/${packId}/items`, { component_id: draft.id }),
    onSuccess: () => toast.success("Added to pack"),
  })

  return (
    <div className="flex flex-col gap-y-4">
      <Heading>Components</Heading>
      <div className="flex flex-wrap gap-2">
        {componentTypes.map((type) => (
          <Button key={type} size="small" variant={filters.type === type ? "primary" : "secondary"} onClick={() => setFilters({ ...filters, type })}>{type}</Button>
        ))}
      </div>
      <Container className="grid gap-3 lg:grid-cols-4">
        {Object.keys(filters).map((key) => (
          <Field key={key} label={key} value={(filters as any)[key]} onChange={(next) => setFilters({ ...filters, [key]: next })} />
        ))}
      </Container>
      <Container className="p-0">
        <Table>
          <Table.Body>
            {isLoading && <Table.Row><Table.Cell>Loading</Table.Cell></Table.Row>}
            {data?.components.map((component) => (
              <Table.Row key={component.id}>
                <Table.Cell><Text size="small" weight="plus">{component.public_name}</Text><Text size="small" className="text-ui-fg-subtle">{component.part_number || component.model}</Text></Table.Cell>
                <Table.Cell>{component.type}</Table.Cell>
                <Table.Cell>{component.brand}</Table.Cell>
                <Table.Cell><Badge color={component.enabled ? "green" : "grey"}>{component.enabled ? "enabled" : "disabled"}</Badge></Table.Cell>
                <Table.Cell className="flex gap-2">
                  <Button size="small" variant="secondary" onClick={() => setDraft(component)}>Edit</Button>
                  <Button size="small" variant="secondary" onClick={() => action.mutate({ id: component.id, path: "duplicate" })}>Duplicate</Button>
                  <Button size="small" variant="secondary" onClick={() => action.mutate({ id: component.id, body: { enabled: !component.enabled } })}>{component.enabled ? "Disable" : "Enable"}</Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
      <Container className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between"><Heading level="h2">{draft.id ? "Edit Component" : "Create Component"}</Heading><Button size="small" onClick={() => setDraft(emptyComponent)}>New</Button></div>
        <ComponentForm value={draft} onChange={setDraft} />
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <SelectField label="Add to Pack" value={packId} options={(packs?.component_packs || []).map((pack) => pack.id)} onChange={setPackId} />
          <Button size="small" variant="secondary" disabled={!draft.id || !packId} onClick={() => addToPack.mutate()}>Add to Pack</Button>
        </div>
        <Button size="small" isLoading={save.isPending} onClick={() => save.mutate()}>Save Component</Button>
      </Container>
    </div>
  )
}

export default ComponentsPage
