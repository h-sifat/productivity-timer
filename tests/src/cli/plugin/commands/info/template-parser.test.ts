import { parseInfoTemplate } from "cli/plugin/commands/info/template-parser";

describe("parseInfoTemplate", () => {
  it.each([
    { template: "a", result: { segments: ["a"], variables: [] } },
    {
      template: "a[duck]",
      result: { segments: ["a", ""], variables: [{ name: "duck", index: 1 }] },
    },
    {
      template: "a%[duck%]",
      result: { segments: ["a[duck]"], variables: [] },
    },
    {
      template: "%%",
      result: { segments: ["%"], variables: [] },
    },
  ])(
    `parse("$template") => segments: $result.segments`,
    ({ template, result }) => {
      expect(parseInfoTemplate(template)).toEqual(result);
    }
  );
});
