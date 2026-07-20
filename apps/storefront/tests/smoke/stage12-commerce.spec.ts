import { expect, test } from "@playwright/test"

const draft = {
  server_model_slug: "hpe-proliant-dl360-gen10-10sff-nvme-premium",
  selected_components: [],
  explicit_none: [],
}

test("stage 12 RFQ is a separate persisted B2B flow", async ({ page }) => {
  await page.addInitScript((value) => {
    window.localStorage.setItem("server-configurator-rfq-draft", JSON.stringify(value))
  }, draft)
  await page.goto("/rfq?draft=1")
  await expect(page.getByRole("heading", { name: "Запрос коммерческого предложения", level: 1 })).toBeVisible()
  await expect(page.getByText("RFQ хранится отдельно от корзины")).toBeVisible()
  await page.getByLabel("Компания").fill("Stage 12 Browser Verification")
  await page.getByLabel("Контактное лицо").fill("Commerce Verifier")
  await page.getByLabel("Email").fill("stage12-browser@example.com")
  await page.getByLabel("Количество серверов").fill("2")
  await page.getByLabel("Комментарий").fill("E2E configurator to RFQ verification")
  await page.getByRole("button", { name: "Отправить запрос КП" }).click()
  await expect(page.getByRole("status")).toContainText("зарегистрирован со статусом requested", { timeout: 20_000 })
  await page.screenshot({ path: "../../reports/stage-12-artifacts/rfq-submitted.png", fullPage: true })
})

test("stage 12 server rejects tampered ready-configuration identity", async ({ page }) => {
  await page.addInitScript((value) => {
    window.localStorage.setItem("server-configurator-rfq-draft", JSON.stringify(value))
  }, {
    ...draft,
    ready_configuration_id: "ready_tampered",
    ready_configuration_version: 1,
    ready_snapshot_hash: "a".repeat(64),
  })
  await page.goto("/rfq?draft=1")
  await page.getByLabel("Компания").fill("Tampering Verification")
  await page.getByLabel("Контактное лицо").fill("Security Verifier")
  await page.getByLabel("Email").fill("tamper@example.com")
  await page.getByRole("button", { name: "Отправить запрос КП" }).click()
  await expect(page.getByRole("status")).not.toContainText("зарегистрирован", { timeout: 20_000 })
})

test("stage 12 exposes only the standard regional cart", async ({ page }) => {
  await page.goto("/dk/cart")
  await expect(page.locator(".server-cart-page")).toHaveCount(0)
  await expect(page.getByTestId("cart-container")).toBeVisible()
})
