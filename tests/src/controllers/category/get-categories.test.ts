import { deepFreeze } from "common/util/other";
import { Request } from "src/controllers/interface";
import makeGetCategories from "src/controllers/category/get-categories";

const categoryService = Object.freeze({
  findByName: jest.fn(),
  listCategories: jest.fn(),
  getCategoryById: jest.fn(),
  listSubCategories: jest.fn(),
  listParentCategories: jest.fn(),
});

const getCategories = makeGetCategories({ categoryService });

beforeEach(() => {
  Object.values(categoryService).forEach((service) => service.mockReset());
});

const defaultRequest: Request = deepFreeze({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: "get",
  path: "categories",
});

const fakeCategory = Object.freeze({ name: "study", id: 1 });

describe("Validation", () => {
  it.each([
    {
      errorCode: "INVALID_QUERY_TYPE",
      case: "lookup is not a non-empty string",
      request: {
        ...defaultRequest,
        params: { id: "12" },
        query: { lookup: null },
      },
    },
    {
      errorCode: "INVALID_QUERY_TYPE",
      case: "lookup is not a non-empty string",
      request: {
        ...defaultRequest,
        params: { id: "12" },
        query: { lookup: "duck_duck_go" },
      },
    },
  ])(`throws ewc "$errorCode" if $case`, async ({ request, errorCode }) => {
    const response = await getCategories(request);
    expect(response).toEqual({
      body: {},
      error: { message: expect.any(String), code: errorCode },
    });
  });
});

describe("Functionality", () => {
  it(`calls the listCategories service if no "id" is provided in the parameter`, async () => {
    const request = { ...defaultRequest, params: {} };
    const fakeCategories = Object.freeze([fakeCategory]);

    categoryService.listCategories.mockResolvedValueOnce(fakeCategories);

    const response = await getCategories(request);
    expect(response).toEqual({ error: null, body: fakeCategories });

    expect(categoryService.listCategories).toHaveBeenCalledTimes(1);

    for (const [name, service] of Object.entries(categoryService))
      if (name !== "listCategories") expect(service).not.toHaveBeenCalled();
  });

  it.each([
    {
      id: "1",
      lookup: "self-by-id",
      fakeServiceResponse: fakeCategory,
      expectedServiceCallArgument: { id: "1" },
      expectedServiceToCall: "getCategoryById",
    },
    {
      id: "study",
      lookup: "self-by-name",
      fakeServiceResponse: [fakeCategory],
      expectedServiceCallArgument: { name: "study" },
      expectedServiceToCall: "findByName",
    },
    {
      id: "1",
      lookup: "children",
      fakeServiceResponse: [fakeCategory],
      expectedServiceToCall: "listSubCategories",
      expectedServiceCallArgument: { parentId: "1" },
    },
    {
      id: "1",
      lookup: "parents",
      fakeServiceResponse: [fakeCategory],
      expectedServiceCallArgument: { id: "1" },
      expectedServiceToCall: "listParentCategories",
    },
  ])(
    `calls the $expectedServiceToCall service if an id parameter is provided and lookup = "$lookup"`,
    async (arg) => {
      const {
        id,
        lookup,
        fakeServiceResponse,
        expectedServiceCallArgument,
        expectedServiceToCall,
      } = arg;

      const request = Object.freeze({
        ...defaultRequest,
        params: { id },
        query: { lookup },
      });

      // @ts-ignore
      categoryService[expectedServiceToCall].mockResolvedValueOnce(
        fakeServiceResponse
      );

      const response = await getCategories(request);
      expect(response).toEqual({ error: null, body: fakeServiceResponse });

      // @ts-ignore
      expect(categoryService[expectedServiceToCall]).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(categoryService[expectedServiceToCall]).toHaveBeenCalledWith(
        expectedServiceCallArgument
      );

      for (const [name, service] of Object.entries(categoryService))
        if (name !== expectedServiceToCall)
          expect(service).not.toHaveBeenCalled();
    }
  );
});
