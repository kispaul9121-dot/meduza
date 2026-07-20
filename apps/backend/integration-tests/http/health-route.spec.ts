import { GET } from "../../src/api/store/custom/route"

describe("GET /store/custom", () => {
  it("returns the public health response", async () => {
    const sendStatus = jest.fn()

    await GET({} as never, { sendStatus } as never)

    expect(sendStatus).toHaveBeenCalledWith(200)
  })
})
