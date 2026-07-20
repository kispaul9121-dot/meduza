import { Badge, Button, Checkbox, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { adminDelete, adminGet, adminPost, query } from "../_shared/api"
import { Field, TextAreaField } from "../_shared/form"
import { HelpAnnotation } from "../_shared/types"

type AnnotationsResponse = { annotations: HelpAnnotation[]; count: number }

const emptyAnnotation: Partial<HelpAnnotation> = {
  key: "",
  page: "configurator",
  target_type: "field",
  title: "",
  body: "",
  severity: "info",
  enabled: true,
}

const HelpAnnotationsPage = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ q: "", page: "", key: "", severity: "", source_doc_reference: "" })
  const [draft, setDraft] = useState<Partial<HelpAnnotation>>(emptyAnnotation)
  const { data } = useQuery({
    queryKey: ["sc-help-annotations", filters],
    queryFn: () => adminGet<AnnotationsResponse>(`/admin/server-configurator/help-annotations${query(filters)}`),
  })
  const save = useMutation({
    mutationFn: () => adminPost(draft.id ? `/admin/server-configurator/help-annotations/${draft.id}` : "/admin/server-configurator/help-annotations", draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sc-help-annotations"] })
      toast.success("Help annotation saved")
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => adminDelete(`/admin/server-configurator/help-annotations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sc-help-annotations"] }),
  })

  return (
    <div className="flex flex-col gap-y-4">
      <Heading>Help Annotations</Heading>
      <Container className="grid gap-3 lg:grid-cols-5">
        {Object.keys(filters).map((key) => <Field key={key} label={key} value={(filters as any)[key]} onChange={(next) => setFilters({ ...filters, [key]: next })} />)}
      </Container>
      <Container className="p-0">
        <Table><Table.Body>{data?.annotations.map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell><Text size="small" weight="plus">{item.title}</Text><Text size="small" className="text-ui-fg-subtle">{item.key}</Text></Table.Cell>
            <Table.Cell>{item.page}</Table.Cell>
            <Table.Cell><Badge color={item.severity === "warning" ? "orange" : "blue"}>{item.severity}</Badge></Table.Cell>
            <Table.Cell><Text size="small" className="text-ui-fg-subtle">{item.body}</Text></Table.Cell>
            <Table.Cell className="flex gap-2">
              <Button size="small" variant="secondary" onClick={() => setDraft(item)}>Edit</Button>
              <Button size="small" variant="secondary" onClick={() => setDraft({ ...item, enabled: !item.enabled })}>{item.enabled ? "Disable" : "Enable"}</Button>
              <Button size="small" variant="secondary" onClick={() => remove.mutate(item.id)}>Delete</Button>
            </Table.Cell>
          </Table.Row>
        ))}</Table.Body></Table>
      </Container>
      <Container className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center justify-between"><Heading level="h2">{draft.id ? "Edit Annotation" : "Create Annotation"}</Heading><Button size="small" onClick={() => setDraft(emptyAnnotation)}>New</Button></div>
          <div className="grid gap-3 lg:grid-cols-3">
            {["key", "page", "target_type", "component_type", "server_model_slug", "title", "severity", "source_doc_reference"].map((key) => (
              <Field key={key} label={key} value={(draft as any)[key] || ""} onChange={(next) => setDraft({ ...draft, [key]: next })} />
            ))}
          </div>
          <TextAreaField label="body / content" value={draft.body || ""} onChange={(next) => setDraft({ ...draft, body: next })} />
          <label className="flex items-center gap-x-2">
            <Checkbox checked={Boolean(draft.enabled)} onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked === true })} />
            enabled
          </label>
          <Button size="small" isLoading={save.isPending} onClick={() => save.mutate()}>Save Annotation</Button>
        </div>
        <Container>
          <Text size="small" weight="plus">{draft.title || "Popover preview"}</Text>
          <Text size="small" className="text-ui-fg-subtle">{draft.body || "Select or create an annotation to preview practical help text."}</Text>
        </Container>
      </Container>
    </div>
  )
}

export default HelpAnnotationsPage
