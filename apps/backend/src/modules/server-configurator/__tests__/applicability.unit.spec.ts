import {
  componentAppliesToModel,
  getApplicability,
} from "../applicability"

describe("server configurator applicability", () => {
  const model = {
    slug: "hpe-dl360-gen10",
    brand: "HPE",
    family: "ProLiant DL360",
    generation: "Gen10",
    chassis_type: "8SFF",
  }

  it("normalizes missing applicability to empty candidate constraints", () => {
    expect(getApplicability({ specs_json: {} })).toEqual({
      brands: [],
      families: [],
      generations: [],
      server_model_slugs: [],
      chassis_types: [],
      exclude_server_model_slugs: [],
    })
  })

  it("honors explicit exclusions before positive candidate constraints", () => {
    const component = {
      specs_json: {
        applicability: {
          brands: ["HPE"],
          exclude_server_model_slugs: [model.slug],
        },
      },
    }

    expect(componentAppliesToModel(component, model)).toBe(false)
  })
})
