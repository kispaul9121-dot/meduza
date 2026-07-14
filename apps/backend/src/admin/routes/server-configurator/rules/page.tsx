import { Badge, Button, Checkbox, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { adminGet, adminPost, numberValue, query } from "../_shared/api"
import { Field, RawPreview, SelectField } from "../_shared/form"
import { RuleRow } from "../_shared/types"

type RulesResponse = { rules: RuleRow[]; count: number }

const operators = ["equals", "not_equals", "greater_than", "less_than", "includes", "not_includes", "exists", "not_exists"]
const actionTypes = ["block", "warning", "require", "auto_add", "set_limit", "set_effective_value", "add_price", "multiply_price"]
const draftConfirmation = "This rule was imported from Payloud 2 as a draft. It may use legacy facts/operators. Enable only after it was normalized and tested in Rule Simulator."
const scopes = ["global", "brand", "generation", "family", "server_model", "chassis_variant", "component"]
const categories = ["cpu", "ram", "storage", "raid", "nic", "psu", "riser", "cooling", "backplane"]

const emptyRule: Partial<RuleRow> = {
  name: "",
  enabled: false,
  priority: 100,
  scope_type: "global",
  category: "storage",
  rule_type: "warning",
  conditions_json: { fact: "cpu_qty", operator: "equals", value: 1 },
  action_json: { warning: "Review configuration." },
  message: "",
  version: "1",
}

function isImportedDraft(rule: Partial<RuleRow>) {
  const text = [rule.admin_note, rule.source_doc_reference].filter(Boolean).join(" ").toLowerCase()
  return !rule.enabled && (text.includes("imported from payloud 2 as draft") || text.includes("pauloud 2"))
}

function RuleForm({ value, onChange }: { value: Partial<RuleRow>; onChange: (value: Partial<RuleRow>) => void }) {
  const condition = value.conditions_json || {}
  const action = value.action_json || {}
  const set = (key: keyof RuleRow, next: any) => onChange({ ...value, [key]: next })
  const setCondition = (key: string, next: any) => set("conditions_json", { ...condition, [key]: next })
  const setActionType = (next: string) => {
    const payload = next === "set_limit" ? { set_limit: { fact: "ram_modules", max: 12 } } : { [next]: next === "warning" ? "Review configuration." : "" }
    onChange({ ...value, rule_type: ["block", "warning", "require", "auto_add"].includes(next) ? next : "limit", action_json: payload })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid gap-3 lg:grid-cols-4">
        <Field label="name" value={value.name || ""} onChange={(next) => set("name", next)} />
        <SelectField label="scope_type" value={value.scope_type || "global"} options={scopes} onChange={(next) => set("scope_type", next)} />
        <Field label="scope_value" value={value.scope_value || ""} onChange={(next) => set("scope_value", next)} />
        <SelectField label="category" value={value.category || "storage"} options={categories} onChange={(next) => set("category", next)} />
        <Field type="number" label="priority" value={value.priority || 100} onChange={(next) => set("priority", numberValue(next, 100))} />
        <Field label="message" value={value.message || ""} onChange={(next) => set("message", next)} />
        <Field label="source_doc_reference" value={value.source_doc_reference || ""} onChange={(next) => set("source_doc_reference", next)} />
        <label className="flex items-center gap-x-2">
          <Checkbox checked={Boolean(value.enabled)} onCheckedChange={(checked) => set("enabled", checked === true)} />
          enabled
        </label>
      </div>
      <Container className="grid gap-3 lg:grid-cols-3">
        <Text size="small" weight="plus">IF</Text>
        <Field label="fact" value={condition.fact || ""} onChange={(next) => setCondition("fact", next)} />
        <SelectField label="operator" value={condition.operator || "equals"} options={operators} onChange={(next) => setCondition("operator", next)} />
        <Field label="value" value={condition.value || ""} onChange={(next) => setCondition("value", next)} />
      </Container>
      <Container className="grid gap-3 lg:grid-cols-3">
        <Text size="small" weight="plus">THEN</Text>
        <SelectField label="action type" value={Object.keys(action)[0] || "warning"} options={actionTypes} onChange={setActionType} />
        <RawPreview value={{ conditions_json: value.conditions_json, action_json: value.action_json }} />
      </Container>
    </div>
  )
}

const RulesPage = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ enabled: "", draft: "", category: "", rule_type: "", scope_type: "" })
  const [draft, setDraft] = useState<Partial<RuleRow>>(emptyRule)
  const { data } = useQuery({
    queryKey: ["sc-rules", filters],
    queryFn: () => adminGet<RulesResponse>(`/admin/server-configurator/rules${query(filters)}`),
  })
  const save = useMutation({
    mutationFn: () => adminPost(draft.id ? `/admin/server-configurator/rules/${draft.id}` : "/admin/server-configurator/rules", draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sc-rules"] })
      toast.success("Rule saved")
    },
  })
  const action = useMutation({
    mutationFn: ({ id, path, body }: { id: string; path?: string; body?: unknown }) =>
      adminPost(`/admin/server-configurator/rules/${id}${path ? `/${path}` : ""}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sc-rules"] }),
  })

  return (
    <div className="flex flex-col gap-y-4">
      <Heading>Compatibility Rules</Heading>
      <Container className="grid gap-3 lg:grid-cols-5">
        {Object.keys(filters).map((key) => <Field key={key} label={key} value={(filters as any)[key]} onChange={(next) => setFilters({ ...filters, [key]: next })} />)}
      </Container>
      <Container className="p-0">
        <Table><Table.Body>{data?.rules.map((rule) => (
          <Table.Row key={rule.id}>
            <Table.Cell><Text size="small" weight="plus">{rule.name}</Text><Text size="small" className="text-ui-fg-subtle">{rule.message}</Text></Table.Cell>
            <Table.Cell>{rule.scope_type}:{rule.scope_value}</Table.Cell>
            <Table.Cell>{rule.category}/{rule.rule_type}</Table.Cell>
            <Table.Cell><Badge color={rule.enabled ? "green" : "grey"}>{rule.enabled ? "enabled" : "draft"}</Badge></Table.Cell>
            <Table.Cell className="flex gap-2">
              <Button size="small" variant="secondary" onClick={() => setDraft(rule)}>Edit</Button>
              <Button size="small" variant="secondary" onClick={() => action.mutate({ id: rule.id, path: "duplicate" })}>Duplicate</Button>
              <Button size="small" variant="secondary" onClick={() => action.mutate({ id: rule.id, path: "review" })}>Reviewed</Button>
              <Button size="small" variant="secondary" onClick={() => {
                if (isImportedDraft(rule) && !window.confirm(draftConfirmation)) return
                if (isImportedDraft(rule)) return action.mutate({ id: rule.id, path: "enable-with-confirmation", body: { confirmation: draftConfirmation } })
                action.mutate({ id: rule.id, body: { enabled: !rule.enabled } })
              }}>{rule.enabled ? "Disable" : "Enable"}</Button>
            </Table.Cell>
          </Table.Row>
        ))}</Table.Body></Table>
      </Container>
      <Container className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between"><Heading level="h2">{draft.id ? "Edit Rule" : "Create Rule"}</Heading><Button size="small" onClick={() => setDraft(emptyRule)}>New</Button></div>
        <RuleForm value={draft} onChange={setDraft} />
        <Button size="small" isLoading={save.isPending} onClick={() => save.mutate()}>Save Rule</Button>
      </Container>
    </div>
  )
}

export default RulesPage
