import { GET } from "../../../api/admin/server-configurator/domain-coverage/route"

describe("GET /admin/server-configurator/domain-coverage", () => {
  it("returns the module coverage result", async () => {
    const coverage = {
      compatibility_properties_without_mapping: ["future.fabric"],
    }
    const request = {
      scope: {
        resolve: jest.fn(() => ({
          getDomainCoverage: jest.fn(async () => coverage),
        })),
      },
    }
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await GET(request as never, response as never)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ coverage })
  })
})
