import { MedusaContainer } from "@medusajs/framework"
import { SERVER_CONFIGURATOR_MODULE } from "../modules/server-configurator"
import { createCpuPacks } from "./intel-xeon/create-cpu-packs"
import { tryFetchIntelArk } from "./intel-xeon/fetch-intel-ark"
import { intelXeonScalable1stDraft } from "./intel-xeon/intel-xeon-scalable-1st-draft"
import { intelXeonScalable2ndDraft } from "./intel-xeon/intel-xeon-scalable-2nd-draft"
import { normalizeCpu } from "./intel-xeon/normalize-cpu"
import { writeIntelImportReport } from "./intel-xeon/report"
import { upsertCpus } from "./intel-xeon/upsert-cpus"

export default async function importIntelXeonScalableCpus({ container }: { container: MedusaContainer }) {
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const ark = await tryFetchIntelArk()
  const components = [...intelXeonScalable1stDraft, ...intelXeonScalable2ndDraft].map(normalizeCpu)
  const { report, imported } = await upsertCpus(service, components)
  const packs = await createCpuPacks(service, imported)
  const result = {
    ark,
    upsert: report,
    first_count: intelXeonScalable1stDraft.length,
    second_count: intelXeonScalable2ndDraft.length,
    packs,
  }

  await writeIntelImportReport(result)
  console.log(JSON.stringify(result, null, 2))
}
