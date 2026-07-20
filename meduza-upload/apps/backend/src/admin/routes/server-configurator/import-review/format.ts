export function spec(row: { specs_json?: Record<string, any> }, key: string) {
  return row.specs_json?.[key]
}

export function yesNo(value: unknown) {
  return value ? "Yes" : "No"
}

export function truncate(value: unknown, max = 72) {
  const text = String(value ?? "")
  return text.length > max ? `${text.slice(0, max - 3)}...` : text
}

export function logicalType(row: { type: string; specs_json?: Record<string, any> }) {
  return row.type === "backplane" && row.specs_json?.media_bay ? "media_bay" : row.type
}

export function prettyJson(value: unknown) {
  return JSON.stringify(value ?? null, null, 2)
}
