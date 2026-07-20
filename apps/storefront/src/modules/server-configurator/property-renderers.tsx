import type { ComponentAttribute, PresentationProperty } from "@lib/server-configurator/data"

type PropertyLike = Pick<PresentationProperty, "value" | "unit" | "value_type"> & Partial<Pick<PresentationProperty, "state">>

const STATE_LABELS: Record<string, string> = {
  not_supported: "Не поддерживается",
  not_specified: "Не указано",
  not_applicable: "Не применимо",
}

export function propertyText(property: PropertyLike | ComponentAttribute | undefined) {
  if (!property) return STATE_LABELS.not_specified
  const state = "state" in property ? property.state : undefined
  if (state && state !== "value") return STATE_LABELS[state] || STATE_LABELS.not_specified
  const value = property.value
  if (value === null || value === undefined || value === "") return STATE_LABELS.not_specified
  if (typeof value === "boolean") return value ? "Да" : STATE_LABELS.not_supported
  if (Array.isArray(value)) return value.length ? value.map(String).join(" / ") : STATE_LABELS.not_specified
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    return entries.length ? entries.map(([key, entry]) => `${key}: ${String(entry)}`).join("; ") : STATE_LABELS.not_specified
  }
  return `${String(value)}${property.unit ? ` ${property.unit}` : ""}`
}

export function PropertyValue({ property }: { property: PropertyLike | ComponentAttribute | undefined }) {
  const state = property && "state" in property ? property.state : undefined
  return <span className={state && state !== "value" ? "property-value explicit-state" : "property-value"}>{propertyText(property)}</span>
}

export function PropertyList({ properties }: { properties: Array<PresentationProperty | ComponentAttribute> }) {
  if (!properties.length) return <p className="property-empty">Характеристики пока не указаны.</p>
  return (
    <dl className="property-list">
      {properties.map((property) => (
        <div key={property.key}>
          <dt>
            {property.label}
            {property.compatibility_status === "informational" ? <small>информационно</small> : null}
          </dt>
          <dd><PropertyValue property={property} /></dd>
        </div>
      ))}
    </dl>
  )
}
