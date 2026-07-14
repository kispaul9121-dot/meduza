import { defaultComponentsById, defaultConfiguratorComponents } from "./default-components"

const DEV_FALLBACK_MESSAGE =
  "Server configurator is using DEV fallback because DB options are empty. Do not use this in production."

export function isDevConfiguratorFallbackEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.SERVER_CONFIGURATOR_DEV_FALLBACK === "true"
  )
}

export function shouldUseDevConfiguratorFallback(dbRows: unknown[]) {
  return dbRows.length === 0 && isDevConfiguratorFallbackEnabled()
}

export function getDevFallbackComponents() {
  console.warn(DEV_FALLBACK_MESSAGE)
  return defaultConfiguratorComponents
}

export function getDevFallbackComponentsById(ids: string[]) {
  console.warn(DEV_FALLBACK_MESSAGE)
  return defaultComponentsById(ids)
}

export function runtimeFallbackStatus() {
  return {
    enabled: isDevConfiguratorFallbackEnabled(),
    warning: isDevConfiguratorFallbackEnabled() ? DEV_FALLBACK_MESSAGE : null,
  }
}
