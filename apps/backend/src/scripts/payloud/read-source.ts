import fs from "node:fs/promises"
import path from "node:path"
import { report } from "./report"
import { sourceRoot } from "./source-files"

export function sourcePath(relativePath: string) {
  return path.join(sourceRoot, relativePath)
}

export function sourceReference(relativePath: string) {
  return `pauloud 2 / ${relativePath.replace(/\\/g, "/")}`
}

export async function readSource(relativePath: string) {
  const text = await fs.readFile(sourcePath(relativePath), "utf8")
  report.files_read.push(relativePath.replace(/\\/g, "/"))
  return text
}

function findBalanced(text: string, openIndex: number, open = "[", close = "]") {
  let depth = 0
  let quote: string | null = null
  let escaped = false

  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index]
    const previous = text[index - 1]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === quote && previous !== "\\") {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char
      continue
    }

    if (char === open) depth += 1
    if (char === close) depth -= 1
    if (depth === 0) return text.slice(openIndex, index + 1)
  }

  throw new Error(`Unable to find balanced ${open}${close} block.`)
}

function sanitizeJsLiteral(value: string) {
  return value
    .replace(/\s+as const/g, "")
    .replace(/\s*\.\.\.(quickSpecsSource|pcieConstraintFields|flexibleLomConstraintFields),?/g, "")
}

function evaluateArrayLiteral<T>(literal: string, context: Record<string, unknown> = {}): T[] {
  const keys = Object.keys(context)
  const values = Object.values(context)
  const body = `"use strict"; return (${sanitizeJsLiteral(literal)});`
  return new Function(...keys, body)(...values) as T[]
}

export async function extractExportedArray<T>(
  relativePath: string,
  exportName: string,
  context: Record<string, unknown> = {}
) {
  const text = await readSource(relativePath)
  const marker = `export const ${exportName}`
  const markerIndex = text.indexOf(marker)
  if (markerIndex < 0) throw new Error(`Missing export ${exportName} in ${relativePath}`)
  const openIndex = text.indexOf("[", markerIndex)
  const literal = findBalanced(text, openIndex)
  return evaluateArrayLiteral<T>(literal, context)
}

export async function extractConstArray<T>(
  relativePath: string,
  constName: string,
  context: Record<string, unknown> = {}
) {
  const text = await readSource(relativePath)
  const marker = `const ${constName}`
  const markerIndex = text.indexOf(marker)
  if (markerIndex < 0) throw new Error(`Missing const ${constName} in ${relativePath}`)
  const openIndex = text.indexOf("[", markerIndex)
  const literal = findBalanced(text, openIndex)
  return evaluateArrayLiteral<T>(literal, context)
}

export async function extractReturnedArray<T>(
  relativePath: string,
  functionName: string,
  context: Record<string, unknown> = {}
) {
  const text = await readSource(relativePath)
  const marker = `function ${functionName}`
  const markerIndex = text.indexOf(marker)
  if (markerIndex < 0) throw new Error(`Missing function ${functionName} in ${relativePath}`)
  const returnIndex = text.indexOf("return [", markerIndex)
  if (returnIndex < 0) throw new Error(`Missing returned array in ${functionName}`)
  const openIndex = text.indexOf("[", returnIndex)
  const literal = findBalanced(text, openIndex)
  return evaluateArrayLiteral<T>(literal, context)
}
