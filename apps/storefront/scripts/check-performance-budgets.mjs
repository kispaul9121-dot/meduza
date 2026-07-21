import { readdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = path.resolve(process.cwd(), ".next", "static", "chunks")
const maxTotalBytes = Number(process.env.PERF_MAX_TOTAL_JS_BYTES || 8_000_000)
const maxChunkBytes = Number(process.env.PERF_MAX_CHUNK_JS_BYTES || 1_500_000)
const maxChunkCount = Number(process.env.PERF_MAX_CHUNK_COUNT || 250)

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name)
      return entry.isDirectory() ? files(target) : [target]
    }),
  )
  return nested.flat()
}

let javascriptFiles
try {
  javascriptFiles = (await files(root)).filter((file) => file.endsWith(".js"))
} catch (error) {
  console.error(`Performance budget input is missing: ${root}`)
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const rows = await Promise.all(
  javascriptFiles.map(async (file) => ({
    file: path.relative(path.resolve(process.cwd(), ".next"), file),
    bytes: (await stat(file)).size,
  })),
)
rows.sort((left, right) => right.bytes - left.bytes)

const totalBytes = rows.reduce((total, row) => total + row.bytes, 0)
const largestChunkBytes = rows[0]?.bytes || 0
const violations = []
if (totalBytes > maxTotalBytes) {
  violations.push(`Total JavaScript ${totalBytes} exceeds ${maxTotalBytes} bytes.`)
}
if (largestChunkBytes > maxChunkBytes) {
  violations.push(`Largest JavaScript chunk ${largestChunkBytes} exceeds ${maxChunkBytes} bytes.`)
}
if (rows.length > maxChunkCount) {
  violations.push(`JavaScript chunk count ${rows.length} exceeds ${maxChunkCount}.`)
}

const report = {
  schema: "storefront-performance-budget.v1",
  generated_at: new Date().toISOString(),
  budgets: {
    max_total_js_bytes: maxTotalBytes,
    max_chunk_js_bytes: maxChunkBytes,
    max_chunk_count: maxChunkCount,
  },
  observed: {
    total_js_bytes: totalBytes,
    largest_chunk_bytes: largestChunkBytes,
    chunk_count: rows.length,
    largest_chunks: rows.slice(0, 15),
  },
  violations,
}

await writeFile(
  path.resolve(process.cwd(), ".next", "performance-budget-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
)

console.log(JSON.stringify(report.observed, null, 2))
if (violations.length) {
  violations.forEach((violation) => console.error(`PERF_BUDGET: ${violation}`))
  process.exit(1)
}
console.log("PERF_BUDGET: PASS")
