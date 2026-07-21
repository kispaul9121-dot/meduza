import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/smoke",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:8000",
    channel: "chrome",
  },
  webServer: [
    {
      command: "node tests/smoke/mock-medusa.cjs",
      url: "http://127.0.0.1:9100/health",
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: "npm run dev",
      url: "http://127.0.0.1:8000/robots.txt",
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...process.env,
        NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_test_stage_02_smoke",
        NEXT_PUBLIC_MEDUSA_BACKEND_URL: "http://127.0.0.1:9100",
        NEXT_PUBLIC_BASE_URL: "http://127.0.0.1:8000",
      },
    },
  ],
})
