import { Badge, Button, Container, Heading, Input, Select, Text } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { adminGet, adminPost, numberValue } from "../_shared/api"
import { ComponentRow, ServerModel } from "../_shared/types"

type ModelsResponse = { models: ServerModel[] }
type OptionsResponse = { options: ComponentRow[]; groups?: { key: string; options: ComponentRow[] }[]; source: string }

const groupTypes = ["cpu", "cooling", "ram", "backplane", "media_bay", "drive", "raid", "nic", "psu", "riser", "rails", "cable", "service"]

function optionLabel(item?: ComponentRow) {
  return item ? `${item.type}: ${item.public_name}` : "None"
}

const SimulatorPage = () => {
  const [modelSlug, setModelSlug] = useState("hpe-proliant-dl360-gen10-8sff")
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [qty, setQty] = useState<Record<string, number>>({ cpu: 1, ram: 1, drive: 1, nic: 1, psu: 1 })
  const [result, setResult] = useState<any>(null)
  const { data: models } = useQuery({
    queryKey: ["sc-simulator-models"],
    queryFn: () => adminGet<ModelsResponse>("/admin/server-configurator/models?enabled=true&limit=100"),
  })
  const { data: options } = useQuery({
    queryKey: ["sc-simulator-options", modelSlug],
    queryFn: () => adminGet<OptionsResponse>(`/store/server-configurator/models/${modelSlug}/options`),
  })
  const grouped = useMemo(() => {
    const byType: Record<string, ComponentRow[]> = {}
    ;(options?.options || []).forEach((item) => {
      const key = item.type === "backplane" && item.specs_json?.logical_group === "media_bay" ? "media_bay" : item.type
      byType[key] = byType[key] || []
      byType[key].push(item)
    })
    return byType
  }, [options?.options])
  const payload = useMemo(() => ({
    server_model_slug: modelSlug,
    selected_components: Object.entries(selected)
      .filter(([, id]) => Boolean(id))
      .map(([key, id]) => ({ component_id: id, quantity: qty[key] || 1 })),
  }), [modelSlug, qty, selected])
  const simulate = useMutation({
    mutationFn: () => adminPost("/admin/server-configurator/simulate", payload),
    onSuccess: setResult,
  })

  return (
    <div className="flex flex-col gap-y-4">
      <Heading>Rule Simulator</Heading>
      <Container className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="flex flex-col gap-y-3">
          <Select value={modelSlug} onValueChange={(next) => { setModelSlug(next); setSelected({}); setResult(null) }}>
            <Select.Trigger><Select.Value /></Select.Trigger>
            <Select.Content>{models?.models.map((model) => <Select.Item key={model.id} value={model.slug}>{model.public_name}</Select.Item>)}</Select.Content>
          </Select>
          {groupTypes.map((type) => (
            <div key={type} className="grid grid-cols-[1fr_80px] gap-2">
              <Select value={selected[type] || "__none"} onValueChange={(id) => setSelected({ ...selected, [type]: id === "__none" ? "" : id })}>
                <Select.Trigger><Select.Value placeholder={type} /></Select.Trigger>
                <Select.Content>
                  <Select.Item value="__none">None</Select.Item>
                  {(grouped[type] || []).map((item) => <Select.Item key={item.id} value={item.id}>{optionLabel(item)}</Select.Item>)}
                </Select.Content>
              </Select>
              <Input type="number" value={qty[type] || 1} onChange={(event) => setQty({ ...qty, [type]: numberValue(event.target.value, 1) })} />
            </div>
          ))}
          <Button size="small" isLoading={simulate.isPending} onClick={() => simulate.mutate()}>Check Compatibility</Button>
          <Text size="small" className="text-ui-fg-subtle">Options source: {options?.source || "loading"}</Text>
        </div>
        <div className="flex flex-col gap-y-3">
          {result && <Badge color={result.valid ? "green" : "red"}>{result.valid ? "valid" : "invalid"}</Badge>}
          <pre className="max-h-[620px] overflow-auto rounded-md bg-ui-bg-subtle p-4 text-ui-fg-base">
            {JSON.stringify(result || { payload }, null, 2)}
          </pre>
        </div>
      </Container>
    </div>
  )
}

export default SimulatorPage
