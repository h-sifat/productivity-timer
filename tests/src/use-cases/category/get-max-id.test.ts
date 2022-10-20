import makeGetCategoryMaxId from "use-cases/category/get-max-id";

const db = Object.freeze({ getMaxId: jest.fn() });
const getCategoryMaxId = makeGetCategoryMaxId({ db });

beforeEach(() => {
  db.getMaxId.mockReset();
});

it(`returns the return value of db.getMaxId`, async () => {
  const maxId = 234;
  db.getMaxId.mockResolvedValueOnce(maxId);

  const result = await getCategoryMaxId();
  expect(result).toBe(maxId);
});
