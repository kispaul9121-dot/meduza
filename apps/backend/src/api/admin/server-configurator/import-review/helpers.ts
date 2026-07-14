export function text(value: unknown) {
  return String(value ?? "").trim()
}

export function boolQuery(value: unknown) {
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

export function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === "object") return Object.keys(value).length > 0
  return text(value).length > 0
}

export function specs(row: any) {
  return row?.specs_json && typeof row.specs_json === "object" ? row.specs_json : {}
}

export function pageRows<T>(rows: T[], limitValue: unknown, offsetValue: unknown) {
  const limit = Number(limitValue || 100)
  const offset = Number(offsetValue || 0)
  return {
    rows: rows.slice(offset, offset + limit),
    count: rows.length,
    limit,
    offset,
  }
}
