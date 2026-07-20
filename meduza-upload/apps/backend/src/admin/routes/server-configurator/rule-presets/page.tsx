import { Badge, Button, Checkbox, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { adminGet, adminPost, query } from "../_shared/api"
import { Field, RawPreview } from "../_shared/form"
import { RulePreset } from "../_shared/types"

type PresetsResponse = { presets: RulePreset[]; count: number }

const emptyPreset: Partial<RulePreset> = {
  name: "",
  category: "storage",
  description: "",
  conditions_template_json: { fact: "drive_interface", operator: "equals", value: "NVMe" },
  action_template_json: { warning: "Review storage path." },
  enabled: true,
}

const RulePresetsPage = () => {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState("")
  const [draft, setDraft] = useState<Partial<RulePreset>>(emptyPreset)
  const { data } = useQuery({
    queryKey: ["sc-rule-presets", category],
    queryFn: () => adminGet<PresetsResponse>(`/admin/server-configurator/rule-presets${query({ category })}`),
  })
  const save = useMutation({
    mutationFn: () => adminPost(draft.id ? `/admin/server-configurator/rule-presets/${draft.id}` : "/admin/server-configurator/rule-presets", draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sc-rule-presets"] })
      toast.success("Preset saved")
    },
  })
  const action = useMutation({
    mutationFn: ({ id, path }: { id: string; path: string }) => adminPost(`/admin/server-configurator/rule-presets/${id}/${path}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sc-rule-presets"] })
      toast.success("Preset action complete")
    },
  })

  return (
    <div className="flex flex-col gap-y-4">
      <Heading>Rule Presets</Heading>
      <Container><Field label="category filter" value={category} onChange={setCategory} /></Container>
      <Container className="p-0">
        <Table><Table.Body>{data?.presets.map((preset) => (
          <Table.Row key={preset.id}>
            <Table.Cell><Text size="small" weight="plus">{preset.name}</Text><Text size="small" className="text-ui-fg-subtle">{preset.description}</Text></Table.Cell>
            <Table.Cell>{preset.category}</Table.Cell>
            <Table.Cell><Badge color={preset.enabled ? "green" : "grey"}>{preset.enabled ? "enabled" : "disabled"}</Badge></Table.Cell>
            <Table.Cell className="flex gap-2">
              <Button size="small" variant="secondary" onClick={() => setDraft(preset)}>Edit</Button>
              <Button size="small" variant="secondary" onClick={() => action.mutate({ id: preset.id, path: "duplicate" })}>Duplicate</Button>
              <Button size="small" variant="secondary" onClick={() => action.mutate({ id: preset.id, path: "create-rule" })}>Use Preset</Button>
            </Table.Cell>
          </Table.Row>
        ))}</Table.Body></Table>
      </Container>
      <Container className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between"><Heading level="h2">{draft.id ? "Edit Preset" : "Create Preset"}</Heading><Button size="small" onClick={() => setDraft(emptyPreset)}>New</Button></div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Field label="name" value={draft.name || ""} onChange={(next) => setDraft({ ...draft, name: next })} />
          <Field label="category" value={draft.category || ""} onChange={(next) => setDraft({ ...draft, category: next })} />
          <Field label="description" value={draft.description || ""} onChange={(next) => setDraft({ ...draft, description: next })} />
          <label className="flex items-center gap-x-2">
            <Checkbox checked={Boolean(draft.enabled)} onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked === true })} />
            enabled
          </label>
        </div>
        <RawPreview value={{ conditions_template_json: draft.conditions_template_json, action_template_json: draft.action_template_json }} />
        <Button size="small" isLoading={save.isPending} onClick={() => save.mutate()}>Save Preset</Button>
      </Container>
    </div>
  )
}

export default RulePresetsPage
