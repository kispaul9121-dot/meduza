import { sdk } from "../../../lib/client"

export function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value))
  })
  const value = search.toString()
  return value ? `?${value}` : ""
}

export function adminGet<T>(path: string) {
  return sdk.client.fetch<T>(path)
}

export function adminPost<T>(path: string, body?: unknown) {
  return sdk.client.fetch<T>(path, { method: "POST", body })
}

export function adminDelete<T>(path: string) {
  return sdk.client.fetch<T>(path, { method: "DELETE" })
}

export function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

export function joinList(value?: unknown) {
  return Array.isArray(value) ? value.join(", ") : ""
}

export function numberValue(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
