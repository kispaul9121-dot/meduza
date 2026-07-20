import { POST as readinessPost } from "../../../api/admin/server-configurator/compatibility-readiness/route"
import { POST as validatePost } from "../../../api/store/server-configurator/validate/route"
import { ValidateServerConfigurationSchema } from "../../../api/store/server-configurator/validators"

describe("compatibility API contracts", () => {
  it("rejects missing model identity and invalid quantities at the endpoint boundary", () => {
    expect(ValidateServerConfigurationSchema.safeParse({ selected_components: [] }).success).toBe(false)
    expect(ValidateServerConfigurationSchema.safeParse({ server_model_slug: "server", selected_components: [{ component_id: "cpu", quantity: 0 }] }).success).toBe(false)
  })
  it("passes only validated input to the store engine", async () => {
    const result = { valid: true, trace: [] }
    const validateConfiguration = jest.fn(async () => result)
    const request = { validatedBody: { server_model_slug: "server", selected_components: [] }, body: { malicious: true }, scope: { resolve: () => ({ validateConfiguration }) } }
    const response = { json: jest.fn() }
    await validatePost(request as never, response as never)
    expect(validateConfiguration).toHaveBeenCalledWith(request.validatedBody)
    expect(response.json).toHaveBeenCalledWith(result)
  })
  it("exposes side-effect-free readiness through the protected admin route", async () => {
    const readiness = { ready: false, blockers: [{ code: "PROPERTY_VALIDATOR_MISSING" }] }
    const validateCompatibilityReadiness = jest.fn(async () => readiness)
    const request = { validatedBody: { mode: "guided_check" }, scope: { resolve: () => ({ validateCompatibilityReadiness }) } }
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    await readinessPost(request as never, response as never)
    expect(validateCompatibilityReadiness).toHaveBeenCalledWith(request.validatedBody)
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ readiness })
  })
})
