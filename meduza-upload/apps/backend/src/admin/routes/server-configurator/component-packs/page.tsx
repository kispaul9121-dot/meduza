import { Badge, Button, Checkbox, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { adminGet, adminPost, joinList, query, splitList } from "../_shared/api"
import { Field, SelectField } from "../_shared/form"
import { ComponentPack } from "../_shared/types"

type PacksResponse = { component_packs: ComponentPack[]; count: number }

const componentTypes = ["cpu", "ram", "drive", "raid", "nic", "psu", "riser", "backplane", "rails", "cable", "cooling", "license", "service"]
const emptyPack: Partial<ComponentPack> = { name: "", component_type: "cpu", enabled: true, tags_json: [], brand_scope: [], family_scope: [], generation_scope: [], chassis_scope: [] }

function PackForm({ value, onChange }: { value: Partial<ComponentPack>; onChange: (value: Partial<ComponentPack>) => void }) {
  const set = (key: keyof ComponentPack, next: any) => onChange({ ...value, [key]: next })
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Field label="name" value={value.name || ""} onChange={(next) => set("name", next)} />
      <Field label="slug" value={value.slug || ""} onChange={(next) => set("slug", next)} />
      <SelectField label="component_type" value={value.component_type || "cpu"} options={componentTypes} onChange={(next) => set("component_type", next)} />
      <Field label="description" value={value.description || ""} onChange={(next) => set("description", next)} />
      <Field label="brand_scope" value={joinList(value.brand_scope)} onChange={(next) => set("brand_scope", splitList(next))} />
      <Field label="family_scope" value={joinList(value.family_scope)} onChange={(next) => set("family_scope", splitList(next))} />
      <Field label="generation_scope" value={joinList(value.generation_scope)} onChange={(next) => set("generation_scope", splitList(next))} />
      <Field label="chassis_scope" value={joinList(value.chassis_scope)} onChange={(next) => set("chassis_scope", splitList(next))} />
      <Field label="tags" value={joinList(value.tags_json)} onChange={(next) => set("tags_json", splitList(next))} />
      <label className="flex items-center gap-x-2">
        <Checkbox checked={Boolean(value.enabled)} onCheckedChange={(checked) => set("enabled", checked === true)} />
        <Text size="small">enabled</Text>
      </label>
    </div>
  )
}

const ComponentPacksPage = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ q: "", component_type: "", enabled: "", brand_scope: "", generation_scope: "", family_scope: "" })
  const [draft, setDraft] = useState<Partial<ComponentPack>>(emptyPack)
  const { data, isLoading } = useQuery({
    queryKey: ["sc-component-packs", filters],
    queryFn: () => adminGet<PacksResponse>(`/admin/server-configurator/component-packs${query(filters)}`),
  })
  const save = useMutation({
    mutationFn: () => adminPost(draft.id ? `/admin/server-configurator/component-packs/${draft.id}` : "/admin/server-configurator/component-packs", draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sc-component-packs"] })
      toast.success("Component pack saved")
      setDraft(emptyPack)
    },
  })
  const duplicate = useMutation({
    mutationFn: (id: string) => adminPost(`/admin/server-configurator/component-packs/${id}/duplicate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sc-component-packs"] }),
  })

  return (
    <div className="flex flex-col gap-y-4">
      <Heading>Component Packs</Heading>
      <Container className="grid gap-3 lg:grid-cols-6">
        {Object.keys(filters).map((key) => (
          <Field key={key} label={key} value={(filters as any)[key]} onChange={(next) => setFilters({ ...filters, [key]: next })} />
        ))}
      </Container>
      <Container className="p-0">
        <Table>
          <Table.Body>
            {isLoading && <Table.Row><Table.Cell>Loading</Table.Cell></Table.Row>}
            {data?.component_packs.map((pack) => (
              <Table.Row key={pack.id}>
                <Table.Cell>
                  <Link to={`/server-configurator/component-packs/${pack.id}`}>
                    <Text size="small" weight="plus">{pack.name}</Text>
                  </Link>
                  <Text size="small" className="text-ui-fg-subtle">{pack.slug}</Text>
                </Table.Cell>
                <Table.Cell>{pack.component_type}</Table.Cell>
                <Table.Cell>{pack.item_count || 0}</Table.Cell>
                <Table.Cell><Badge color={pack.enabled ? "green" : "grey"}>{pack.enabled ? "enabled" : "disabled"}</Badge></Table.Cell>
                <Table.Cell>{[joinList(pack.brand_scope), joinList(pack.generation_scope), joinList(pack.family_scope)].filter(Boolean).join(" / ")}</Table.Cell>
                <Table.Cell className="flex gap-2">
                  <Button size="small" variant="secondary" onClick={() => setDraft(pack)}>Edit</Button>
                  <Button size="small" variant="secondary" onClick={() => duplicate.mutate(pack.id)}>Duplicate</Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
      <Container className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <Heading level="h2">{draft.id ? "Edit Pack" : "Create Pack"}</Heading>
          <Button size="small" variant="secondary" onClick={() => setDraft(emptyPack)}>New</Button>
        </div>
        <PackForm value={draft} onChange={setDraft} />
        <Button size="small" isLoading={save.isPending} onClick={() => save.mutate()}>Save Pack</Button>
      </Container>
    </div>
  )
}

export default ComponentPacksPage
