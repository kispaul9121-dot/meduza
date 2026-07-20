import { TraceEntry, ValidationIssue } from "./types"

export function array<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : value === undefined || value === null ? [] : [value as T]
}

export function number(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function text(value: unknown): string {
  return String(value ?? "").trim().toLowerCase()
}

export function specs(component: any): Record<string, any> {
  return {
    ...(component?.specs_json || {}),
    ...(component?.normalized_specs_json || {}),
  }
}

export function componentText(component: any): string {
  const value = specs(component)
  return [
    component?.public_name,
    component?.short_name,
    component?.model,
    component?.brand,
    value.interface,
    ...array(value.interfaces),
    value.form_factor,
    value.slot_type,
    value.connector,
  ].filter(Boolean).join(" ").toLowerCase()
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

export function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object") return (value as Record<string, unknown>)[key]
    return undefined
  }, source)
}

export function stableSort<T>(values: T[], key: (value: T) => string): T[] {
  return [...values].sort((left, right) => key(left).localeCompare(key(right)))
}

export function makeIssue(
  code: string,
  message: string,
  validator: string,
  severity: ValidationIssue["severity"] = "blocker",
  extra: Partial<ValidationIssue> = {}
): ValidationIssue {
  return { code, message, validator, severity, ...extra }
}

export function issueTrace(issue: ValidationIssue): TraceEntry {
  return {
    phase: "validator",
    validator: issue.validator,
    result: issue.severity === "blocker" ? "fail" : "unresolved",
    reason_code: issue.code,
    message: issue.message,
    component_id: issue.component_id,
    source_reference: issue.source_reference,
    details: issue.details,
  }
}

