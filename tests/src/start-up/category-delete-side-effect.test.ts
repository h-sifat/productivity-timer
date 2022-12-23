import { makeCategoryDeleteSideEffect } from "src/start-up/category-delete-side-effect";

const timer = Object.seal({
  ref: null as any,
  reset: jest.fn(),
});

const deleteSideEffect = makeCategoryDeleteSideEffect({ timer });
const sampleCategory = Object.freeze({ name: "A", id: "1" });

beforeEach(() => {
  timer.reset.mockReset();
  timer.ref = null;
});

it.each([
  {
    ref: null,
    sideEffectArg: Object.freeze({
      id: sampleCategory.id,
      deleted: [sampleCategory],
    }),
    case: `does not reset the timer if ref is null`,
  },
  {
    ref: Object.freeze({ type: "project", id: sampleCategory.id }),
    sideEffectArg: Object.freeze({
      id: sampleCategory.id,
      deleted: [sampleCategory],
    }),
    case: `does not reset the timer if ref type is not "category"`,
  },
])(`$case`, async ({ ref, sideEffectArg }) => {
  timer.ref = ref;
  await deleteSideEffect(sideEffectArg as any);

  expect(timer.reset).not.toHaveBeenCalled();
});

it(`resets the timer if ref.type = "category" and ref.id matches a deleted category`, async () => {
  timer.ref = Object.freeze({ type: "category", id: sampleCategory.id });
  await deleteSideEffect({
    id: sampleCategory.id,
    deleted: Object.freeze([sampleCategory, sampleCategory]) as any,
  });

  expect(timer.reset).toHaveBeenCalledTimes(1);
});
