import { makeDocumentDeleteSideEffect } from "src/start-up/document-delete-side-effect";

const timer = Object.seal({
  ref: null as any,
  reset: jest.fn(),
  previousNonNullRef: null as any,
  deletePreviousNonNullRef: jest.fn(),
});

const fakeServer: any = Object.freeze({
  broadcast: jest.fn(),
});

const projectDeleteSideEffect = makeDocumentDeleteSideEffect({
  timer,
  server: fakeServer,
  documentType: "project",
  broadcastChannel: "project",
});
const categoryDeleteSideEffect = makeDocumentDeleteSideEffect({
  timer,
  server: fakeServer,
  documentType: "category",
  broadcastChannel: "category",
});

const sampleCategory = Object.freeze({ name: "A", id: "1" });
const sampleProject = Object.freeze({ name: "B", id: "2" });

beforeEach(() => {
  timer.ref = null;
  timer.previousNonNullRef = null;

  Object.values(timer)
    .filter((v) => typeof v === "function")
    .forEach((method) => method.mockReset());
});

it.each([
  {
    ref: null,
    deleted: [sampleCategory],
    documentDeleteSideEffect: categoryDeleteSideEffect,
    case: `categoryDeleteSideEffect: does not reset the timer if ref is null`,
  },
  {
    ref: null,
    deleted: [sampleCategory],
    documentDeleteSideEffect: projectDeleteSideEffect,
    case: `projectDeleteSideEffect: does not reset the timer if ref is null`,
  },
  {
    deleted: [sampleCategory],
    documentDeleteSideEffect: categoryDeleteSideEffect,
    ref: Object.freeze({ type: "project", id: sampleCategory.id }),
    case: `categoryDeleteSideEffect: does not reset the timer if ref type is not "category"`,
  },

  {
    deleted: [sampleProject],
    documentDeleteSideEffect: projectDeleteSideEffect,
    ref: Object.freeze({ type: "category", id: sampleProject.id }),
    case: `projectDeleteSideEffect: does not reset the timer if ref type is not "project"`,
  },
])(`$case`, async ({ ref, deleted, documentDeleteSideEffect }) => {
  timer.ref = ref;
  await documentDeleteSideEffect({ deleted });
  expect(timer.reset).not.toHaveBeenCalled();
});

it.each([
  {
    deleted: [sampleProject, sampleProject],
    documentDeleteSideEffect: projectDeleteSideEffect,
    ref: Object.freeze({ type: "project", id: sampleProject.id }),
    case: `projectDeleteSideEffect: resets the timer if ref.type is "project" and ref.id matches a deleted project`,
  },

  {
    deleted: [sampleCategory, sampleCategory],
    documentDeleteSideEffect: categoryDeleteSideEffect,
    ref: Object.freeze({ type: "category", id: sampleCategory.id }),
    case: `categoryDeleteSideEffect: resets the timer if ref.type is "category" and ref.id matches a deleted category`,
  },
])(`$case`, async ({ deleted, documentDeleteSideEffect, ref }) => {
  timer.ref = ref;
  await documentDeleteSideEffect({ deleted });
  expect(timer.reset).toHaveBeenCalled();
  expect(timer.deletePreviousNonNullRef).toHaveBeenCalled();
});

it.each([
  {
    deleted: [sampleProject, sampleProject],
    documentDeleteSideEffect: projectDeleteSideEffect,
    ref: Object.freeze({ type: "project", id: sampleProject.id }),
    case: `projectDeleteSideEffect: deletes the previousNonNullRef if matches`,
  },

  {
    deleted: [sampleCategory, sampleCategory],
    documentDeleteSideEffect: categoryDeleteSideEffect,
    ref: Object.freeze({ type: "category", id: sampleCategory.id }),
    case: `categoryDeleteSideEffect: deletes the previousNonNullRef if matches`,
  },
])(`$case`, async ({ deleted, documentDeleteSideEffect, ref }) => {
  timer.ref = null;
  timer.previousNonNullRef = ref;

  await documentDeleteSideEffect({ deleted });
  expect(timer.reset).not.toHaveBeenCalled();

  expect(timer.deletePreviousNonNullRef).toHaveBeenCalled();
});
