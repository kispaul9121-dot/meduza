import { intelXeonSources } from "./sources"

export async function tryFetchIntelArk() {
  try {
    const response = await fetch(intelXeonSources.intelProductSpecifications, {
      method: "GET",
      headers: { "user-agent": "Medusa server configurator import audit" },
    })
    return {
      ok: response.ok,
      status: response.status,
      source_url: intelXeonSources.intelProductSpecifications,
      note: response.ok
        ? "Intel product specifications page was reachable, but no stable public structured ARK export was available to this script."
        : "Intel product specifications page was not reachable.",
    }
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      source_url: intelXeonSources.intelProductSpecifications,
      note: error?.message || "Intel ARK request failed.",
    }
  }
}
