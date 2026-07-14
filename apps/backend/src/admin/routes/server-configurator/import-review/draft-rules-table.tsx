import { Badge, Button, Container, FocusModal, Heading, Input, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { enableRuleWithConfirmation, listDraftRules, markRuleReviewed } from "./api"
import { prettyJson, truncate, yesNo } from "./format"
import { DraftRuleRow } from "./types"

const confirmation = "This rule was imported from Payloud 2 as a draft. It may use legacy facts/operators. Enable only after it was normalized and tested in Rule Simulator."

export function DraftRulesTable() {
  const [search, setSearch] = useState("")
  const [viewRule, setViewRule] = useState<DraftRuleRow | null>(null)
  const [enableRule, setEnableRule] = useState<DraftRuleRow | null>(null)
  const [typed, setTyped] = useState("")
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["import-review", "draft-rules", search], queryFn: () => listDraftRules({ q: search, limit: "150" }) })
  const reviewed = useMutation({ mutationFn: markRuleReviewed, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["import-review", "draft-rules"] }) })
  const enable = useMutation({
    mutationFn: () => enableRuleWithConfirmation(enableRule!.id, typed),
    onSuccess: () => {
      toast.success("Rule enabled after confirmation")
      setEnableRule(null)
      setTyped("")
      queryClient.invalidateQueries({ queryKey: ["import-review", "draft-rules"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div><Heading level="h2">Draft Rules</Heading><Text size="small" className="text-ui-fg-subtle">Imported rules stay disabled until normalized and confirmed.</Text></div>
        <Input placeholder="Search draft rules" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Table>
        <Table.Header><Table.Row>{["name", "category", "type", "scope", "enabled", "legacy", "message", "actions"].map((h) => <Table.HeaderCell key={h}>{h}</Table.HeaderCell>)}</Table.Row></Table.Header>
        <Table.Body>
          {isLoading ? <Table.Row><Table.Cell colSpan={8}>Loading</Table.Cell></Table.Row> : data?.rules.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell>{truncate(row.name, 44)}</Table.Cell>
              <Table.Cell><Badge>{row.category}</Badge></Table.Cell>
              <Table.Cell>{row.rule_type}</Table.Cell>
              <Table.Cell>{row.scope_type}{row.scope_value ? ` / ${row.scope_value}` : ""}</Table.Cell>
              <Table.Cell>{yesNo(row.enabled)}</Table.Cell>
              <Table.Cell>{row.action_json?.draft ? "needs normalization" : "review"}</Table.Cell>
              <Table.Cell>{truncate(row.message, 56)}</Table.Cell>
              <Table.Cell><div className="flex gap-1"><Button size="small" variant="secondary" onClick={() => setViewRule(row)}>View</Button><Button size="small" variant="secondary" onClick={() => reviewed.mutate(row.id)}>Reviewed</Button><Button size="small" variant="danger" onClick={() => setEnableRule(row)}>Enable</Button></div></Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <FocusModal open={Boolean(viewRule)} onOpenChange={() => setViewRule(null)}>
        <FocusModal.Content><FocusModal.Header /><FocusModal.Body className="p-6"><Heading>{viewRule?.name}</Heading><pre className="mt-4 overflow-auto rounded-md bg-ui-bg-subtle p-4 text-ui-fg-base">{prettyJson({ conditions_json: viewRule?.conditions_json, action_json: viewRule?.action_json })}</pre></FocusModal.Body></FocusModal.Content>
      </FocusModal>
      <FocusModal open={Boolean(enableRule)} onOpenChange={() => setEnableRule(null)}>
        <FocusModal.Content><FocusModal.Header /><FocusModal.Body className="p-6"><Heading>Enable draft rule</Heading><Text className="mt-2 text-ui-fg-subtle">{confirmation}</Text><Textarea className="mt-4" rows={4} value={typed} onChange={(e) => setTyped(e.target.value)} /><Button className="mt-4" size="small" variant="danger" disabled={typed !== confirmation} isLoading={enable.isPending} onClick={() => enable.mutate()}>Enable after confirmation</Button></FocusModal.Body></FocusModal.Content>
      </FocusModal>
    </Container>
  )
}
