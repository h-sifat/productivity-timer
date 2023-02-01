import { SuggestionsProvider } from "tui/pages/timer/suggestions-provider";

const suggestionProvider = new SuggestionsProvider();

beforeEach(() => {
  suggestionProvider.update({ project: [], category: [] });
});

describe.each(["project", "category"] as const)("Suggestions/%s", (refType) => {
  const sampleNameRef = Object.freeze({
    type: refType,
    identifier: "bel",
    identifierType: "name",
  });

  const sampleIdRef = Object.freeze({
    type: refType,
    identifier: "d",
    identifierType: "id",
  });

  it.each([
    {
      options: {},
      expected: [],
      documents: [],
      ref: sampleNameRef,
      case: "nameRef: returns empty array if there is no documents",
    },
    {
      expected: [],
      documents: [],
      ref: sampleNameRef,
      options: { exactMatch: true },
      case: "nameRef with exactMatch: returns empty array if there is no documents",
    },
    {
      options: {},
      expected: [],
      documents: [],
      ref: sampleIdRef,
      case: "idRef: returns empty array if there is no documents",
    },
    {
      options: {},
      expected: [{ name: "a", id: "a" }],
      documents: [{ name: "a", id: "a" }],
      ref: {
        type: refType,
        identifierType: "id",
        identifier: "a",
      },
      case: "idRef: returns the document with the given id if exists",
    },
    {
      options: {},
      expected: [{ name: "Anna", id: "a" }],
      documents: [
        { name: "Anna", id: "a" },
        { name: "alex", id: "d" },
      ],
      ref: {
        type: refType,
        identifierType: "name",
        identifier: "nn",
      },
      case: "nameRef: returns the document with the matching name",
    },
    {
      options: { exactMatch: true },
      expected: [],
      documents: [
        { name: "Anna", id: "a" },
        { name: "alex", id: "d" },
      ],
      ref: {
        type: refType,
        identifier: "nn",
        identifierType: "name",
      },
      case: "nameRef: doesn't match name partially if exactMatch option is true",
    },
    {
      options: { exactMatch: true },
      expected: [{ name: "Anna", id: "a" }],
      documents: [{ name: "Anna", id: "a" }],
      ref: {
        type: refType,
        identifier: "Anna",
        identifierType: "name",
      },
      case: "nameRef with exactMatch flag: returns the document that exactly matches the name",
    },
  ] as const)("$case", ({ ref, documents, expected, options }) => {
    suggestionProvider.update({ [refType]: documents });

    const suggestions = suggestionProvider.getSuggestions(ref, options);
    expect(suggestions).toEqual(expected);
  });
});
