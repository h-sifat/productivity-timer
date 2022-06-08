const deepFreeze = require("../../../src/util/deepFreeze");

/**
 * This untested function works (probably), trust me!
 * */
function get(object, keyArray) {
  if (!keyArray) return object;

  let currentValue = object;

  for (let i = 0; i < keyArray.length; i++) {
    const key = keyArray[i];

    if (typeof currentValue === "object") {
      if (key in currentValue) currentValue = currentValue[key];
      else return undefined;
    } else
      throw new Error(
        `object.${keyArray.slice(0, i).join(".")} is not an object.`
      );
  }

  return currentValue;
}

describe("deepFreeze", () => {
  it.each([
    {
      testCase: "returns the passed value if it is not an object",
      object: 2,
      testFieldKeyArray: undefined,
    },

    {
      testCase: "freezes the first level of an object",
      object: { a: 1 },
      testFieldKeyArray: undefined,
    },
    {
      testCase: "freezes the second level of an object",
      object: { a: 1, b: { c: 1 } },
      testFieldKeyArray: ["b"],
    },
    {
      testCase: "freezes the third level of an object",
      object: { a: 1, b: { c: 1, d: { e: 1, x: 2 } } },
      testFieldKeyArray: ["b", "d"],
    },
    {
      testCase: "freezes an array",
      object: { a: 1, b: [1, 2] },
      testFieldKeyArray: ["b"],
    },
    {
      testCase: "freezes an objects inside an array",
      object: { a: 1, b: [{ c: 3 }] },
      testFieldKeyArray: ["b", "0"],
    },
  ])("$testCase", ({ object, testFieldKeyArray }) => {
    const frozenObject = deepFreeze(object);

    expect(frozenObject).toEqual(object);

    const unfrozenTestFieldValue = get(object, testFieldKeyArray);
    const frozenTestFieldValue = get(frozenObject, testFieldKeyArray);

    expect(unfrozenTestFieldValue).toEqual(frozenTestFieldValue);
    expect(Object.isFrozen(frozenTestFieldValue)).toBeTruthy();
  });
});
