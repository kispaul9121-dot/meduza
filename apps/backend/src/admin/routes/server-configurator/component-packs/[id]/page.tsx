import { Badge, Button, Container, Heading, Select, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { adminDelete, adminGet, adminPost, query, splitList } from "../../_shared/api"
import { Field, SelectField } from "../../_shared/form"
import { ComponentPack, ComponentPackItem } from "../../_shared/types"

type PackResponse = { component_pack: ComponentPack }
type ItemsResponse = { items: ComponentPackItem[]; count: number }
type PreviewResponse = {
  target_models?: any[]
  visible_components_by_model?: { slug: string; component_ids: string[] }[]
  conflicts?: { level: string; component_id: string; message: string }[]
}

const targetScopes = ["brand", "generation", "family", "server_model", "chassis_type", "global"]

const PackDetailPage = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ brand: "", model_text: "", xeon_scalable_generation: "", platform_generation: "", socket: "", tdp_w_max: "", max_memory_speed_mhz: "" })
  const [target, setTarget] = useState({ target_scope: "generation", target_values: "Gen10", mode: "merge" })
  const [componentId, setComponentId] = useState("")
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const { data: packData } = useQuery({
    queryKey: ["sc-component-pack", id],
    queryFn: () => adminGet<PackResponse>(`/admin/server-configurator/component-packs/${id}`),
    enabled: Boolean(id),
  })
  const { data: itemsData } = useQuery({
    queryKey: ["sc-component-pack-items", id],
    queryFn: () => adminGet<ItemsResponse>(`/admin/server-configurator/component-packs/${id}/items`),
    enabled: Boolean(id),
  })
  const { data: componentOptions } = useQuery({
    queryKey: ["sc-pack-component-options", packData?.component_pack.component_type, filters],
    queryFn: () => adminGet<any>(`/admin/server-configurator/components${query({ type: packData?.component_pack.component_type || "", limit: 300, ...filters })}`),
    enabled: Boolean(packData?.component_pack.component_type),
  })
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sc-component-pack"] })
    queryClient.invalidateQueries({ queryKey: ["sc-component-pack-items"] })
  }
  const addOne = useMutation({
    mutationFn: () => adminPost(`/admin/server-configurator/component-packs/${id}/items`, { component_id: componentId }),
    onSuccess: () => { invalidate(); toast.success("Component added") },
  })
  const remove = useMutation({
    mutationFn: (itemId: string) => adminDelete(`/admin/server-configurator/component-packs/${id}/items/${itemId}`),
    onSuccess: invalidate,
  })
  const bulkAdd = useMutation({
    mutationFn: () => adminPost(`/admin/server-configurator/component-packs/${id}/bulk-add-components`, { filters }),
    onSuccess: (result: any) => { invalidate(); toast.success(`Bulk added: ${result.added || 0}`) },
  })
  const previewMutation = useMutation({
    mutationFn: () => adminPost<PreviewResponse>(`/admin/server-configurator/component-packs/${id}/preview-applicability`, {
      target_scope: target.target_scope,
      target_values: splitList(target.target_values),
      mode: target.mode,
    }),
    onSuccess: setPreview,
  })
  const applyMutation = useMutation({
    mutationFn: () => adminPost(`/admin/server-configurator/component-packs/${id}/apply-applicability`, {
      target_scope: target.target_scope,
      target_values: splitList(target.target_values),
      mode: target.mode,
    }),
    onSuccess: () => toast.success("Applicability applied"),
  })
  const detachMutation = useMutation({
    mutationFn: () => adminPost(`/admin/server-configurator/component-packs/${id}/detach-applicability`, {}),
    onSuccess: () => toast.success("Applicability detached"),
  })
  const pack = packData?.component_pack

  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <Heading>{pack?.name || "Component Pack"}</Heading>
        <Text size="small" className="text-ui-fg-subtle">{pack?.slug}</Text>
      </div>
      <Container className="grid gap-3 lg:grid-cols-4">
        <Text size="small" weight="plus">Type: {pack?.component_type}</Text>
        <Text size="small">Items: {pack?.item_count || itemsData?.count || 0}</Text>
        <Badge color={pack?.enabled ? "green" : "grey"}>{pack?.enabled ? "enabled" : "disabled"}</Badge>
      </Container>
      <Container className="flex flex-col gap-y-4">
        <Heading level="h2">Items</Heading>
        <div className="grid gap-3 lg:grid-cols-4">
          {Object.keys(filters).map((key) => (
            <Field key={key} label={key} value={(filters as any)[key]} onChange={(next) => setFilters({ ...filters, [key]: next })} />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <Select value={componentId} onValueChange={setComponentId}>
            <Select.Trigger><Select.Value placeholder="Add one component" /></Select.Trigger>
            <Select.Content>
              {(componentOptions?.components || []).map((component: any) => (
                <Select.Item key={component.id} value={component.id}>{component.public_name}</Select.Item>
              ))}
            </Select.Content>
          </Select>
          <Button size="small" disabled={!componentId} onClick={() => addOne.mutate()}>Add</Button>
          <Button size="small" variant="secondary" onClick={() => bulkAdd.mutate()}>Bulk Add By Filters</Button>
        </div>
        <Table>
          <Table.Body>
            {itemsData?.items.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell><Text size="small" weight="plus">{item.component?.public_name || item.component_id}</Text></Table.Cell>
                <Table.Cell>{item.component?.brand}</Table.Cell>
                <Table.Cell>{item.component?.model}</Table.Cell>
                <Table.Cell><Button size="small" variant="secondary" onClick={() => remove.mutate(item.id)}>Remove</Button></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
      <Container className="flex flex-col gap-y-4">
        <Heading level="h2">Applicability</Heading>
        <div className="grid gap-3 lg:grid-cols-3">
          <SelectField label="target_scope" value={target.target_scope} options={targetScopes} onChange={(next) => setTarget({ ...target, target_scope: next })} />
          <Field label="target_values" value={target.target_values} onChange={(next) => setTarget({ ...target, target_values: next })} />
          <SelectField label="mode" value={target.mode} options={["merge", "replace"]} onChange={(next) => setTarget({ ...target, mode: next })} />
        </div>
        <div className="flex gap-2">
          <Button size="small" variant="secondary" onClick={() => previewMutation.mutate()}>Preview</Button>
          <Button size="small" onClick={() => applyMutation.mutate()}>Apply</Button>
          <Button size="small" variant="secondary" onClick={() => detachMutation.mutate()}>Detach</Button>
        </div>
        <Textarea readOnly value={JSON.stringify(preview || {}, null, 2)} rows={10} />
      </Container>
    </div>
  )
}

export default PackDetailPage
