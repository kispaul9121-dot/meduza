import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ServerStack } from "@medusajs/icons"
import { Badge, Button, Container, Drawer, FocusModal, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { adminDelete, adminGet, adminPost } from "../_shared/api"
import { Field, SelectField, TextAreaField } from "../_shared/form"

type ReadyRow = {
  id: string
  name: string
  slug: string
  description?: string | null
  use_case: string
  server_model_id: string
  status: "draft" | "published" | "unpublished" | "archived"
  price_mode: "fixed" | "from" | "request_quote"
  currency_code?: string | null
  total_price?: number | null
  featured: boolean
  sort_order: number
  current_version: number
  published_version?: number | null
  stale: boolean
  stale_reasons_json?: string[]
}

type ReadyVersion = {
  id: string
  version: number
  status: string
  snapshot_hash: string
  engine_version: string
  snapshot_json: Record<string, any>
  validation_errors_json: string[]
  validation_warnings_json: string[]
}

type ReadyList = { ready_configurations: ReadyRow[]; count: number }
type ReadyDetail = { ready_configuration: ReadyRow; versions: ReadyVersion[] }

const Spinner = () => <Text size="small">Loading…</Text>

const emptyDraft = {
  name: "",
  slug: "",
  description: "",
  use_case: "general",
  server_model_id: "",
  source_configuration_id: "",
  price_mode: "request_quote",
  currency_code: "",
  total_price: "",
  selected_json: "[]",
  explicit_none: "",
  created_from: "manual",
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ready configuration action failed"
}

function parseDraft(draft: typeof emptyDraft) {
  const selected = JSON.parse(draft.selected_json || "[]")
  if (!Array.isArray(selected)) throw new Error("selected_json must be an array")
  return {
    name: draft.name,
    slug: draft.slug,
    description: draft.description || null,
    use_case: draft.use_case,
    server_model_id: draft.server_model_id || undefined,
    source_configuration_id: draft.source_configuration_id || undefined,
    price_mode: draft.price_mode,
    currency_code: draft.currency_code || null,
    total_price: draft.total_price === "" ? null : Number(draft.total_price),
    selected_components: selected,
    explicit_none: draft.explicit_none.split(",").map((item) => item.trim()).filter(Boolean),
    created_from: draft.created_from,
  }
}

function statusColor(status: ReadyRow["status"]) {
  if (status === "published") return "green" as const
  if (status === "archived") return "grey" as const
  if (status === "unpublished") return "orange" as const
  return "blue" as const
}

const ReadyConfigurationsPage = () => {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<ReadyRow | null>(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [leftVersion, setLeftVersion] = useState("")
  const [rightVersion, setRightVersion] = useState("")
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ready-configurations"],
    queryFn: () => adminGet<ReadyList>("/admin/server-configurator/ready-configurations?limit=200"),
  })
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["ready-configuration", selected?.id],
    queryFn: () => adminGet<ReadyDetail>(`/admin/server-configurator/ready-configurations/${selected?.id}`),
    enabled: Boolean(selected?.id),
  })
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ready-configurations"] })
    if (selected?.id) queryClient.invalidateQueries({ queryKey: ["ready-configuration", selected.id] })
  }
  const create = useMutation({
    mutationFn: () => adminPost("/admin/server-configurator/ready-configurations", parseDraft(draft)),
    onSuccess: () => {
      invalidate()
      setCreateOpen(false)
      setDraft(emptyDraft)
      toast.success("Ready configuration created")
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const action = useMutation({
    mutationFn: ({ row, action, body }: { row: ReadyRow; action: string; body?: unknown }) =>
      adminPost(`/admin/server-configurator/ready-configurations/${row.id}/${action}`, body || {}),
    onSuccess: () => {
      invalidate()
      toast.success("Ready configuration updated")
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const archive = useMutation({
    mutationFn: (id: string) => adminDelete(`/admin/server-configurator/ready-configurations/${id}`),
    onSuccess: () => {
      invalidate()
      setSelected(null)
      toast.success("Ready configuration archived")
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const reorder = useMutation({
    mutationFn: (rows: ReadyRow[]) => adminPost("/admin/server-configurator/ready-configurations/reorder", {
      items: rows.map((row, index) => ({ id: row.id, sort_order: (index + 1) * 10 })),
    }),
    onSuccess: invalidate,
  })
  const rows = data?.ready_configurations || []
  const move = (id: string, direction: -1 | 1) => {
    const index = rows.findIndex((row) => row.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= rows.length) return
    const next = [...rows]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    reorder.mutate(next)
  }
  const versionOptions = (detail?.versions || []).map((version) => String(version.version))
  const left = detail?.versions.find((version) => String(version.version) === (leftVersion || versionOptions[0]))
  const right = detail?.versions.find((version) => String(version.version) === (rightVersion || versionOptions[1] || versionOptions[0]))
  const diff = useMemo(() => ({
    left_hash: left?.snapshot_hash,
    right_hash: right?.snapshot_hash,
    same_snapshot: Boolean(left && right && left.snapshot_hash === right.snapshot_hash),
    left_effective_specs: left?.snapshot_json?.effective_specs,
    right_effective_specs: right?.snapshot_json?.effective_specs,
  }), [left, right])

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Heading>Ready Configurations</Heading>
          <Text size="small" className="text-ui-fg-subtle">Published presets are versioned independently from user Configuration records.</Text>
        </div>
        <Button size="small" onClick={() => setCreateOpen(true)}>Create preset</Button>
      </div>
      <Container className="p-0">
        {isLoading ? <div className="flex items-center gap-2 px-6 py-4"><Spinner /><Text size="small">Loading ready configurations</Text></div> : null}
        {isError ? <Text size="small" className="px-6 py-4 text-ui-fg-error">Failed to load ready configurations.</Text> : null}
        {!isLoading && !rows.length ? <Text size="small" className="px-6 py-4 text-ui-fg-subtle">No presets yet. Create one from simulator selections or a saved user configuration.</Text> : null}
        <Table>
          <Table.Body>
            {rows.map((row, index) => (
              <Table.Row key={row.id}>
                <Table.Cell><Text size="small" weight="plus">{row.name}</Text><Text size="small" className="text-ui-fg-subtle">/{row.slug} · {row.use_case}</Text></Table.Cell>
                <Table.Cell><Badge color={statusColor(row.status)}>{row.status}</Badge></Table.Cell>
                <Table.Cell><Badge color={row.stale ? "red" : "green"}>{row.stale ? "stale" : "current"}</Badge></Table.Cell>
                <Table.Cell><Text size="small">v{row.current_version}{row.published_version ? ` · published v${row.published_version}` : ""}</Text></Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-2">
                    <Button size="small" variant="secondary" onClick={() => setSelected(row)}>Inspect</Button>
                    <Button size="small" variant="secondary" disabled={action.isPending} onClick={() => action.mutate({ row, action: "validate" })}>Validate</Button>
                    <Button size="small" disabled={action.isPending} onClick={() => action.mutate({ row, action: "publish" })}>Publish</Button>
                    <Button size="small" variant="secondary" onClick={() => move(row.id, -1)} disabled={index === 0 || reorder.isPending}>Up</Button>
                    <Button size="small" variant="secondary" onClick={() => move(row.id, 1)} disabled={index === rows.length - 1 || reorder.isPending}>Down</Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>

      <FocusModal open={createOpen} onOpenChange={setCreateOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <FocusModal.Title>Create ready configuration</FocusModal.Title>
              <div className="flex gap-2"><FocusModal.Close asChild><Button size="small" variant="secondary" disabled={create.isPending}>Cancel</Button></FocusModal.Close><Button size="small" isLoading={create.isPending} onClick={() => create.mutate()}>Create and validate</Button></div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto p-6">
              <div className="mx-auto flex max-w-3xl flex-col gap-y-4">
                <div className="grid gap-3 lg:grid-cols-2">
                  {(["name", "slug", "use_case", "server_model_id", "source_configuration_id", "currency_code", "total_price"] as const).map((key) => <Field key={key} label={key} value={draft[key]} onChange={(value) => setDraft({ ...draft, [key]: value })} hint={key === "source_configuration_id" ? "Optional: clone selections from user Configuration" : undefined} />)}
                  <SelectField label="price_mode" value={draft.price_mode} options={["request_quote", "fixed", "from"]} onChange={(value) => setDraft({ ...draft, price_mode: value })} />
                  <SelectField label="created_from" value={draft.created_from} options={["manual", "simulator", "user_configuration"]} onChange={(value) => setDraft({ ...draft, created_from: value })} />
                  <Field label="explicit_none" value={draft.explicit_none} onChange={(value) => setDraft({ ...draft, explicit_none: value })} hint="Comma-separated option group keys" />
                </div>
                <TextAreaField label="description" value={draft.description} onChange={(value) => setDraft({ ...draft, description: value })} />
                <TextAreaField label="selected_components JSON" value={draft.selected_json} onChange={(value) => setDraft({ ...draft, selected_json: value })} rows={10} />
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>

      <Drawer open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <Drawer.Content>
          <Drawer.Header><Drawer.Title>{selected?.name || "Ready configuration"}</Drawer.Title></Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-4 overflow-auto p-4">
            {detailLoading ? <Spinner /> : null}
            {selected ? <div className="flex flex-wrap gap-2">
              <Button size="small" onClick={() => action.mutate({ row: selected, action: "revalidate" })}>Revalidate</Button>
              <Button size="small" variant="secondary" onClick={() => action.mutate({ row: selected, action: "refresh-staleness" })}>Refresh stale</Button>
              <Button size="small" variant="secondary" onClick={() => action.mutate({ row: selected, action: "duplicate", body: { name: `${selected.name} Copy`, slug: `${selected.slug}-copy` } })}>Duplicate</Button>
              {selected.status === "published" ? <Button size="small" variant="secondary" onClick={() => action.mutate({ row: selected, action: "unpublish" })}>Unpublish</Button> : null}
              <Button size="small" variant="danger" onClick={() => archive.mutate(selected.id)}>Archive</Button>
              {selected.status === "published" ? <a href={`/solutions/${selected.slug}`} target="_blank" rel="noreferrer"><Button size="small" variant="secondary">Storefront preview</Button></a> : null}
            </div> : null}
            <Container className="flex flex-col gap-3">
              <Text size="small" weight="plus">Version comparison</Text>
              {versionOptions.length ? <div className="grid gap-3 lg:grid-cols-2"><SelectField label="Left version" value={leftVersion || versionOptions[0]} options={versionOptions} onChange={setLeftVersion} /><SelectField label="Right version" value={rightVersion || versionOptions[1] || versionOptions[0]} options={versionOptions} onChange={setRightVersion} /></div> : <Text size="small" className="text-ui-fg-subtle">No versions.</Text>}
              <pre className="max-h-[420px] overflow-auto rounded-md bg-ui-bg-subtle p-4 text-ui-fg-subtle">{JSON.stringify(diff, null, 2)}</pre>
            </Container>
          </Drawer.Body>
          <Drawer.Footer><Drawer.Close asChild><Button size="small" variant="secondary">Close</Button></Drawer.Close></Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Ready Configurations", icon: ServerStack })

export default ReadyConfigurationsPage
