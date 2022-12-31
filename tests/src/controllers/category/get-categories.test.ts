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
      errorCode: "INVALID_QUERY",
      case: "lookup is not a non-empty string",
      request: {
        ...defaultRequest,
        query: { id: "12", lookup: null },
      },
    },
    {
      errorCode: "INVALID_QUERY",
      case: "lookup is not a non-empty string",
      request: {
        ...defaultRequest,
        query: { id: "12", lookup: "duck_duck_go" },
      },
    },
  ])(`throws ewc "$errorCode" if $case`, async ({ request, errorCode }) => {
    const response = await getCategories(request);
    expect(response).toEqual({
      body: {
        success: false,
        error: { message: expect.any(String), code: errorCode },
      },
    });
  });
});

describe("Functionality", () => {
  it.each([
    {
      query: { lookup: "all" },
      fakeServiceResponse: [fakeCategory],
      expectedServiceCallArgument: undefined,
      expectedServiceToCall: "listCategories",
    },
    {
      query: { id: "1", lookup: "selfById" },
      fakeServiceResponse: fakeCategory,
      expectedServiceCallArgument: { id: "1" },
      expectedServiceToCall: "getCategoryById",
    },
    {
      query: { name: "study", lookup: "selfByName" },
      fakeServiceResponse: [fakeCategory],
      expectedServiceCallArgument: { name: "study" },
      expectedServiceToCall: "findByName",
    },
    {
      query: { id: "1", lookup: "children" },
      fakeServiceResponse: [fakeCategory],
      expectedServiceToCall: "listSubCategories",
      expectedServiceCallArgument: { parentId: "1" },
    },
    {
      query: { id: "1", lookup: "parents" },
      fakeServiceResponse: [fakeCategory],
      expectedServiceCallArgument: { id: "1" },
      expectedServiceToCall: "listParentCategories",
    },
  ])(
    `calls the $expectedServiceToCall service if lookup = "$lookup"`,
    async (arg) => {
      const {
        query,
        fakeServiceResponse,
        expectedServiceCallArgument,
        expectedServiceToCall,
      } = arg;

      const request = Object.freeze({ ...defaultRequest, query });

      // @ts-ignore
      categoryService[expectedServiceToCall].mockResolvedValueOnce(
        fakeServiceResponse
      );

      const response = await getCategories(request);
      expect(response).toEqual({
        body: { success: true, data: fakeServiceResponse },
      });

      // @ts-ignore
      expect(categoryService[expectedServiceToCall]).toHaveBeenCalledTimes(1);

      if (expectedServiceCallArgument)
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
