import { Badge, Button, Container, Heading, Select, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { adminGet, adminPost, joinList, splitList } from "../_shared/api"
import { Field } from "../_shared/form"
import { ComponentPack, ComponentRow } from "../_shared/types"

type ComponentsResponse = { components: ComponentRow[] }
type PreviewResponse = {
  server_models: { id: string; public_name: string; slug: string; brand: string; family: string; generation: string; chassis_type: string }[]
  component_packs: ComponentPack[]
  applicability: {
    component: ComponentRow
    applicability: Record<string, string[]>
    preview: { id: string; public_name: string; slug: string; chassis_type: string }[]
  }[]
}

const emptyApplicability = {
  brands: [],
  families: [],
  generations: [],
  server_model_slugs: [],
  chassis_types: [],
  exclude_server_model_slugs: [],
}

const ApplicabilityPage = () => {
  const queryClient = useQueryClient()
  const [componentId, setComponentId] = useState("")
  const [view, setView] = useState("component")
  const [search, setSearch] = useState("")
  const { data: components } = useQuery({
    queryKey: ["sc-components-select"],
    queryFn: () => adminGet<ComponentsResponse>("/admin/server-configurator/components?limit=500"),
  })
  const { data } = useQuery({
    queryKey: ["sc-applicability", componentId],
    queryFn: () => adminGet<PreviewResponse>(`/admin/server-configurator/applicability${componentId ? `?component_id=${componentId}` : ""}`),
  })
  const selected = data?.applicability[0]
  const [draft, setDraft] = useState<Record<string, string[]>>(emptyApplicability)
  useEffect(() => {
    setDraft(selected?.applicability || emptyApplicability)
  }, [selected?.component.id])
  const save = useMutation({
    mutationFn: () => adminPost(`/admin/server-configurator/components/${componentId}/applicability`, { applicability: draft }),
    onSuccess: (result: any) => {
      setDraft(result.component.specs_json?.applicability || emptyApplicability)
      queryClient.invalidateQueries({ queryKey: ["sc-applicability"] })
      toast.success("Applicability saved")
    },
  })
  const set = (key: string, next: string) => setDraft({ ...draft, [key]: splitList(next) })

  return (
    <div className="flex flex-col gap-y-4">
      <Heading>Component Applicability</Heading>
      <Container className="grid gap-3 lg:grid-cols-3">
        <Select value={view} onValueChange={setView}>
          <Select.Trigger><Select.Value /></Select.Trigger>
          <Select.Content>
            {["component", "server_model", "pack"].map((item) => <Select.Item key={item} value={item}>{item}</Select.Item>)}
          </Select.Content>
        </Select>
        <Field label="search" value={search} onChange={setSearch} />
      </Container>
      <Container className="flex flex-col gap-y-4">
        <Select value={componentId} onValueChange={(next) => { setComponentId(next); setDraft(emptyApplicability) }}>
          <Select.Trigger><Select.Value placeholder="Select component" /></Select.Trigger>
          <Select.Content>
            {(components?.components || []).map((component) => (
              <Select.Item key={component.id} value={component.id}>{component.type}: {component.public_name}</Select.Item>
            ))}
          </Select.Content>
        </Select>
        <div className="grid gap-3 lg:grid-cols-3">
          {Object.keys(emptyApplicability).map((key) => (
            <Field key={key} label={key} value={joinList((draft as any)[key])} onChange={(next) => set(key, next)} />
          ))}
        </div>
        <Button size="small" disabled={!componentId} isLoading={save.isPending} onClick={() => save.mutate()}>Save Applicability</Button>
      </Container>
      <Container className="p-0">
        <div className="px-6 py-4">
          <Text size="small" weight="plus">Dry-run preview</Text>
          <Text size="small" className="text-ui-fg-subtle">Shows server models where this component will be available in /options.</Text>
        </div>
        <Table>
          <Table.Body>
            {view === "pack" && data?.component_packs.filter((pack) => pack.name.toLowerCase().includes(search.toLowerCase())).map((pack) => (
              <Table.Row key={pack.id}>
                <Table.Cell>{pack.name}</Table.Cell>
                <Table.Cell>{pack.component_type}</Table.Cell>
                <Table.Cell><Badge color="blue">{pack.item_count || 0} items</Badge></Table.Cell>
              </Table.Row>
            ))}
            {view === "server_model" && data?.server_models.filter((model) => model.public_name.toLowerCase().includes(search.toLowerCase())).map((model) => (
              <Table.Row key={model.id}>
                <Table.Cell>{model.public_name}</Table.Cell>
                <Table.Cell>{model.slug}</Table.Cell>
                <Table.Cell><Badge color="blue">{model.chassis_type}</Badge></Table.Cell>
              </Table.Row>
            ))}
            {view === "component" && selected?.preview.map((model) => (
              <Table.Row key={model.id}>
                <Table.Cell>{model.public_name}</Table.Cell>
                <Table.Cell>{model.slug}</Table.Cell>
                <Table.Cell><Badge color="blue">{model.chassis_type}</Badge></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
    </div>
  )
}

export default ApplicabilityPage
