import { Input, Label, Select, Text, Textarea } from "@medusajs/ui"
import { ChangeEvent } from "react"

export function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  hint,
  error,
  placeholder,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  required?: boolean
  hint?: string
  error?: string
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-y-1">
      <Label>{label}{required ? " *" : ""}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={error ? "border-ui-border-error" : undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
      {error && <Text size="small" className="text-ui-fg-error">{error}</Text>}
      {!error && hint && <Text size="small" className="text-ui-fg-subtle">{hint}</Text>}
    </label>
  )
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
  error,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  hint?: string
  error?: string
}) {
  return (
    <label className="flex flex-col gap-y-1">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {options.map((item) => (
            <Select.Item key={item} value={item}>
              {item || "empty"}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      {error && <Text size="small" className="text-ui-fg-error">{error}</Text>}
      {!error && hint && <Text size="small" className="text-ui-fg-subtle">{hint}</Text>}
    </label>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <label className="flex flex-col gap-y-1">
      <Label>{label}</Label>
      <Textarea value={value} rows={rows} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)} />
    </label>
  )
}

export function RawPreview({ value }: { value: unknown }) {
  return (
    <details className="rounded-md border border-ui-border-base p-3">
      <summary>
        <Text size="small" weight="plus">Raw JSON preview</Text>
      </summary>
      <pre className="mt-3 max-h-[320px] overflow-auto text-ui-fg-subtle">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  )
}
