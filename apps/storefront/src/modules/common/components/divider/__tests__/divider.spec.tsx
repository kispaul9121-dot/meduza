import { renderToStaticMarkup } from "react-dom/server"

import Divider from ".."

describe("Divider", () => {
  it("renders the shared divider style and consumer class", () => {
    const html = renderToStaticMarkup(<Divider className="stage-01-marker" />)

    expect(html).toContain("border-gray-200")
    expect(html).toContain("stage-01-marker")
  })
})
