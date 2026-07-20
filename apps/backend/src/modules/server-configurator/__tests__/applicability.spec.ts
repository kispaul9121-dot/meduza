import { previewApplicability } from "../applicability"

describe("server configurator module candidate preview", () => {
  it("returns only models inside every configured candidate boundary", () => {
    const component = {
      specs_json: {
        applicability: {
          brands: ["HPE"],
          generations: ["Gen10"],
          chassis_types: ["8SFF"],
        },
      },
    }
    const models = [
      {
        id: "model_1",
        slug: "hpe-dl360-gen10",
        public_name: "HPE DL360 Gen10",
        brand: "HPE",
        family: "ProLiant DL360",
        generation: "Gen10",
        chassis_type: "8SFF",
      },
      {
        id: "model_2",
        slug: "dell-r640",
        public_name: "Dell R640",
        brand: "Dell",
        family: "PowerEdge R640",
        generation: "14G",
        chassis_type: "8SFF",
      },
    ]

    expect(previewApplicability(component, models)).toEqual([models[0]])
  })
})
