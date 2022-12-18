import { deepFreeze } from "common/util/other";
import { Request } from "src/controllers/interface";
import makeDeleteCategory from "src/controllers/category/delete-category";
import EPP from "common/util/epp";

const categoryService = Object.freeze({
  removeCategory: jest.fn(),
});

const deleteCategory = makeDeleteCategory({ categoryService });

beforeEach(() => {
  Object.values(categoryService).forEach((method) => method.mockReset());
});

const fakeCategory = Object.freeze({ name: "study", id: 1 });
const validRequestObject: Request = deepFreeze({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: "delete",
  path: "/categories",
});

describe("Validation", () => {
  it.each([
    {
      request: {
        ...validRequestObject,
        params: {},
      },
      errorCode: "MISSING_ID",
      case: `id is missing from params`,
    },
  ])(`returns ewc "$errorCode" if $case`, async ({ errorCode, request }) => {
    const response = await deleteCategory(request);
    expect(response).toEqual({
      body: {
        success: false,
        error: { message: expect.any(String), code: errorCode },
      },
    });

    Object.values(categoryService).forEach((method) => {
      expect(method).not.toHaveBeenCalled();
    });
  });
});

describe("Functionality", () => {
  it(`calls the categoryService.removeCategory with the given id and returns the response`, async () => {
    const id = "1";
    const request = { ...validRequestObject, params: { id } };

    const fakeEditCategoryResponse = [fakeCategory];
    categoryService.removeCategory.mockResolvedValueOnce(
      fakeEditCategoryResponse
    );

    const response = await deleteCategory(request);
    expect(response).toEqual({
      body: {
        success: true,
        data: fakeEditCategoryResponse,
      },
    });

    expect(categoryService.removeCategory).toHaveBeenCalledTimes(1);
    expect(categoryService.removeCategory).toHaveBeenCalledWith({ id });
  });

  it(`returns the error thrown by categoryService.removeCategory`, async () => {
    const id = "1";
    const request = { ...validRequestObject, params: { id } };

    const error = new EPP(`No category exists with id: "${id}"`, "NOT_FOUND");
    categoryService.removeCategory.mockRejectedValueOnce(error);

    const response = await deleteCategory(request);
    expect(response).toEqual({
      body: {
        success: false,
        error: { message: error.message, code: error.code },
      },
    });

    expect(categoryService.removeCategory).toHaveBeenCalledTimes(1);
    expect(categoryService.removeCategory).toHaveBeenCalledWith({ id });
  });
});
