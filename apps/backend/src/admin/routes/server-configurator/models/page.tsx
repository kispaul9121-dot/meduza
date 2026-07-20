import { Badge, Button, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../../lib/client"
import { adminGet, adminPost, joinList, numberValue, query, splitList } from "../_shared/api"
import { Field, SelectField } from "../_shared/form"
import { ServerModel } from "../_shared/types"

type ModelsResponse = { models: ServerModel[]; count: number }
type FieldErrors = Partial<Record<keyof ServerModel, string>>
type SaveResult = ServerModel | { server_model?: ServerModel; model?: ServerModel }
type Feedback = {
  tone: "success" | "warning" | "error"
  title: string
  lines: string[]
  slug?: string
  productId?: string | null
}
type ProductLinkStatus = {
  loading: boolean
  invalid: boolean
  mismatch: boolean
  message?: string
}

const dellR640SampleModel: Partial<ServerModel> = {
  medusa_product_id: "prod_01KXDW1R6AT9XB6H98YD9D21T3",
  medusa_variant_id: "variant_01KXDW1R8HCB8EAH29EG4TEJB4",
  brand: "Dell",
  family: "PowerEdge R640",
  generation: "14G",
  model: "R640",
  public_name: "Dell PowerEdge R640 8SFF",
  slug: "dell-poweredge-r640-8sff",
  form_factor: "1U",
  chassis_type: "8SFF",
  drive_bays_front: 8,
  drive_bays_rear: 0,
  drive_form_factor: "2.5",
  supported_drive_interfaces: ["SAS", "SATA"],
  backplane_type: "8SFF SAS/SATA",
  cpu_socket: "FCLGA3647",
  max_cpu: 2,
  ram_slots_total: 24,
  ram_slots_per_cpu: 12,
  max_ram_capacity: "3 TB",
  supported_ram_types: ["DDR4 RDIMM ECC", "DDR4 LRDIMM ECC"],
  supported_ram_speeds: ["2666", "2933"],
  psu_type: "Dell hot-plug redundant",
  cooling_profile: "standard",
  seo_title: "Dell PowerEdge R640 8SFF",
  seo_description: "Dell PowerEdge R640 8SFF 1U server configurator",
  source_doc_reference: "Dell PowerEdge R640 Technical Guide",
  enabled: true,
}

const requiredTextFields: Array<keyof ServerModel> = [
  "medusa_product_id",
  "medusa_variant_id",
  "brand",
  "family",
  "generation",
  "model",
  "public_name",
  "slug",
  "form_factor",
  "chassis_type",
  "drive_form_factor",
  "backplane_type",
  "cpu_socket",
  "max_ram_capacity",
  "psu_type",
  "cooling_profile",
  "seo_title",
  "seo_description",
  "source_doc_reference",
]

const requiredNumberFields: Array<keyof ServerModel> = [
  "drive_bays_front",
  "max_cpu",
  "ram_slots_total",
  "ram_slots_per_cpu",
]

const fieldHints: Partial<Record<keyof ServerModel, string>> = {
  medusa_product_id: "Product ID from Medusa Admin URL. Example: prod_...",
  medusa_variant_id: "Variant ID from the product variant URL. Example: variant_...",
  brand: "Vendor name shown in filters and compatibility rules.",
  family: "Use the real product family, e.g. PowerEdge R640.",
  generation: "Dell generation label, e.g. 14G.",
  model: "Short model name, e.g. R640.",
  public_name: "Customer-facing title in Store API and frontend.",
  slug: "URL slug for /servers/[slug]. Use lowercase latin letters, numbers and hyphens.",
  form_factor: "Rack height, e.g. 1U.",
  chassis_type: "Drive bay layout, e.g. 8SFF.",
  drive_form_factor: "Drive size, e.g. 2.5.",
  front_option_type: "Optional. Leave empty when the chassis has no front option.",
  backplane_type: "Backplane summary shown in configurator facts.",
  cpu_socket: "Use the CPU socket used by compatible CPU packs.",
  max_ram_capacity: "Human-readable capacity, e.g. 3 TB.",
  psu_type: "Power supply family for the chassis.",
  cooling_profile: "Cooling profile used by compatibility notes.",
  seo_title: "Title for Store API/frontend metadata.",
  seo_description: "Short description for frontend metadata.",
  source_doc_reference: "Document or internal source used for these facts.",
  supported_drive_interfaces: "Comma-separated list. Example: SAS, SATA.",
  supported_ram_types: "Comma-separated list. Example: DDR4 RDIMM ECC, DDR4 LRDIMM ECC.",
  supported_ram_speeds: "Comma-separated list. Example: 2666, 2933.",
}

const getSavedModel = (result: SaveResult): ServerModel =>
  ((result as any).server_model || (result as any).model || result) as ServerModel

const isBlank = (value: unknown) => value === undefined || value === null || String(value).trim() === ""

function validateDraft(draft: Partial<ServerModel>, models: ServerModel[] = []) {
  const errors: FieldErrors = {}

  requiredTextFields.forEach((field) => {
    if (isBlank(draft[field])) {
      errors[field] = "Required field. Fill this before saving."
    }
  })

  requiredNumberFields.forEach((field) => {
    const value = Number(draft[field])
    if (!Number.isFinite(value) || value <= 0) {
      errors[field] = "Must be a number greater than 0."
    }
  })

  if (Number(draft.drive_bays_rear ?? 0) < 0) {
    errors.drive_bays_rear = "Must be 0 or greater."
  }

  if (draft.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
    errors.slug = "Use lowercase letters, numbers and hyphens only."
  }

  if (draft.medusa_product_id && !String(draft.medusa_product_id).startsWith("prod_")) {
    errors.medusa_product_id = "Product ID must start with prod_."
  }

  if (draft.medusa_variant_id && !String(draft.medusa_variant_id).startsWith("variant_")) {
    errors.medusa_variant_id = "Variant ID must start with variant_."
  }

  const duplicate = models.find((model) => model.slug === draft.slug && model.id !== draft.id)
  if (duplicate) {
    errors.slug = `This slug is already used by ${duplicate.public_name}. Edit that row instead.`
  }

  return errors
}

function productLooksLinked(product: any, model: Partial<ServerModel>) {
  if (!product) return true
  const productText = [product.title, product.handle].filter(Boolean).join(" ").toLowerCase()
  const brand = String(model.brand || "").trim().toLowerCase()
  const modelName = String(model.model || model.family || "").trim().toLowerCase()
  const slugModelName = modelName.replace(/\s+/g, "-")

  if (brand && !productText.includes(brand)) return false
  if (modelName && !productText.includes(modelName) && !productText.includes(slugModelName)) return false
  return true
}

function ProductLink({
  model,
  onLinkStatus,
}: {
  model: Partial<ServerModel>
  onLinkStatus?: (status: ProductLinkStatus) => void
}) {
  const productId = model.medusa_product_id || ""
  const { data, isError, isLoading } = useQuery({
    queryKey: ["server-model-product-link", productId],
    queryFn: () => sdk.admin.product.retrieve(productId),
    enabled: Boolean(productId),
  })
  const product = (data as any)?.product
  const mismatch = Boolean(product && !productLooksLinked(product, model))
  const mismatchMessage = mismatch
    ? `Product ID points to "${product.title}", but this draft is "${model.public_name || model.brand}". Check medusa_product_id and medusa_variant_id.`
    : undefined

  useEffect(() => {
    onLinkStatus?.({
      loading: Boolean(productId && isLoading),
      invalid: Boolean(productId && isError),
      mismatch,
      message: isError ? "Product ID was not found in Medusa. Check medusa_product_id." : mismatchMessage,
    })
  }, [isError, isLoading, mismatch, mismatchMessage, onLinkStatus, productId])

  return (
    <Container>
      <Text size="small" weight="plus">Medusa Product Link</Text>
      <Text size="small" className="text-ui-fg-subtle">Product ID: {productId || "not linked"}</Text>
      <Text size="small" className="text-ui-fg-subtle">Variant ID: {model.medusa_variant_id || "not linked"}</Text>
      {product && <Text size="small">Handle: {product.handle} | Title: {product.title}</Text>}
      {productId && isError && <Badge color="red">Product or variant not found</Badge>}
      {mismatch && <Badge color="red">Product link does not match this server model</Badge>}
      {mismatchMessage && <Text size="small" className="text-ui-fg-error">{mismatchMessage}</Text>}
      {productId && <Link to={`/products/${productId}`}><Button size="small" variant="secondary">Open Product in Medusa Admin</Button></Link>}
    </Container>
  )
}

function FormFeedback({ feedback }: { feedback?: Feedback }) {
  if (!feedback) return null

  const toneClass = {
    success: "border-ui-border-success bg-ui-bg-subtle",
    warning: "border-ui-border-warning bg-ui-bg-subtle",
    error: "border-ui-border-error bg-ui-bg-subtle",
  }[feedback.tone]

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <Text size="small" leading="compact" weight="plus">{feedback.title}</Text>
      <div className="mt-2 flex flex-col gap-y-1">
        {feedback.lines.map((line) => (
          <Text key={line} size="small" leading="compact" className="text-ui-fg-subtle">{line}</Text>
        ))}
        {feedback.slug && (
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={`/store/server-configurator/models/${feedback.slug}`}>
              <Button size="small" variant="secondary">Open Store API</Button>
            </a>
            <a href={`/servers/${feedback.slug}`}>
              <Button size="small" variant="secondary">Open Frontend</Button>
            </a>
            {feedback.productId && (
              <Link to={`/products/${feedback.productId}`}>
                <Button size="small" variant="secondary">Open Product</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ModelForm({
  value,
  errors,
  onChange,
}: {
  value: Partial<ServerModel>
  errors: FieldErrors
  onChange: (value: Partial<ServerModel>) => void
}) {
  const set = (key: keyof ServerModel, next: any) => onChange({ ...value, [key]: next })
  const isRequired = (key: keyof ServerModel) => requiredTextFields.includes(key) || requiredNumberFields.includes(key)
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {["medusa_product_id", "medusa_variant_id", "brand", "family", "generation", "model", "public_name", "slug", "form_factor", "chassis_type", "drive_form_factor", "front_option_type", "backplane_type", "cpu_socket", "max_ram_capacity", "psu_type", "cooling_profile", "seo_title", "seo_description", "source_doc_reference"].map((key) => (
        <Field
          key={key}
          label={key}
          value={(value as any)[key] || ""}
          required={isRequired(key as keyof ServerModel)}
          hint={fieldHints[key as keyof ServerModel]}
          error={errors[key as keyof ServerModel]}
          onChange={(next) => set(key as keyof ServerModel, next)}
        />
      ))}
      {["drive_bays_front", "drive_bays_rear", "max_cpu", "ram_slots_total", "ram_slots_per_cpu"].map((key) => (
        <Field
          key={key}
          type="number"
          label={key}
          value={(value as any)[key] ?? 0}
          required={isRequired(key as keyof ServerModel)}
          error={errors[key as keyof ServerModel]}
          onChange={(next) => set(key as keyof ServerModel, numberValue(next))}
        />
      ))}
      <Field label="supported_drive_interfaces" value={joinList(value.supported_drive_interfaces)} hint={fieldHints.supported_drive_interfaces} onChange={(next) => set("supported_drive_interfaces", splitList(next))} />
      <Field label="supported_ram_types" value={joinList(value.supported_ram_types)} hint={fieldHints.supported_ram_types} onChange={(next) => set("supported_ram_types", splitList(next))} />
      <Field label="supported_ram_speeds" value={joinList(value.supported_ram_speeds)} hint={fieldHints.supported_ram_speeds} onChange={(next) => set("supported_ram_speeds", splitList(next))} />
      <SelectField
        label="enabled"
        value={String(value.enabled ?? true)}
        options={["true", "false"]}
        hint="true publishes this model to Store API and the frontend route."
        onChange={(next) => set("enabled", next === "true")}
      />
    </div>
  )
}

const ModelsPage = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ q: "", brand: "", family: "", generation: "", chassis_type: "", enabled: "" })
  const [draft, setDraft] = useState<Partial<ServerModel>>(dellR640SampleModel)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [productLinkStatus, setProductLinkStatus] = useState<ProductLinkStatus>({ loading: false, invalid: false, mismatch: false })
  const [feedback, setFeedback] = useState<Feedback | undefined>({
    tone: "warning",
    title: "Dell R640 sample is loaded",
    lines: [
      "Review the product and variant IDs, then save.",
      "After saving, this model is published when enabled is true.",
    ],
  })
  const { data, isLoading } = useQuery({
    queryKey: ["sc-models", filters],
    queryFn: () => adminGet<ModelsResponse>(`/admin/server-configurator/models${query(filters)}`),
  })
  const save = useMutation({
    mutationFn: () => adminPost<SaveResult>(draft.id ? `/admin/server-configurator/models/${draft.id}` : "/admin/server-configurator/models", draft),
    onSuccess: (result) => {
      const model = getSavedModel(result)
      queryClient.invalidateQueries({ queryKey: ["sc-models"] })
      setErrors({})
      setFeedback({
        tone: "success",
        title: "Server model saved and published",
        lines: [
          `${model.public_name} is saved in Server Configurator.`,
          `Store API: /store/server-configurator/models/${model.slug}`,
          `Frontend: /servers/${model.slug}`,
          model.medusa_product_id ? `Linked Medusa product: ${model.medusa_product_id}` : "Medusa product is not linked.",
        ],
        slug: model.slug,
        productId: model.medusa_product_id,
      })
      toast.success(`Server model saved: ${model.public_name}`)
    },
    onError: (error: Error) => {
      setFeedback({
        tone: "error",
        title: "Server model was not saved",
        lines: [error.message || "Check the highlighted fields and try again."],
      })
      toast.error(error.message || "Server model was not saved")
    },
  })
  const mutateModel = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action?: string; body?: unknown }) =>
      adminPost(`/admin/server-configurator/models/${id}${action ? `/${action}` : ""}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sc-models"] }),
  })

  const updateDraft = (next: Partial<ServerModel>) => {
    setDraft(next)
    setErrors({})
    setProductLinkStatus({ loading: false, invalid: false, mismatch: false })
    setFeedback(undefined)
  }

  const handleNew = () => {
    setDraft(dellR640SampleModel)
    setErrors({})
    setFeedback({
      tone: "warning",
      title: "New Dell R640 sample loaded",
      lines: [
        "The form is filled with a reference Dell PowerEdge R640 8SFF model.",
        "Check product/variant IDs before saving.",
      ],
    })
    toast.success("New Dell R640 sample loaded")
  }

  const handleSave = () => {
    const validation = validateDraft(draft, data?.models || [])
    setErrors(validation)
    if (Object.keys(validation).length > 0) {
      const fields = Object.keys(validation).join(", ")
      setFeedback({
        tone: "error",
        title: "Fix required fields before saving",
        lines: [`Fields with problems: ${fields}`],
      })
      toast.error(`Fill required fields: ${fields}`)
      return
    }

    if (productLinkStatus.loading || productLinkStatus.invalid || productLinkStatus.mismatch) {
      const message = productLinkStatus.loading
        ? "Wait until the Medusa Product Link check finishes."
        : productLinkStatus.message || "Product link does not match this server model."
      setFeedback({
        tone: "error",
        title: "Fix Medusa Product Link before saving",
        lines: [message],
      })
      toast.error(message)
      return
    }

    save.mutate()
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading>Server Models</Heading>
      <Container className="grid gap-3 lg:grid-cols-6">
        {Object.keys(filters).map((key) => (
          <Field key={key} label={key} value={(filters as any)[key]} onChange={(next) => setFilters({ ...filters, [key]: next })} />
        ))}
      </Container>
      <Container className="p-0">
        <Table>
          <Table.Body>
            {isLoading && <Table.Row><Table.Cell>Loading</Table.Cell></Table.Row>}
            {data?.models.map((model) => (
              <Table.Row key={model.id}>
                <Table.Cell><Text size="small" weight="plus">{model.public_name}</Text><Text size="small" className="text-ui-fg-subtle">{model.slug}</Text></Table.Cell>
                <Table.Cell>{model.brand} {model.generation}</Table.Cell>
                <Table.Cell>{model.chassis_type} / {model.form_factor}</Table.Cell>
                <Table.Cell><Badge color={model.enabled ? "green" : "grey"}>{model.enabled ? "enabled" : "disabled"}</Badge></Table.Cell>
                <Table.Cell className="flex gap-2">
                  <Link to={`/server-configurator/models/${model.id}/direct-components`}><Button size="small" variant="secondary">Direct components</Button></Link>
                  <Button size="small" variant="secondary" onClick={() => setDraft(model)}>Edit</Button>
                  <Button size="small" variant="secondary" onClick={() => mutateModel.mutate({ id: model.id, action: "duplicate" })}>Duplicate</Button>
                  <Button size="small" variant="secondary" onClick={() => mutateModel.mutate({ id: model.id, body: { enabled: !model.enabled } })}>{model.enabled ? "Disable" : "Enable"}</Button>
                  <a href={`/store/server-configurator/models/${model.slug}`}><Button size="small" variant="secondary">Store API</Button></a>
                  <a href={`/servers/${model.slug}`}><Button size="small" variant="secondary">Frontend</Button></a>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
      <Container className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h2">{draft.id ? "Edit Server Model" : "Create Server Model"}</Heading>
            <Text size="small" className="text-ui-fg-subtle">Fields marked with * are required before this model can be published.</Text>
          </div>
          <Button size="small" onClick={handleNew}>New</Button>
        </div>
        <FormFeedback feedback={feedback} />
        <ModelForm value={draft} errors={errors} onChange={updateDraft} />
        <ProductLink model={draft} onLinkStatus={setProductLinkStatus} />
        <Button size="small" isLoading={save.isPending} disabled={save.isPending} onClick={handleSave}>Save Server Model</Button>
      </Container>
    </div>
  )
}

export default ModelsPage
