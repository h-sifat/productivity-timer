import EPP from "common/util/epp";
import { deepFreeze } from "common/util/other";
import type { Request } from "src/controllers/interface";
import makePostCategory from "src/controllers/category/post-category";

const categoryService = Object.freeze({
  addCategory: jest.fn(),
});

const postCategory = makePostCategory({ categoryService });

beforeEach(() => {
  Object.values(categoryService).forEach((method) => method.mockReset());
});

const validRequestObject: Request = deepFreeze({
  query: {},
  params: {},
  headers: {},
  method: "post",
  path: "/categories",
  body: { name: "study" },
});

describe("Functionality", () => {
  it(`passes the request.body to the addCategory service and returns the response`, async () => {
    const fakeCategory = Object.freeze({ name: "study", id: "1" });
    categoryService.addCategory.mockResolvedValueOnce(fakeCategory);

    const response = await postCategory(validRequestObject);
    expect(response).toEqual({ error: null, body: fakeCategory });

    expect(categoryService.addCategory).toHaveBeenCalledTimes(1);
    expect(categoryService.addCategory).toHaveBeenCalledWith({
      categoryInfo: validRequestObject.body,
    });
  });

  it(`returns any error in the error property of the response`, async () => {
    const error = new EPP(`You suck!`, "YOU_SUCK");
    categoryService.addCategory.mockRejectedValueOnce(error);

    const response = await postCategory(validRequestObject);
    expect(response).toEqual({
      body: {},
      error: {
        code: error.code,
        message: error.message,
      },
    });

    expect(categoryService.addCategory).toHaveBeenCalledTimes(1);
    expect(categoryService.addCategory).toHaveBeenCalledWith({
      categoryInfo: validRequestObject.body,
    });
  });
});
